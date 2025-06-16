import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Folder, File, HardDrive } from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  nature: 'file' | 'folder';
  folder_level?: string;
  size: number;
  file_id?: string;
  file?: {
    id: string;
    file_name: string;
    mime_type: string;
    size: number;
    path: string;
    extension: string;
    date_created: string;
    date_updated: string;
  };
  date_created: string;
  date_updated: string;
  recent_parent?: FileItem;
  recent_child?: FileItem;
  parents?: FileItem[];
  children?: FileItem[];
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  files: FileItem[];
  isDeleting: boolean;
  folderContents?: { [folderId: string]: FileItem[] };
}

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  files,
  isDeleting,
  folderContents = {}
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isConfirmationValid, setIsConfirmationValid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setIsConfirmationValid(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setIsConfirmationValid(confirmationText.toLowerCase() === 'confirm');
  }, [confirmationText]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isConfirmationValid && !isDeleting) {
      onConfirm();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isConfirmationValid && !isDeleting) {
      handleConfirm();
    }
    if (e.key === 'Escape' && !isDeleting) {
      onClose();
    }
  };

  // Calculate totals
  const totalFiles = files.filter(f => f.nature === 'file').length;
  const totalFolders = files.filter(f => f.nature === 'folder').length;
  const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);

  // Calculate nested contents for folders
  let nestedFiles = 0;
  let nestedFolders = 0;
  files.forEach(file => {
    if (file.nature === 'folder' && folderContents[file.id]) {
      const contents = folderContents[file.id];
      nestedFiles += contents.filter(item => item.nature === 'file').length;
      nestedFolders += contents.filter(item => item.nature === 'folder').length;
    }
  });

  const hasNestedContent = nestedFiles > 0 || nestedFolders > 0;

  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold">
              Confirm Deletion
            </h2>
          </div>
          {!isDeleting && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-200 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone. The following items will be permanently deleted:
            </p>
          </div>

          {/* Summary */}
          <div className="bg-surface-100 rounded-lg p-4 space-y-3">
            <h3 className="font-medium ">Items to delete:</h3>
            
            {/* Direct items */}
            <div className="space-y-2">
              {totalFiles > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <File className="w-4 h-4" />
                  <span>{totalFiles} file{totalFiles !== 1 ? 's' : ''}</span>
                  {totalSize > 0 && (
                    <span className="text-gray-400">({formatFileSize(totalSize)})</span>
                  )}
                </div>
              )}
              
              {totalFolders > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Folder className="w-4 h-4" />
                  <span>{totalFolders} folder{totalFolders !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {/* Nested content warning */}
            {hasNestedContent && (
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  This will also delete all contents inside folders:
                </p>
                {nestedFiles > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 ml-4">
                    <File className="w-3 h-3" />
                    <span>{nestedFiles} nested file{nestedFiles !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {nestedFolders > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 ml-4">
                    <Folder className="w-3 h-3" />
                    <span>{nestedFolders} nested folder{nestedFolders !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File list for single or few items */}
          {files.length <= 5 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Items:</h4>
              <div className="space-y-1">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 text-sm bg-surface-100 rounded px-3 py-2">
                    {file.nature === 'folder' ? (
                      <Folder className="w-4 h-4 text-blue-500" />
                    ) : (
                      <File className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="flex-1 truncate">{file.name}</span>
                    {file.size && (
                      <span className="text-xs text-gray-400">
                        {formatFileSize(file.size)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation input */}
          <div className="space-y-2">
            <label htmlFor="confirmation" className="block text-sm font-medium">
              Type <strong>confirm</strong> to proceed with deletion:
            </label>
            <input
              id="confirmation"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type 'confirm' here"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                confirmationText && !isConfirmationValid
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : isConfirmationValid
                  ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              disabled={isDeleting}
              autoComplete="off"
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-xs text-red-600">
                Please type "confirm" exactly as shown
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-background">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium bg-surface-200 border cursor-pointer border-border rounded-lg hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isDeleting}
            className="px-4 py-2 text-sm font-medium text-white cursor-pointer bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Permanently'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};