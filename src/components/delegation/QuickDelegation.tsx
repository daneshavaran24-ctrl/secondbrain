import React from 'react';
import { Button } from '@/components/ui/button';
import { TaskDelegationPanel } from './TaskDelegationPanel';
import { UserPlus } from 'lucide-react';

interface QuickDelegationProps {
  domain?: string;
  projectId?: string;
  taskId?: string;
  ideaId?: string;
  organizationId?: string;
  className?: string;
}

export function QuickDelegation({ 
  domain = 'personal', 
  projectId, 
  taskId, 
  ideaId, 
  organizationId,
  className 
}: QuickDelegationProps) {
  return (
    <div className={className}>
      <TaskDelegationPanel 
        domain={domain}
        projectId={projectId}
        organizationId={organizationId}
        onDelegationCreated={() => {
          // Optional: Add specific handling based on context
          // console.log removed for production: Delegation created from quick action
        }}
      />
    </div>
  );
}