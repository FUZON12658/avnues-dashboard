import React from 'react';
import { Modal } from './modal-base';
import { Button } from '../button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  variant?: 'default' | 'danger';
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  variant = 'default'
}: ConfirmationModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="mb-6">
        {typeof message === 'string' ? <p className="text-foreground">{message}</p> : message}
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          {cancelButtonText}
        </Button>
        <Button 
          variant={variant === 'danger' ? 'danger' : 'primary'} 
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmButtonText}
        </Button>
      </div>
    </Modal>
  );
};
