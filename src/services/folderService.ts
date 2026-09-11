import { KnowledgeFolder, FolderTreeNode } from '@/types';
import { supabase } from '@/integrations/supabase/client';

class FolderService {
  async createFolder(
    name: string,
    parentId?: string,
    options?: Partial<KnowledgeFolder>
  ): Promise<KnowledgeFolder> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error('User not authenticated');
    }

    const folder: Omit<KnowledgeFolder, 'items_count' | 'sub_folders_count'> = {
      id: crypto.randomUUID(),
      name,
      parent_id: parentId,
      order: await this.getNextOrder(parentId),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user.data.user.id,
      ...options,
    };

    if (user.data.user) {
      const { data, error } = await (supabase as any)
        .from('knowledge_folders')
        .insert(folder)
        .select()
        .single();

      if (error) {
        console.error('Supabase folder insert error:', error);
        return this.saveToLocalStorage(folder);
      }
      return data as KnowledgeFolder;
    } else {
      return this.saveToLocalStorage(folder);
    }
  }

  private saveToLocalStorage(folder: Omit<KnowledgeFolder, 'items_count' | 'sub_folders_count'>): KnowledgeFolder {
    const stored = localStorage.getItem('knowledge_folders') || '[]';
    const folders = JSON.parse(stored);
    const fullFolder = { ...folder, items_count: 0, sub_folders_count: 0 };
    folders.push(fullFolder);
    localStorage.setItem('knowledge_folders', JSON.stringify(folders));
    return fullFolder;
  }

  async getFolders(): Promise<KnowledgeFolder[]> {
    const user = await supabase.auth.getUser();
    
    if (user.data.user) {
      const { data, error } = await (supabase as any)
        .from('knowledge_folders')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('order', { ascending: true });

      if (error) {
        console.error('Supabase folder fetch error:', error);
        return this.getFromLocalStorage();
      }
      return (data || []) as KnowledgeFolder[];
    } else {
      return this.getFromLocalStorage();
    }
  }

  private getFromLocalStorage(): KnowledgeFolder[] {
    const stored = localStorage.getItem('knowledge_folders') || '[]';
    return JSON.parse(stored);
  }

  async getSubFolders(parentId?: string): Promise<KnowledgeFolder[]> {
    const allFolders = await this.getFolders();
    return allFolders.filter(f => f.parent_id === parentId);
  }

  async buildFolderTree(): Promise<FolderTreeNode[]> {
    const folders = await this.getFolders();
    const rootFolders = folders.filter(f => !f.parent_id);

    const buildNode = (folder: KnowledgeFolder): FolderTreeNode => {
      const children = folders.filter(f => f.parent_id === folder.id);
      return {
        folder,
        children: children.map(buildNode),
        items: [],
        expanded: false,
      };
    };

    return rootFolders.map(buildNode);
  }

  async updateFolder(
    id: string,
    updates: Partial<KnowledgeFolder>
  ): Promise<KnowledgeFolder> {
    const user = await supabase.auth.getUser();

    if (user.data.user) {
      const { data, error } = await (supabase as any)
        .from('knowledge_folders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase folder update error:', error);
        return this.updateLocalStorage(id, updates);
      }
      return data as KnowledgeFolder;
    } else {
      return this.updateLocalStorage(id, updates);
    }
  }

  private updateLocalStorage(id: string, updates: Partial<KnowledgeFolder>): KnowledgeFolder {
    const stored = localStorage.getItem('knowledge_folders') || '[]';
    const folders = JSON.parse(stored);
    const index = folders.findIndex((f: KnowledgeFolder) => f.id === id);
    
    if (index === -1) throw new Error('Folder not found');
    
    folders[index] = {
      ...folders[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    localStorage.setItem('knowledge_folders', JSON.stringify(folders));
    return folders[index];
  }

  async deleteFolder(id: string, deleteContents: boolean = false): Promise<void> {
    const user = await supabase.auth.getUser();
    const subFolders = await this.getSubFolders(id);
    
    if (subFolders.length > 0 && !deleteContents) {
      throw new Error('Folder has subfolders. Cannot delete.');
    }

    if (user.data.user) {
      if (deleteContents) {
        for (const sub of subFolders) {
          await this.deleteFolder(sub.id, true);
        }
      }

      const { error } = await (supabase as any)
        .from('knowledge_folders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase folder delete error:', error);
        this.deleteFromLocalStorage(id);
      }
    } else {
      this.deleteFromLocalStorage(id);
    }
  }

  private deleteFromLocalStorage(id: string): void {
    const stored = localStorage.getItem('knowledge_folders') || '[]';
    const folders = JSON.parse(stored);
    const filtered = folders.filter((f: KnowledgeFolder) => f.id !== id);
    localStorage.setItem('knowledge_folders', JSON.stringify(filtered));
  }

  async moveFolder(folderId: string, newParentId?: string): Promise<void> {
    if (newParentId && (await this.isDescendant(newParentId, folderId))) {
      throw new Error('Cannot move folder to its own descendant');
    }

    await this.updateFolder(folderId, { parent_id: newParentId });
  }

  private async isDescendant(folder1: string, folder2: string): Promise<boolean> {
    const folders = await this.getFolders();
    let current = folders.find(f => f.id === folder1);

    while (current) {
      if (current.id === folder2) return true;
      current = folders.find(f => f.id === current!.parent_id);
    }

    return false;
  }

  async getFolderPath(folderId: string): Promise<KnowledgeFolder[]> {
    const folders = await this.getFolders();
    const path: KnowledgeFolder[] = [];
    let current = folders.find(f => f.id === folderId);

    while (current) {
      path.unshift(current);
      current = folders.find(f => f.id === current!.parent_id);
    }

    return path;
  }

  private async getNextOrder(parentId?: string): Promise<number> {
    const siblings = await this.getSubFolders(parentId);
    return siblings.length > 0
      ? Math.max(...siblings.map(f => f.order)) + 1
      : 0;
  }
}

export const folderService = new FolderService();
