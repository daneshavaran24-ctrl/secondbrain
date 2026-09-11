import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import ResetPasswordForm from './ResetPasswordForm';

interface ResetPasswordModalProps {
  trigger?: React.ReactNode;
  isAdmin: boolean;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ trigger, isAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  // If not admin, don't render anything
  if (!isAdmin) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Reset User Password</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset User Password</DialogTitle>
          <DialogDescription>
            As an administrator, you can reset passwords for users in the system.
          </DialogDescription>
        </DialogHeader>
        <ResetPasswordForm onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordModal;
