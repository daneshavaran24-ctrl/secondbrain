import { motion } from 'framer-motion';
import { Users, Crown, Shield, User as UserIcon, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Member {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isOnline?: boolean;
}

interface OrganizationMembersPreviewProps {
  members: Member[];
  totalCount: number;
}

const getRoleIcon = (role: string) => {
  if (role === 'admin' || role === 'owner') return Crown;
  if (role === 'manager') return Shield;
  return UserIcon;
};

const getRoleColor = (role: string) => {
  if (role === 'admin' || role === 'owner') return 'text-amber-500';
  if (role === 'manager') return 'text-blue-500';
  return 'text-gray-500';
};

export function OrganizationMembersPreview({ 
  members, 
  totalCount 
}: OrganizationMembersPreviewProps) {
  const displayMembers = members.slice(0, 8);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            اعضای سازمان
          </span>
          <Badge variant="secondary" className="text-sm">
            {totalCount} عضو
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {displayMembers.map((member, index) => {
            const RoleIcon = getRoleIcon(member.role);
            const roleColor = getRoleColor(member.role);
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <Avatar className="w-14 h-14 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {member.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full animate-pulse" />
                  )}
                  <div className={`absolute -top-1 -left-1 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center ${roleColor}`}>
                    <RoleIcon className="w-3 h-3" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium truncate max-w-[100px]">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.role === 'admin' ? 'مدیر' : member.role === 'manager' ? 'مدیر میانی' : 'عضو'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {totalCount > 8 && (
          <Button variant="outline" className="w-full gap-2">
            <MoreHorizontal className="w-4 h-4" />
            مشاهده {totalCount - 8} عضو دیگر
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
