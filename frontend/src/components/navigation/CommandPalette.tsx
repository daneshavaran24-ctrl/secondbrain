import React from 'react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Home, Plus, Book, FileText, Film, Headphones, AudioLines, Search, Settings } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onAddItem
}) => {
  const handleCommand = (command: string) => {
    switch (command) {
      case 'home':
        window.location.href = '/';
        break;
      case 'add-item':
        onAddItem();
        break;
      case 'books':
        // Navigate to books tab - this would be handled by parent component
        break;
      case 'articles':
        // Navigate to articles tab
        break;
      case 'movies':
        // Navigate to movies tab
        break;
      case 'podcasts':
        // Navigate to podcasts tab
        break;
      case 'audiobooks':
        // Navigate to audiobooks tab
        break;
    }
    onClose();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder="جستجو در دستورات..." />
      <CommandList>
        <CommandEmpty>هیچ نتیجه‌ای یافت نشد.</CommandEmpty>
        
        <CommandGroup heading="ناوبری">
          <CommandItem onSelect={() => handleCommand('home')}>
            <Home className="ml-2 h-4 w-4" />
            <span>صفحه اصلی</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="اقدامات">
          <CommandItem onSelect={() => handleCommand('add-item')}>
            <Plus className="ml-2 h-4 w-4" />
            <span>افزودن آیتم جدید</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="دسته‌بندی‌ها">
          <CommandItem onSelect={() => handleCommand('books')}>
            <Book className="ml-2 h-4 w-4" />
            <span>کتاب‌ها</span>
          </CommandItem>
          <CommandItem onSelect={() => handleCommand('articles')}>
            <FileText className="ml-2 h-4 w-4" />
            <span>مقالات</span>
          </CommandItem>
          <CommandItem onSelect={() => handleCommand('movies')}>
            <Film className="ml-2 h-4 w-4" />
            <span>فیلم‌ها</span>
          </CommandItem>
          <CommandItem onSelect={() => handleCommand('podcasts')}>
            <Headphones className="ml-2 h-4 w-4" />
            <span>پادکست‌ها</span>
          </CommandItem>
          <CommandItem onSelect={() => handleCommand('audiobooks')}>
            <AudioLines className="ml-2 h-4 w-4" />
            <span>کتاب‌های صوتی</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};