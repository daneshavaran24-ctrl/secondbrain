import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Habit } from '@/services/habitTrackerService';

interface DeleteHabitDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  habit: Habit | null;
}

export const DeleteHabitDialog: React.FC<DeleteHabitDialogProps> = ({
  open,
  onClose,
  onConfirm,
  habit,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {habit?.emoji && <span className="text-2xl">{habit.emoji}</span>}
            حذف عادت
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right space-y-2">
            <p>
              آیا از حذف عادت <span className="font-semibold">"{habit?.title}"</span> مطمئن
              هستید؟
            </p>
            <p className="text-destructive">
              ⚠️ این عمل قابل بازگشت نیست و تمام اطلاعات مربوط به این عادت از جمله
              تاریخچه تکمیل آن حذف خواهد شد.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
