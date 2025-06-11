'use client';
import { BodyText, Heading } from '@/components/common/typography';
import React from 'react';
import { FaX } from "react-icons/fa6";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true
}: ModalProps) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [animationState, setAnimationState] = React.useState<'entering' | 'entered' | 'exiting' | 'exited'>(
    isOpen ? 'entering' : 'exited'
  );
  
  // Handle animation states
  React.useEffect(() => {
    let animationFrame: number;
    
    if (isOpen) {
      setAnimationState('entering');
      animationFrame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationState('entered');
        });
      });
    } else {
      if (animationState === 'entered' || animationState === 'entering') {
        setAnimationState('exiting');
        // We'll wait for the animation to complete before fully removing
      }
    }
    
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isOpen]);
  
  // Handle transition end for exit animation
  React.useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    
    const handleTransitionEnd = () => {
      if (animationState === 'exiting') {
        setAnimationState('exited');
      }
    };
    
    modalElement.addEventListener('transitionend', handleTransitionEnd);
    return () => {
      modalElement.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [animationState]);
  
  // Handle Escape key press
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = ''; // Restore scrolling when modal is closed
    };
  }, [isOpen, onClose]);
  
  // Handle click outside modal
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  
  if (animationState === 'exited' && !isOpen) return null;
  
  // Animation classes based on state
  const overlayClasses = {
    entering: 'bg-opacity-0',
    entered: 'bg-opacity-50 transition-all duration-300 ease-in-out',
    exiting: 'bg-opacity-0 transition-all duration-300 ease-in-out',
    exited: 'bg-opacity-0',
  };
  
  const modalClasses = {
    entering: 'opacity-0 scale-95 translate-y-4',
    entered: 'opacity-100 scale-100 translate-y-0 transition-all duration-300 ease-in-out',
    exiting: 'opacity-0 scale-95 translate-y-4 transition-all duration-300 ease-in-out',
    exited: 'opacity-0 scale-95',
  };
  
  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${overlayClasses[animationState]}`}>
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-surface-100 rounded-md shadow-xl w-full ${sizeClasses[size]} ${modalClasses[animationState]}`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pl-6">
          <Heading variant='h5' className='mt-1'>{title}</Heading>
          {showCloseButton && (
            <button 
              onClick={onClose}
              className="text-gray-500 w-12 h-12 flex items-center justify-center hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            >
              <FaX width={`1.25rem`} height={`1.25rem`} />
            </button>
          )}
        </div>
        <hr className='text-border mx-2' />
        {/* Modal Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
