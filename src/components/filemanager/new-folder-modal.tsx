import React, { useState, useEffect } from 'react';
type NewFolderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  parentId: string | null;
  onSubmit: (data: {
    parent_id: string | null;
    folder_name: string;
  }) => Promise<void>; // assuming it's awaited
};

// NewFolderModal Component
export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  parentId,
  onSubmit,
}) => {
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!folderName.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Log the data in the format you requested
    console.log('New folder creation:');
    console.log('parent_id:', parentId || '');
    console.log('folder_name:', folderName.trim());

    try {
      // Call the onSubmit callback with the data
      await onSubmit({
        parent_id: parentId,
        folder_name: folderName.trim(),
      });

      onClose();
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/30 backdrop-blur-md bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold ">
            Create New Folder
          </h3>
        </div>

        <div className="px-6 py-4">
          <label
            htmlFor="folderName"
            className="block text-sm font-medium mb-2"
          >
            Folder Name
          </label>
          <input
            id="folderName"
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter folder name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            disabled={isSubmitting}
          />
          {parentId && (
            <p className="mt-2 text-xs text-gray-500">
              Creating folder in: {parentId}
            </p>
          )}
        </div>

        <div className="px-6 py-4 bg-background flex justify-end gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!folderName.trim() || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Folder'}
          </button>
        </div>
      </div>
    </div>
  );
};
