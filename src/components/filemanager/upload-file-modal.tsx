// Upload Modal Component - Fixed version
import React, { useState } from 'react';
import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react';
import { 
  UploadIcon, 
  Delete01Icon, 
  FileIcon,
  ImageIcon,
  VideoIcon,
  AudioWave01Icon,
  LegalDocument01FreeIcons
} from '@hugeicons/core-free-icons';

type FileWithPreview = {
  file: File;
  id: string;
  previewUrl?: string;
  name: string;
  size: number;
  type: string;
};

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string | null;
  onUpload: (files: File[], parentId: string | null) => Promise<void>; // Updated to include parentId
  isUploading?: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  parentId,
  onUpload,
  isUploading = false,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);

  // File type icon mapping
  const getFileIcon = (type: string) => {
    const fileType = type?.toLowerCase() || '';
    if (fileType.startsWith('image/')) return ImageIcon;
    if (fileType.startsWith('video/')) return VideoIcon;
    if (fileType.startsWith('audio/')) return AudioWave01Icon;
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return LegalDocument01FreeIcons;
    return FileIcon;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file selection from system file manager
  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*';
    
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      
      if (files) {
        const newFilesWithPreview: FileWithPreview[] = Array.from(files).map((file) => {
          // Create preview URL for images
          let previewUrl: string | undefined;
          if (file.type.startsWith('image/')) {
            previewUrl = URL.createObjectURL(file);
          }
          
          return {
            file: file, // Store the actual File object
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
            previewUrl,
            name: file.name, // Extract properties from File
            size: file.size,
            type: file.type,
          };
        });
        
        setSelectedFiles(prev => [...prev, ...newFilesWithPreview]);
      }
    };
    
    input.click();
  };

  // Remove file from selection
  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const updatedFiles = prev.filter(fileWithPreview => fileWithPreview.id !== fileId);
      // Clean up preview URLs
      const removedFile = prev.find(fileWithPreview => fileWithPreview.id === fileId);
      if (removedFile?.previewUrl) {
        URL.revokeObjectURL(removedFile.previewUrl);
      }
      return updatedFiles;
    });
  };

  // Handle file upload - delegate to parent with parentId
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      // Extract just the File objects for upload and pass parentId
      const filesToUpload = selectedFiles.map(fileWithPreview => fileWithPreview.file);
      await onUpload(filesToUpload, parentId); // Pass parentId here
      
      // Clean up and close modal on success
      selectedFiles.forEach(fileWithPreview => {
        if (fileWithPreview.previewUrl) {
          URL.revokeObjectURL(fileWithPreview.previewUrl);
        }
      });
      
      setSelectedFiles([]);
      onClose();
      
    } catch (error) {
      console.error('Upload failed:', error);
      // Error handling is done in parent component
    }
  };

  // Close modal and clean up
  const handleClose = () => {
    if (isUploading) return; // Prevent closing during upload
    
    // Clean up preview URLs
    selectedFiles.forEach(fileWithPreview => {
      if (fileWithPreview.previewUrl) {
        URL.revokeObjectURL(fileWithPreview.previewUrl);
      }
    });
    
    setSelectedFiles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold ">
            Upload Files {parentId && <span className="text-sm text-gray-500">to current folder</span>}
          </h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {selectedFiles.length === 0 ? (
            // Empty state - file selection
            <div className="text-center py-12">
              <HugeiconsIcon icon={UploadIcon} className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select Files to Upload</h3>
              <p className="text-gray-400 mb-6">Choose multiple files from your computer</p>
              <button
                onClick={handleFileSelect}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <HugeiconsIcon icon={UploadIcon} className="w-4 h-4" />
                Select Files
              </button>
            </div>
          ) : (
            // Files selected state
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  Selected Files ({selectedFiles.length})
                </h3>
                <button
                  onClick={handleFileSelect}
                  disabled={isUploading}
                  className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  Add More Files
                </button>
              </div>

              {/* File List */}
              <div className="space-y-3 max-h-96 overflow-auto">
                {selectedFiles.map((fileWithPreview) => {
                  const IconComponent = getFileIcon(fileWithPreview.type);
                  return (
                    <div
                      key={fileWithPreview.id}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-surface-200"
                    >
                      {/* File Icon/Preview */}
                      <div className="flex-shrink-0">
                        {fileWithPreview.previewUrl ? (
                          <img
                            src={fileWithPreview.previewUrl}
                            alt={fileWithPreview.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <HugeiconsIcon icon={IconComponent} className="w-10 h-10 " />
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium  truncate">
                          {fileWithPreview.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatFileSize(fileWithPreview.size)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFile(fileWithPreview.id)}
                        disabled={isUploading}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 disabled:opacity-50 cursor-pointer"
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-border bg-background">
            <div className="text-sm text-gray-600">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              {' • '}
              Total size: {formatFileSize(selectedFiles.reduce((total, fileWithPreview) => total + fileWithPreview.size, 0))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2 border border-border hover:text-black rounded-lg hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || selectedFiles.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 cursor-pointer text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={UploadIcon} className="w-4 h-4" />
                    Upload Files
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};