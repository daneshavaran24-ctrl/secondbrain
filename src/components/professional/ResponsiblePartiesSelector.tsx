import { ResponsibleParty } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, UserPlus } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";

interface ResponsiblePartiesSelectorProps {
  parties: ResponsibleParty[];
  onChange: (parties: ResponsibleParty[]) => void;
}

export const ResponsiblePartiesSelector = ({ parties, onChange }: ResponsiblePartiesSelectorProps) => {
  const [newPartyName, setNewPartyName] = useState('');

  const handleAddParty = () => {
    if (newPartyName.trim()) {
      const newParty: ResponsibleParty = {
        user_id: crypto.randomUUID(),
        user_name: newPartyName.trim(),
        role: 'primary',
        assigned_at: new Date().toISOString()
      };

      onChange([...parties, newParty]);
      setNewPartyName('');
    }
  };

  const handleRemoveParty = (userId: string) => {
    onChange(parties.filter(p => p.user_id !== userId));
  };

  const handleRoleChange = (userId: string, role: ResponsibleParty['role']) => {
    onChange(parties.map(p => 
      p.user_id === userId ? { ...p, role } : p
    ));
  };

  const getRoleLabel = (role: ResponsibleParty['role']) => {
    switch (role) {
      case 'primary': return 'مسئول اصلی';
      case 'secondary': return 'مسئول فرعی';
      case 'reviewer': return 'ناظر';
    }
  };

  return (
    <div className="space-y-4">
      <Label>مسئولین</Label>

      {/* لیست مسئولین فعلی */}
      <div className="space-y-2">
        {parties.map((party) => (
          <Card key={party.user_id} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium">{party.user_name}</p>
              </div>
              
              <Select 
                value={party.role} 
                onValueChange={(role) => handleRoleChange(party.user_id, role as ResponsibleParty['role'])}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">مسئول اصلی</SelectItem>
                  <SelectItem value="secondary">مسئول فرعی</SelectItem>
                  <SelectItem value="reviewer">ناظر</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveParty(party.user_id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* افزودن مسئول جدید */}
      <div className="flex gap-2">
        <Input
          placeholder="نام مسئول جدید..."
          value={newPartyName}
          onChange={(e) => setNewPartyName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddParty();
            }
          }}
        />
        <Button onClick={handleAddParty} disabled={!newPartyName.trim()}>
          <UserPlus className="h-4 w-4 ml-2" />
          افزودن
        </Button>
      </div>

      {parties.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          هنوز مسئولی اضافه نشده است
        </p>
      )}
    </div>
  );
};