import { Button } from "../button";
import { Modal } from "./modal-base";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string | React.ReactNode;
  buttonText?: string;
  icon?: React.ReactNode;
}

export const InfoModal = ({
  isOpen,
  onClose,
  title,
  content,
  buttonText = 'OK',
  icon
}: InfoModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="mb-6">
        {icon && (
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 transition-all duration-300 hover:scale-110">
              {icon}
            </div>
          </div>
        )}
        
        {typeof content === 'string' ? <p className="text-foreground text-center">{content}</p> : content}
      </div>
      
      <div className="flex justify-center">
        <Button onClick={onClose}>
          {buttonText}
        </Button>
      </div>
    </Modal>
  );
};
