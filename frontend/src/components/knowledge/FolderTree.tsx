import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { folderService } from '@/services/folderService';
import { KnowledgeFolder, FolderTreeNode } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FolderTreeProps {
  selectedFolderId?: string;
  onFolderSelect: (folderId?: string) => void;
  onFolderChange?: () => void;
  compact?: boolean;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  selectedFolderId,
  onFolderSelect,
  onFolderChange,
  compact = false,
}) => {
  const [tree, setTree] = useState<FolderTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string | undefined>();
  const [editingFolder, setEditingFolder] = useState<KnowledgeFolder | null>(null);

  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    const treeData = await folderService.buildFolderTree();
    setTree(treeData);
  };

  const toggleExpand = (folderId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await folderService.createFolder(newFolderName, parentFolderId);
      setNewFolderName('');
      setParentFolderId(undefined);
      setShowNewFolderDialog(false);
      await loadTree();
      onFolderChange?.();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این فولدر را حذف کنید؟')) {
      return;
    }

    try {
      await folderService.deleteFolder(folderId, false);
      await loadTree();
      onFolderChange?.();
      if (selectedFolderId === folderId) {
        onFolderSelect(undefined);
      }
    } catch (error) {
      alert('خطا: این فولدر دارای زیرفولدر یا محتوا است');
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;

    try {
      await folderService.updateFolder(editingFolder.id, {
        name: newFolderName,
      });
      setEditingFolder(null);
      setNewFolderName('');
      await loadTree();
      onFolderChange?.();
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const renderNode = (node: FolderTreeNode, level: number = 0) => {
    const isExpanded = expandedIds.has(node.folder.id);
    const isSelected = selectedFolderId === node.folder.id;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.folder.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
            compact ? 'py-1.5 px-2' : 'py-2 px-3',
            isSelected && 'bg-primary/10 border border-primary/30',
            'group'
          )}
          style={{ paddingRight: `${level * 20 + 12}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpand(node.folder.id)}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}

          {!hasChildren && <div className="w-5" />}

          <div
            className="flex items-center gap-2 flex-1"
            onClick={() => onFolderSelect(node.folder.id)}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-primary" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={cn('font-medium', compact ? 'text-sm' : 'text-sm')}>
              {node.folder.name}
            </span>
            {node.folder.items_count !== undefined && node.folder.items_count > 0 && (
              <span className="text-xs text-muted-foreground">
                ({node.folder.items_count})
              </span>
            )}
          </div>

          {!compact && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    setParentFolderId(node.folder.id);
                    setShowNewFolderDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  فولدر جدید
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingFolder(node.folder);
                    setNewFolderName(node.folder.name);
                  }}
                >
                  <Edit2 className="h-4 w-4 ml-2" />
                  تغییر نام
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteFolder(node.folder.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && node.children.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {node.children.map(child => renderNode(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={cn('space-y-2', compact && 'space-y-1')}>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Folder className="h-5 w-5" />
            فولدرها
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setParentFolderId(undefined);
              setShowNewFolderDialog(true);
            }}
          >
            <Plus className="h-4 w-4 ml-2" />
            فولدر جدید
          </Button>
        </div>
      )}

      <div
        className={cn(
          'flex items-center gap-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
          compact ? 'py-1.5 px-2' : 'py-2 px-3',
          !selectedFolderId && 'bg-primary/10 border border-primary/30'
        )}
        onClick={() => onFolderSelect(undefined)}
      >
        <FolderOpen className="h-4 w-4 text-primary" />
        <span className={cn('font-medium', compact ? 'text-sm' : 'text-sm')}>
          همه آیتم‌ها
        </span>
      </div>

      <div className={cn('space-y-1', compact && 'space-y-0.5')}>
        {tree.map(node => renderNode(node))}
      </div>

      <Dialog
        open={showNewFolderDialog || editingFolder !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowNewFolderDialog(false);
            setEditingFolder(null);
            setNewFolderName('');
            setParentFolderId(undefined);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? 'تغییر نام فولدر' : 'فولدر جدید'}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="نام فولدر"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                editingFolder ? handleRenameFolder() : handleCreateFolder();
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewFolderDialog(false);
                setEditingFolder(null);
                setNewFolderName('');
              }}
            >
              لغو
            </Button>
            <Button
              onClick={editingFolder ? handleRenameFolder : handleCreateFolder}
            >
              {editingFolder ? 'ذخیره' : 'ایجاد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
