'use client'
import React from 'react';
import { Input } from "../input";
import { Modal } from './modal-base';
import { Button } from '../button';
import { BodyText } from '@/components/Common/typography';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (value: string) => void;
  inputLabel?: string;
  placeholder?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  defaultValue?: string;
}

export const InputModal = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  inputLabel = 'Input',
  placeholder = 'Enter value',
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  defaultValue = ''
}: InputModalProps) => {
  const [value, setValue] = React.useState(defaultValue);
  
  // Reset value when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <BodyText variant='regular'><label>{inputLabel}</label></BodyText>
          <Input 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="transition-all duration-200 focus:translate-y-0 hover:shadow-sm mt-1"
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {cancelButtonText}
          </Button>
          <Button type="submit">
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
