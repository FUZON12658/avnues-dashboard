import React from "react";
import { Button } from "../ui/button";
import { InputModal } from "../ui/modal/input-modal";
import { ConfirmationModal } from "../ui/modal/confirmation-modal";
import { InfoModal } from "../ui/modal/info-modal";
import { DeleteConfirmationModal } from "../ui/modal/delete-confirmation-modal";

const ModalExample = () => {
  const [isInputModalOpen, setInputModalOpen] = React.useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [isInfoModalOpen, setInfoModalOpen] = React.useState(false);
  
  const [result, setResult] = React.useState('');
  
  return (
    <div className="p-6 space-y-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">Modal Examples</h1>
      
      {result && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 p-3 rounded-md mb-4 transition-all duration-300 animate-fadeIn">
          <p className="text-green-800 dark:text-green-200">{result}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <Button onClick={() => setInputModalOpen(true)} className="transition-transform hover:translate-y-[-2px]">Open Input Modal</Button>
      </div>
      
      <div className="space-y-2">
        <Button onClick={() => setConfirmModalOpen(true)} className="transition-transform hover:translate-y-[-2px]">Open Confirmation Modal</Button>
      </div>
      
      <div className="space-y-2">
        <Button variant="danger" onClick={() => setDeleteModalOpen(true)} className="transition-transform hover:translate-y-[-2px]">Open Delete Modal</Button>
      </div>
      
      <div className="space-y-2">
        <Button variant="secondary" onClick={() => setInfoModalOpen(true)} className="transition-transform hover:translate-y-[-2px]">Open Info Modal</Button>
      </div>
      
      {/* Input Modal */}
      <InputModal
        isOpen={isInputModalOpen}
        onClose={() => setInputModalOpen(false)}
        title="Add New Item"
        inputLabel="Item Name"
        placeholder="Enter item name"
        onSubmit={(value) => {
          setResult(`Input submitted: ${value}`);
          setInputModalOpen(false);
        }}
      />
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => setResult("Action confirmed!")}
        title="Confirm Action"
        message="Are you sure you want to proceed with this action? This cannot be undone."
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => setResult("Item deleted successfully")}
        title="Delete Item"
        message="This action cannot be undone. This will permanently delete the item and remove all associated data."
        confirmText="DELETE"
        itemName="this item"
      />
      
      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title="Information"
        content="Your changes have been saved successfully. The system will update within the next few minutes."
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>}
      />
    </div>
  );
};

export default ModalExample;