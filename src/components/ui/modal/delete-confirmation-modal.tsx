import React from "react";
import { Input } from "../input";
import { Modal } from "./modal-base";
import { Button } from "../button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText: string;
  buttonText?: string;
  itemName?: string;
}

export const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  buttonText = 'Delete',
  itemName = 'this item'
}: DeleteConfirmationModalProps) => {
  const [inputValue, setInputValue] = React.useState('');
  const isConfirmEnabled = inputValue === confirmText;
  
  // Reset input value when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="mb-4">
        {typeof message === 'string' ? <p className="text-foreground">{message}</p> : message}
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-foreground">
          Type <span className="font-semibold">{confirmText}</span> to confirm
        </label>
        <Input 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={confirmText}
          autoFocus
          className="transition-all duration-200"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          disabled={!isConfirmEnabled}
          className={`transition-all duration-300 ${!isConfirmEnabled ? 'opacity-50' : 'opacity-100'}`}
          onClick={() => {
            if (isConfirmEnabled) {
              onConfirm();
              onClose();
            }
          }}
        >
          {buttonText}
        </Button>
      </div>
    </Modal>
  );
};