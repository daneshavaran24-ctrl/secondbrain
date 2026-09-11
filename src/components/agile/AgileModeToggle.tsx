import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type AgileMode = 'kanban' | 'scrum';

interface AgileModeToggleProps {
  value: AgileMode;
  onChange: (value: AgileMode) => void;
  storageKey?: string;
}

export const AgileModeToggle: React.FC<AgileModeToggleProps> = ({ value, onChange, storageKey }) => {
  const handleChange = (val: string) => {
    const mode = (val || 'kanban') as AgileMode;
    if (storageKey) localStorage.setItem(storageKey, mode);
    onChange(mode);
  };

  return (
    <ToggleGroup type="single" value={value} onValueChange={handleChange} className="border rounded-md p-1 bg-background">
      <ToggleGroupItem value="kanban" aria-label="Kanban" className="px-3">
        Kanban
      </ToggleGroupItem>
      <ToggleGroupItem value="scrum" aria-label="Scrum" className="px-3">
        Scrum
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
