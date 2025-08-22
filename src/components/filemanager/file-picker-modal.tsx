//my current component

import React, { useState, useEffect } from 'react';
import { X, Upload, Check, File, Folder } from 'lucide-react';
import FileManager, {
  formatFileSize,
  FileTypeIcon,
} from '../common/filemanager';
import {
  getFileType,
  ImageViewer,
  PDFViewer,
  DocumentViewer,
  SpreadsheetViewer,
  PresentationViewer,
  VideoViewer,
  AudioPlayer,
  CodeViewer,
  TextViewer,
  FILE_TYPES,
} from './filemanager-fileviewers';
import { HugeiconsIcon } from '@hugeicons/react';
import { EyeIcon } from '@hugeicons/core-free-icons';
// Types
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
    IsProcessing: boolean;
    optimized_links: any;
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

interface FilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (files: FileItem[]) => void;
  multiple?: boolean;
  title?: string;
}

interface FileManagerPickerProps {
  onSelect: (fileIds: string[], files: FileItem[]) => void;
  multiple: boolean;
  selectedFiles: FileItem[];
}

interface EnhancedFileUploaderProps {
  onFilesChange: (files: FileItem[] | FileItem | null) => void;
  multiple?: boolean;
  buttonText?: string;
  value?: FileItem[] | FileItem | null;
  id?: string;
  className?: string;
}

interface FormFieldIntegrationProps {
  field: {
    type: string;
    key?: string;
    label?: string;
  };
  formField: {
    name: string;
    value: any;
    onChange: (value: any) => void;
  };
  getFilesForKey?: (key: string) => FileItem[];
  handleFileUpload?: (key: string, files: FileItem[]) => void;
}

interface FileViewerState {
  isOpen: boolean;
  file: FileItem | null;
  type: string | null;
}

// Add these props to your existing FileManager component

// File Picker Modal that wraps your FileManager
const FilePickerModal: React.FC<FilePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  title = 'Select Files',
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [isFileManagerMode, setIsFileManagerMode] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
      setIsFileManagerMode(true);
    }
  }, [isOpen]);

  const handleFileManagerSelect = (
    fileIds: string[],
    files: FileItem[]
  ): void => {
    if (multiple) {
      setSelectedFiles(files);
    } else {
      setSelectedFiles(files.slice(0, 1));
    }
  };

  const handleConfirmSelection = (): void => {
    onSelect(selectedFiles);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-background rounded-lg w-full max-w-6xl h-[80vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            {selectedFiles.length > 0 && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                {selectedFiles.length} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* <button
              onClick={() => setIsFileManagerMode(!isFileManagerMode)}
              className="px-3 py-1 text-sm bg-surface-100 hover:            bg-gray-200 rounded-md flex items-center gap-1"
            >
              <Upload size={16} />
              Upload New
            </button> */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-x-hidden ">
          <FileManagerPicker
            onSelect={handleFileManagerSelect}
            multiple={multiple}
            selectedFiles={selectedFiles}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {multiple
              ? `Select ${selectedFiles.length} file${
                  selectedFiles.length !== 1 ? 's' : ''
                }`
              : selectedFiles.length > 0
              ? `Selected: ${selectedFiles[0]?.name}`
              : 'No file selected'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={selectedFiles.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check size={16} />
              Select {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modified FileManager wrapper
// Modified FileManager wrapper for picker mode
const FileManagerPicker: React.FC<FileManagerPickerProps> = ({
  onSelect,
  multiple,
  selectedFiles,
}) => {
  // You'll modify your existing FileManager to accept these props:
  // - pickerMode: boolean - enables picker mode
  // - onPickerSelect: function - callback for selection
  // - pickerMultiple: boolean - allows multiple selection
  // - pickerSelectedFiles: array - currently selected files

  return (
    <div className="h-full">
      {/* Your FileManager component goes here with picker props */}
      <FileManager
        pickerMode={true}
        onPickerSelect={onSelect}
        pickerMultiple={multiple}
        pickerSelectedFiles={selectedFiles}
      />
    </div>
  );
};

// Enhanced FileUploader component that opens the picker
export const EnhancedFileUploader: React.FC<EnhancedFileUploaderProps> = ({
  onFilesChange,
  multiple = false,
  buttonText = 'Select Files',
  value = null,
  ...props
}) => {
  console.log(value);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [fileViewer, setFileViewer] = useState<FileViewerState>({
    isOpen: false,
    file: null,
    type: null,
  });

  const handleFileSelect = (selectedFiles: FileItem[]): void => {
    if (multiple) {
      onFilesChange(selectedFiles);
    } else {
      onFilesChange(selectedFiles[0] || null);
    }
  };

  const openFileViewer = (file: FileItem): void => {
    const fileType = getFileType(file);
    setFileViewer({
      isOpen: true,
      file: file,
      type: fileType,
    });
  };

  const closeFileViewer = (): void => {
    setFileViewer({
      isOpen: false,
      file: null,
      type: null,
    });
  };

  const renderFileViewer = (): React.ReactNode => {
    if (!fileViewer.isOpen || !fileViewer.file) return null;

    const commonProps = {
      file: fileViewer.file,
      onClose: closeFileViewer,
    };

    switch (fileViewer.type) {
      case 'image':
        return (
          <ImageViewer
            {...commonProps}
            files={value ? (Array.isArray(value) ? value : [value]) : []}
          />
        );
      case 'pdf':
        return <PDFViewer {...commonProps} />;
      case 'document':
        return <DocumentViewer {...commonProps} />;
      case 'spreadsheet':
        return <SpreadsheetViewer {...commonProps} />;
      case 'presentation':
        return <PresentationViewer {...commonProps} />;
      case 'video':
        return <VideoViewer {...commonProps} />;
      case 'audio':
        return <AudioPlayer {...commonProps} />;
      case 'code':
        return <CodeViewer {...commonProps} />;
      case 'text':
        return <TextViewer {...commonProps} />;
      default:
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4">Cannot Preview File</h3>
              <p className="text-gray-600 mb-4">
                This file type is not supported for preview.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeFileViewer}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    console.log('Download:', fileViewer.file?.name);
                    closeFileViewer();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  const handlePreview = (file: FileItem): void => {
    openFileViewer(file);
  };

  const renderFilePreview = (
    file: FileItem,
    index: number
  ): React.ReactNode => {
    const fileType = getFileType(file);
    console.log(fileType)
        console.log(fileType==="image")
    const imageUrl =
      `${process.env.NEXT_PUBLIC_API_HOST}/${fileType==='image' && file.file?.path ? file.file?.path  : null}`;
    console.log(imageUrl);
    console.log(file);
    return (
      <div
        key={index}
        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
      >
        <div className="flex-shrink-0">
          {fileType==='image' && imageUrl ? (
            <img
              src={imageUrl}
              alt={file.name}
              className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80"
              onClick={() => handlePreview(file)}
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                <FileTypeIcon item={file} isGridView={true} className="my-2" />
              
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.file?.size)} •{' '}
            {file.file?.extension || 'Unknown'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePreview(file)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Preview"
          >
             <HugeiconsIcon icon={EyeIcon} className="w-5 h-5 " />
          </button>

          <button
            onClick={() => {
              if (multiple && Array.isArray(value)) {
                const newFiles = value.filter((_, i) => i !== index);
                onFilesChange(newFiles.length > 0 ? newFiles : null);
              } else {
                onFilesChange(null);
              }
            }}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            title="Remove"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderSelectedFiles = (): React.ReactNode => {
    if (!value) return null;

    if (multiple && Array.isArray(value)) {
      return (
        <div className="mt-3 space-y-2">
          {value.map((file, index) => renderFilePreview(file, index))}
        </div>
      );
    } else if (!multiple && value) {
      return (
        <div className="mt-3">{renderFilePreview(value as FileItem, 0)}</div>
      );
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsPickerOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        {...props}
      >
        <Upload size={16} className="mr-2" />
        {buttonText}
      </button>

      {renderSelectedFiles()}

      <FilePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleFileSelect}
        multiple={multiple}
        title={multiple ? 'Select Files' : 'Select File'}
      />

      {renderFileViewer()}
    </>
  );
};
