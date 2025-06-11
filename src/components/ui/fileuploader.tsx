'use client'
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

type FileUploaderProps = {
  multiple?: boolean;
  files?: (File | string)[]; // Files or URLs controlled by parent
  onFilesChange?: (files: (File | string)[]) => void;
  className?: string;
  label?: string;
  id?: string;
  buttonText?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'multiple' | 'type' | 'onChange'>;

type FileWithPreview = {
  file?: File;
  url?: string;
  previewUrl?: string;
  name: string;
  size?: number;
  type: string;
};

export const FileUploader = ({ 
  multiple = false, 
  files = [], // Default to empty array
  onFilesChange,
  className = '',
  label = 'Select file',
  id,
  buttonText = 'Choose File',
  ...props 
}: FileUploaderProps) => {
  const [filesWithPreviews, setFilesWithPreviews] = useState<FileWithPreview[]>([]);
  const [previewModalFile, setPreviewModalFile] = useState<FileWithPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cleanupUrlsRef = useRef<Set<string>>(new Set());

  // Helper functions - stable references
  const getFileExtensionFromUrl = useCallback((url: string): string => {
    try {
      const pathname = new URL(url).pathname;
      const extension = pathname.split('.').pop()?.toLowerCase() || '';
      return extension;
    } catch {
      return '';
    }
  }, []);

  const getMimeTypeFromExtension = useCallback((extension: string): string => {
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }, []);

  const getFilenameFromUrl = useCallback((url: string): string => {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split('/').pop() || 'Unknown file';
    } catch {
      return 'Unknown file';
    }
  }, []);

  // Memoize the processed files instead of using useEffect
  const processedFiles = useMemo(() => {
    // Clean up previous URLs
    cleanupUrlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    cleanupUrlsRef.current.clear();

    const processed = files.map(item => {
      if (typeof item === 'string') {
        // Handle URL string
        const extension = getFileExtensionFromUrl(item);
        const mimeType = getMimeTypeFromExtension(extension);
        const filename = getFilenameFromUrl(item);
        
        return {
          url: item,
          previewUrl: mimeType.startsWith('image/') ? item : undefined,
          name: filename,
          type: mimeType,
        };
      } else {
        // Handle File object
        let previewUrl: string | undefined;
        if (item.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(item);
          cleanupUrlsRef.current.add(previewUrl);
        }
        
        return {
          file: item,
          previewUrl,
          name: item.name,
          size: item.size,
          type: item.type,
        };
      }
    });

    return processed;
  }, [files, getFileExtensionFromUrl, getMimeTypeFromExtension, getFilenameFromUrl]);

  // Update state only when processed files change
  useEffect(() => {
    if (!processedFiles||processedFiles===undefined||!multiple) return;
    setFilesWithPreviews(processedFiles);
  }, [processedFiles]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // Ignore cleanup errors
        }
      });
      cleanupUrlsRef.current.clear();
    };
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUploadedFiles = e.target.files ? Array.from(e.target.files) : [];
    
    // If multiple is true, append new files to existing ones
    // Otherwise, replace existing files
    const updatedFiles = multiple 
      ? [...files, ...newUploadedFiles]
      : newUploadedFiles;
    
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }

    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [files, multiple, onFilesChange]);

  const removeFile = useCallback((indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    
    if (onFilesChange) {
      onFilesChange(newFiles);
    }
  }, [files, onFilesChange]);

  const clearAllFiles = useCallback(() => {
    if (onFilesChange) {
      onFilesChange([]);
    }
  }, [onFilesChange]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const openPreviewModal = useCallback((fileWithPreview: FileWithPreview) => {
    setPreviewModalFile(fileWithPreview);
  }, []);

  const closePreviewModal = useCallback(() => {
    setPreviewModalFile(null);
  }, []);

  // Helper function to format file size
  const formatFileSize = useCallback((size?: number): string => {
    if (!size) return 'Unknown size';
    return `${(size / 1024).toFixed(2)} KB`;
  }, []);

  return (
    <div className="w-full">
      <label htmlFor={id} className="block mb-2 text-sm font-medium">{label}</label>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        name="files"
        id={id}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        {...props}
      />
      
      {/* Custom button/div that triggers the file input */}
      <div 
        onClick={triggerFileInput}
        className="w-full px-4 py-3 dark:bg-surface-200 bg-white border-input border rounded-sm text-foreground cursor-pointer hover:bg-gray-50 dark:hover:bg-surface-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:shadow-md shadow-primary flex items-center justify-between"
      >
        <span className="text-gray-500">
          {files.length > 0 
            ? `${files.length} file(s) selected` 
            : buttonText}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      
      {filesWithPreviews.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">
              Files: {filesWithPreviews.length}
              {filesWithPreviews.some(f => f.url) && (
                <span className="text-xs text-gray-500 ml-2">
                  ({filesWithPreviews.filter(f => f.url).length} uploaded, {filesWithPreviews.filter(f => f.file).length} local)
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={clearAllFiles}
              className="text-error hover:text-error-light text-sm flex items-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z" clipRule="evenodd" />
                <path d="M6 8a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" />
              </svg>
              Delete All
            </button>
          </div>
          <ul className="bg-surface-100 dark:bg-surface-100 rounded-md p-2">
            {filesWithPreviews.map((fileWithPreview, index) => (
              <li key={`${fileWithPreview.name}-${index}`} className="flex items-center justify-between py-2 px-3 border-b border-border last:border-0">
                <div className="flex items-center">
                  <div className="mr-2">
                    {fileWithPreview.type.startsWith('image/') ? (
                      fileWithPreview.previewUrl ? (
                        <div 
                          className="w-10 h-10 rounded bg-cover bg-center cursor-pointer border border-border overflow-hidden"
                          onClick={() => openPreviewModal(fileWithPreview)}
                        >
                          <img 
                            src={fileWithPreview.previewUrl} 
                            alt={fileWithPreview.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-surface-100 rounded flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )
                    ) : (
                      <div className="w-10 h-10 bg-surface-100 dark:bg-gray-700 rounded flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-xs flex items-center">
                      {fileWithPreview.name}
                      {fileWithPreview.url && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Uploaded
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(fileWithPreview.size)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {fileWithPreview.type.startsWith('image/') && fileWithPreview.previewUrl && (
                    <button
                      type="button"
                      onClick={() => openPreviewModal(fileWithPreview)}
                      className="text-primary hover:text-primary mr-3 transition-colors"
                      title="Preview image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  {fileWithPreview.url && (
                    <a
                      href={fileWithPreview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 mr-3 transition-colors"
                      title="Open in new tab"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </a>
                  )}
                  <button 
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-error hover:text-error-light transition-colors"
                    title="Remove file"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewModalFile && previewModalFile.previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl max-w-4xl w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                {previewModalFile.name}
              </h3>
              <button
                onClick={closePreviewModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-900" style={{ minHeight: '300px' }}>
              <img 
                src={previewModalFile.previewUrl} 
                alt={previewModalFile.name} 
                className="max-h-96 max-w-full" 
              />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-right">
              <button
                onClick={closePreviewModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;