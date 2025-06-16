'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FolderIcon,
  FileIcon,
  GridViewIcon,
  MenuIcon,
  Search01Icon,
  FilterIcon,
  Add01Icon,
  Upload01Icon,
  Delete01Icon,
  Edit02Icon,
  Copy01Icon,
  Share08Icon,
  Download01Icon,
  MoreHorizontalIcon,
  ArrowUp01Icon,
  Home01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  File01Icon,
  Settings02Icon,
  ArrowDown01Icon,
  EyeIcon,
  SortByDown01Icon,
  SortByUp01Icon,
  Move01Icon,
  InformationCircleIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react';
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createNewFolder,
  deleteFilesOrFolder,
  getFilesByFolderId,
  getTopLevelEntitiesFromFileManager,
  uploadMultipleFilesApi,
} from '@/api/filemanager';
import {
  // Import all your existing viewer components
  ImageViewer,
  PDFViewer,
  DocumentViewer,
  SpreadsheetViewer,
  PresentationViewer,
  VideoViewer,
  AudioPlayer,
  CodeViewer,
  TextViewer,
  getFileType,
  FILE_TYPES,
} from '../filemanager/filemanager-fileviewers'; // Adjust import path as needed
import { NewFolderModal } from '../filemanager/new-folder-modal';
import { toast } from 'sonner';
import { UploadModal } from '../filemanager/upload-file-modal';
import { DeleteModal } from '../filemanager/delete-modal';

// Types matching your backend structure
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

interface ViewConfig {
  type: 'grid' | 'list';
  sortBy: 'name' | 'size' | 'date_created' | 'nature';
  sortOrder: 'asc' | 'desc';
  showHidden: boolean;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: string) => void;
  item: FileItem | null;
}

// // Sample Data matching backend structure
// const sampleFiles: FileItem[] = [
//   {
//     id: '1',
//     name: 'Documents',
//     nature: 'folder',
//     folder_level: 'top-level',
//     size: 0,
//     date_created: '2024-06-01T10:00:00Z',
//     date_updated: '2024-06-01T10:00:00Z',
//   },
//   {
//     id: '2',
//     name: 'Projects',
//     nature: 'folder',
//     folder_level: 'top-level',
//     size: 0,
//     date_created: '2024-06-10T10:00:00Z',
//     date_updated: '2024-06-10T10:00:00Z',
//   },
//   {
//     id: '3',
//     name: 'Images',
//     nature: 'folder',
//     folder_level: 'top-level',
//     size: 0,
//     date_created: '2024-06-05T10:00:00Z',
//     date_updated: '2024-06-05T10:00:00Z',
//   },
//   {
//     id: '4',
//     name: 'report.pdf',
//     nature: 'file',
//     size: 2048576,
//     file_id: 'file-1',
//     file: {
//       id: 'file-1',
//       file_name: 'report.pdf',
//       mime_type: 'application/pdf',
//       size: 2048576,
//       path: '/files/report.pdf',
//       extension: '.pdf',
//       date_created: '2024-06-08T10:00:00Z',
//       date_updated: '2024-06-08T10:00:00Z',
//     },
//     date_created: '2024-06-08T10:00:00Z',
//     date_updated: '2024-06-08T10:00:00Z',
//   },
//   {
//     id: '5',
//     name: 'presentation.pptx',
//     nature: 'file',
//     size: 5242880,
//     file_id: 'file-2',
//     file: {
//       id: 'file-2',
//       file_name: 'presentation.pptx',
//       mime_type:
//         'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//       size: 5242880,
//       path: '/files/presentation.pptx',
//       extension: '.pptx',
//       date_created: '2024-06-07T10:00:00Z',
//       date_updated: '2024-06-07T10:00:00Z',
//     },
//     date_created: '2024-06-07T10:00:00Z',
//     date_updated: '2024-06-07T10:00:00Z',
//   },
//   {
//     id: '6',
//     name: 'budget.xlsx',
//     nature: 'file',
//     size: 1048576,
//     file_id: 'file-3',
//     file: {
//       id: 'file-3',
//       file_name: 'budget.xlsx',
//       mime_type:
//         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       size: 1048576,
//       path: '/files/budget.xlsx',
//       extension: '.xlsx',
//       date_created: '2024-06-06T10:00:00Z',
//       date_updated: '2024-06-06T10:00:00Z',
//     },
//     date_created: '2024-06-06T10:00:00Z',
//     date_updated: '2024-06-06T10:00:00Z',
//   },
//   {
//     id: '7',
//     name: 'notes.txt',
//     nature: 'file',
//     size: 2048,
//     file_id: 'file-4',
//     file: {
//       id: 'file-4',
//       file_name: 'notes.txt',
//       mime_type: 'text/plain',
//       size: 2048,
//       path: '/files/notes.txt',
//       extension: '.txt',
//       date_created: '2024-06-09T10:00:00Z',
//       date_updated: '2024-06-09T10:00:00Z',
//     },
//     date_created: '2024-06-09T10:00:00Z',
//     date_updated: '2024-06-09T10:00:00Z',
//   },
//   {
//     id: '8',
//     name: 'avatar.jpg',
//     nature: 'file',
//     size: 512000,
//     file_id: 'file-5',
//     file: {
//       id: 'file-5',
//       file_name: 'avatar.jpg',
//       mime_type: 'image/jpeg',
//       size: 512000,
//       path: '/files/avatar.jpg',
//       extension: '.jpg',
//       date_created: '2024-06-04T10:00:00Z',
//       date_updated: '2024-06-04T10:00:00Z',
//     },
//     date_created: '2024-06-04T10:00:00Z',
//     date_updated: '2024-06-04T10:00:00Z',
//   },
// ];

// Utility Functions
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '—';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Add these download functions
const downloadSingleFile = async (file: FileItem) => {
  try {
    const apiHost = process.env.NEXT_PUBLIC_API_HOST?.replace(/\/+$/, '');
    const normalizedPath = (file.file?.path || '').replace(/\\/g, '/');
    const fullUrl = `${apiHost}/${normalizedPath}`;

    const response = await fetch(fullUrl, {
      mode: 'cors', // Ensure CORS mode is set
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = file.name || 'download'; // Sets the filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl); // Clean up
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};

const downloadMultipleFiles = async (files: FileItem[]) => {
  try {
    // For multiple files, we'll simulate creating a zip
    // In a real implementation, you'd send the file IDs to your backend to create a zip
    const fileNames = files.map((f) => f.name).join(', ');
    console.log(`Creating zip archive for: ${fileNames}`);

    // Simulate zip creation (replace with actual API call)
    const zipName = `files_${Date.now()}.zip`;

    // For demo purposes, we'll just log the action
    // In reality, you'd make an API call to create and download the zip
    alert(`Would create and download: ${zipName}\nContaining: ${fileNames}`);
  } catch (error) {
    console.error('Error creating zip:', error);
  }
};

export const getFileIcon = (item: FileItem) => {
  if (item.nature === 'folder') {
    return (
      <HugeiconsIcon icon={FolderIcon} className="w-5 h-5 text-blue-500" />
    );
  }

  const extension = item.file?.extension?.toLowerCase() || '';
  const iconMap: Record<string, React.ReactNode> = {
    '.pdf': <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-red-500" />,
    '.doc': <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-blue-600" />,
    '.docx': (
      <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-blue-600" />
    ),
    '.xls': (
      <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-green-600" />
    ),
    '.xlsx': (
      <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-green-600" />
    ),
    '.ppt': (
      <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-orange-600" />
    ),
    '.pptx': (
      <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-orange-600" />
    ),
    '.txt': <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-gray-500" />,
    '.jpg': (
      <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-purple-500" />
    ),
    '.jpeg': (
      <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-purple-500" />
    ),
    '.png': (
      <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-purple-500" />
    ),
    '.gif': (
      <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-purple-500" />
    ),
  };

  return (
    iconMap[extension] || (
      <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-gray-500" />
    )
  );
};

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onAction,
  item,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position when menu opens or position changes
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const menuRect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // Check if menu goes off the right edge
      if (position.x + menuRect.width > viewportWidth) {
        newX = position.x - menuRect.width;
      }

      // Check if menu goes off the left edge
      if (newX < 0) {
        newX = 10; // Small margin from edge
      }

      // Check if menu goes off the bottom edge
      if (position.y + menuRect.height > viewportHeight) {
        newY = position.y - menuRect.height;
      }

      // Check if menu goes off the top edge
      if (newY < 0) {
        newY = 10; // Small margin from edge
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [isOpen, position]);

  if (!isOpen || !item) return null;

  const menuItems = [
    {
      icon: item.nature === 'folder' ? FolderIcon : FileIcon,
      label: 'Open',
      action: 'open',
      className: ' hover:bg-surface-100',
    },
    {
      icon: Copy01Icon,
      label: 'Copy',
      action: 'copy',
      className: ' hover:bg-surface-100',
    },
    {
      icon: Move01Icon,
      label: 'Move',
      action: 'move',
      className: ' hover:bg-surface-100',
    },
    {
      icon: Share08Icon,
      label: 'Share',
      action: 'share',
      className: ' hover:bg-surface-100',
    },
    {
      icon: Edit02Icon,
      label: 'Rename',
      action: 'rename',
      className: ' hover:bg-surface-100',
    },
    ...(item.nature === 'file'
      ? [
          {
            icon: Download01Icon,
            label: 'Download',
            action: 'download',
            className: ' hover:bg-surface-100',
          },
        ]
      : []),
    {
      icon: InformationCircleIcon,
      label: 'Properties',
      action: 'properties',
      className: ' hover:bg-surface-100 pb-4',
    },
    {
      icon: Delete01Icon,
      label: 'Delete',
      action: 'delete',
      className: 'text-red-600 hover:bg-surface-200 border-t border-border',
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bg-background border border-border rounded-lg shadow-lg py-1 z-50 min-w-[10rem]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        visibility:
          adjustedPosition.x === position.x && adjustedPosition.y === position.y
            ? 'visible'
            : 'visible',
      }}
    >
      {menuItems.map((menuItem, index) => (
        <button
          key={index}
          onClick={() => {
            onAction(menuItem.action);
            onClose();
          }}
          className={`w-full cursor-pointer flex items-center gap-3 px-4 py-2 text-sm transition-colors ${menuItem.className}`}
        >
          <HugeiconsIcon icon={menuItem.icon} className="w-4 h-4" />
          {menuItem.label}
        </button>
      ))}
    </div>
  );
};

const SettingsDropdown: React.FC<{
  viewConfig: ViewConfig;
  onViewChange: (config: Partial<ViewConfig>) => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ viewConfig, onViewChange, isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-64 bg-background border border-border rounded-lg shadow-lg z-50 py-2"
    >
      {/* View Options */}
      <div className="px-4 py-2 border-b border-border">
        <h3 className="text-sm font-medium mb-3">View</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer hover:bg-surface-200 -mx-2 px-2 py-1 rounded">
            <input
              type="radio"
              name="view-type"
              checked={viewConfig.type === 'grid'}
              onChange={() => onViewChange({ type: 'grid' })}
              className="w-4 h-4 text-blue-600"
            />
            <HugeiconsIcon
              icon={GridViewIcon}
              className="w-4 h-4 text-gray-500"
            />
            <span className="text-sm">Grid view</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer hover:bg-surface-200 -mx-2 px-2 py-1 rounded">
            <input
              type="radio"
              name="view-type"
              checked={viewConfig.type === 'list'}
              onChange={() => onViewChange({ type: 'list' })}
              className="w-4 h-4 text-blue-600"
            />
            <HugeiconsIcon icon={MenuIcon} className="w-4 h-4 text-gray-500" />
            <span className="text-sm">List view</span>
          </label>
        </div>
      </div>

      {/* Sort Options */}
      <div className="px-4 py-2 border-b border-border">
        <h3 className="text-sm font-medium mb-3">Sort by</h3>
        <div className="space-y-2">
          {[
            { value: 'name', label: 'Name', icon: SortByUp01Icon },
            {
              value: 'date_created',
              label: 'Date created',
              icon: Calendar01Icon,
            },
            { value: 'size', label: 'Size', icon: ArrowUp01Icon },
            { value: 'nature', label: 'Type', icon: File01Icon },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 cursor-pointer hover:bg-surface-200 -mx-2 px-2 py-1 rounded"
            >
              <input
                type="radio"
                name="sort-by"
                checked={viewConfig.sortBy === option.value}
                onChange={() => onViewChange({ sortBy: option.value as any })}
                className="w-4 h-4 text-blue-600"
              />
              <HugeiconsIcon
                icon={option.icon}
                className="w-4 h-4 text-gray-500"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort Order */}
      <div className="px-4 py-2 border-b border-border">
        <h3 className="text-sm font-medium mb-3">Order</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer hover:bg-surface-200 -mx-2 px-2 py-1 rounded">
            <input
              type="radio"
              name="sort-order"
              checked={viewConfig.sortOrder === 'asc'}
              onChange={() => onViewChange({ sortOrder: 'asc' })}
              className="w-4 h-4 text-blue-600"
            />
            <HugeiconsIcon
              icon={SortByUp01Icon}
              className="w-4 h-4 text-gray-500"
            />
            <span className="text-sm">Ascending</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer hover:bg-surface-200 -mx-2 px-2 py-1 rounded">
            <input
              type="radio"
              name="sort-order"
              checked={viewConfig.sortOrder === 'desc'}
              onChange={() => onViewChange({ sortOrder: 'desc' })}
              className="w-4 h-4 text-blue-600"
            />
            <HugeiconsIcon
              icon={SortByDown01Icon}
              className="w-4 h-4 text-gray-500"
            />
            <span className="text-sm">Descending</span>
          </label>
        </div>
      </div>

      {/* Display Options */}
      <div className="px-4 py-2">
        <h3 className="text-sm font-medium mb-3">Display</h3>
        <label className="flex items-center gap-3 cursor-pointer hover:bg-surface-200 -mx-2 px-2 py-1 rounded">
          <input
            type="checkbox"
            checked={viewConfig.showHidden}
            onChange={(e) => onViewChange({ showHidden: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <HugeiconsIcon icon={EyeIcon} className="w-4 h-4 text-gray-500" />
          <span className="text-sm">Show hidden files</span>
        </label>
      </div>
    </div>
  );
};

// Header Component
const FileManagerHeader: React.FC<{
  viewConfig: ViewConfig;
  onViewChange: (config: Partial<ViewConfig>) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  onAction: (action: string) => void;
}> = ({
  viewConfig,
  onViewChange,
  searchQuery,
  onSearchChange,
  selectedCount,
  onAction,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="bg-background border-b border-border sticky top-0 z-30">
      {/* Main Header */}
      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">File Manager</h1>
            <p className="mt-2 text-gray-400">Organize and manage your files</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onAction('upload')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm"
            >
              <HugeiconsIcon icon={Upload01Icon} className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => onAction('newfolder')}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
            >
              <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
              New Folder
            </button>
          </div>
        </div>

        {/* Search and Tools Bar */}
        <div className="flex items-center justify-between gap-6">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Tools */}
          <div className="flex items-center gap-3">
            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="flex items-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-surface-100 transition-all text-sm font-medium"
              >
                <HugeiconsIcon icon={Settings02Icon} className="w-4 h-4" />
                <HugeiconsIcon icon={ArrowDown01Icon} className="w-3 h-3" />
              </button>

              <SettingsDropdown
                viewConfig={viewConfig}
                onViewChange={onViewChange}
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selectedCount > 1 && (
        <div className="px-8 py-4 bg-background border my-4 mx-6 rounded-md border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-300">
              {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => onAction('copy')}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-all"
              >
                <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={() => onAction('move')}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-all"
              >
                <HugeiconsIcon icon={Move01Icon} className="w-4 h-4" />
                Move
              </button>
              <button
                onClick={() => onAction('share')}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-all"
              >
                <HugeiconsIcon icon={Share08Icon} className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => onAction('delete')}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-all"
              >
                <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface BreadcrumbItem {
  name: string;
  id: string | null;
}

interface BreadcrumbProps {
  path: string[];
  pathWithIds: BreadcrumbItem[];
  onNavigate: (path: string[]) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  path,
  pathWithIds,
  onNavigate,
}) => {
  const handleNavigate = (index: number) => {
    const targetPath = path.slice(0, index + 1);
    onNavigate(targetPath);
  };

  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-background">
      <button
        onClick={() => handleNavigate(0)}
        className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-surface-200 rounded-md transition-all"
      >
        <HugeiconsIcon icon={Home01Icon} className="w-4 h-4" />
        <span className="mt-[0.125rem]">Home</span>
      </button>

      {path.slice(1).map((segment, index) => {
        const actualIndex = index + 1; // Adjust for slice(1)
        const isLast = actualIndex === path.length - 1;

        return (
          <React.Fragment key={index}>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="w-4 h-4 text-gray-400 mt-[0.125rem]"
            />
            <button
              onClick={() => handleNavigate(actualIndex)}
              className={`px-2 py-1 mt-[0.125rem] text-sm rounded-md transition-all ${
                isLast
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'hover:bg-surface-200'
              }`}
              disabled={isLast}
            >
              {segment}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Grid View Component
const GridView: React.FC<{
  files: FileItem[];
  selectedIds: Set<string>;
  onSelect: (id: string, multi?: boolean, shift?: boolean) => void;
  onDoubleClick: (item: FileItem) => void;
  onContextMenu: (event: React.MouseEvent, item: FileItem) => void;
}> = ({ files, selectedIds, onSelect, onDoubleClick, onContextMenu }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-6">
      {files.map((item) => (
        <div
          key={item.id}
          className={`group relative p-4 rounded-lg bg-background border-2 transition-all cursor-pointer hover:shadow-md ${
            selectedIds.has(item.id)
              ? 'border-blue-500 bg-surface-300'
              : 'border-border hover:border-gray-300'
          }`}
          onClick={(e) => onSelect(item.id, e.ctrlKey || e.metaKey, e.shiftKey)}
          onDoubleClick={() => onDoubleClick(item)}
          onContextMenu={(e) => onContextMenu(e, item)}
        >
          {/* Selection checkbox */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <input
              type="checkbox"
              checked={selectedIds.has(item.id)}
              onChange={() => onSelect(item.id, true)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* File/Folder icon */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 flex items-center justify-center mb-2">
              {getFileIcon(item)}
            </div>

            <div className="w-full">
              <p className="text-sm font-medium truncate mb-1">{item.name}</p>
              <p className="text-xs text-gray-400">
                {item.nature === 'file' ? formatFileSize(item.size) : 'Folder'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(item.date_created)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// List View Component
const ListView: React.FC<{
  files: FileItem[];
  selectedIds: Set<string>;
  onSelect: (id: string, multi?: boolean, shift?: boolean) => void;
  onDoubleClick: (item: FileItem) => void;
  onContextMenu: (event: React.MouseEvent, item: FileItem) => void;
  onSelectAll: (checked: boolean) => void;
  allSelected: boolean;
}> = ({
  files,
  selectedIds,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onSelectAll,
  allSelected,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-border">
          <tr className="text-left">
            <th className="w-8 px-6 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </th>
            <th className="px-6 py-3 text-sm font-medium">Name</th>
            <th className="px-6 py-3 text-sm font-medium">Size</th>
            <th className="px-6 py-3 text-sm font-medium">Type</th>
            <th className="px-6 py-3 text-sm font-medium">Modified</th>
            <th className="w-8 px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {files.map((item) => (
            <tr
              key={item.id}
              className={`group border-b border-border/50 transition-all cursor-pointer hover:bg-surface-100 ${
                selectedIds.has(item.id) ? 'bg-surface-200' : ''
              }`}
              onClick={(e) =>
                onSelect(item.id, e.ctrlKey || e.metaKey, e.shiftKey)
              }
              onDoubleClick={() => onDoubleClick(item)}
              onContextMenu={(e) => onContextMenu(e, item)}
            >
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => onSelect(item.id, true)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {getFileIcon(item)}
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm ">
                {item.nature === 'file' ? formatFileSize(item.size) : '—'}
              </td>
              <td className="px-6 py-4 text-sm ">
                {item.nature === 'file'
                  ? item.file?.extension || 'File'
                  : 'Folder'}
              </td>
              <td className="px-6 py-4 text-sm ">
                {formatDate(item.date_updated)}
              </td>
              {/* <td className="px-6 py-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, item);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-200 rounded transition-all"
                >
                  <HugeiconsIcon
                    icon={MoreHorizontalIcon}
                    className="w-4 h-4"
                  />
                </button>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PropertiesModal: React.FC<{
  isOpen: boolean;
  files: FileItem[];
  onClose: () => void;
}> = ({ isOpen, files, onClose }) => {
  if (!isOpen || files.length === 0) return null;

  const isMultiple = files.length > 1;
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
  const fileTypes = [...new Set(files.map((f) => f.nature))];

  return (
    <div className="fixed inset-0 bg-background/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {isMultiple ? `Properties (${files.length} items)` : 'Properties'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {!isMultiple ? (
              // Single file properties
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <p className="text-sm  bg-surface-200 p-2 rounded">
                    {files[0].name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <p className="text-sm ">
                    {files[0].nature === 'file'
                      ? files[0].file?.extension || 'File'
                      : 'Folder'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Size</label>
                  <p className="text-sm">
                    {files[0].nature === 'file'
                      ? formatFileSize(files[0].size || 0)
                      : '—'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Created
                  </label>
                  <p className="text-sm">{formatDate(files[0].date_created)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Modified
                  </label>
                  <p className="text-sm">{formatDate(files[0].date_updated)}</p>
                </div>

                {files[0].file?.mime_type && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      MIME Type
                    </label>
                    <p className="text-sm">{files[0].file.mime_type}</p>
                  </div>
                )}
              </>
            ) : (
              // Multiple files properties
              <>
                <div>
                  <label className="block text-sm font-medium  mb-1">
                    Items
                  </label>
                  <p className="text-sm ">{files.length} selected</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Types
                  </label>
                  <p className="text-sm capitalize">{fileTypes.join(', ')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Total Size
                  </label>
                  <p className="text-sm ">{formatFileSize(totalSize)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium  mb-1">
                    Selected Items
                  </label>
                  <div className="max-h-32 overflow-y-auto bg-surface-200 p-2 rounded text-sm">
                    {files.map((file, index) => (
                      <div key={file.id} className="py-1">
                        {index + 1}. {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface-400 hover:bg-surface-200 cursor-pointer rounded-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FileManagerProps {
  pickerMode?: boolean;
  onPickerSelect?: (fileIds: string[], files: FileItem[]) => void;
  pickerMultiple?: boolean;
  pickerSelectedFiles?: FileItem[];
}
const FileManager: React.FC<FileManagerProps> = ({
  pickerMode = false,
  onPickerSelect,
  pickerMultiple = false,
  pickerSelectedFiles = [],
}) => {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>(['root']);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  // Track folder IDs for breadcrumb navigation
  const [pathWithIds, setPathWithIds] = useState<
    Array<{ name: string; id: string | null }>
  >([{ name: 'root', id: null }]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewConfig, setViewConfig] = useState<ViewConfig>({
    type: 'grid',
    sortBy: 'name',
    sortOrder: 'asc',
    showHidden: false,
  });
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    item: FileItem | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null,
  });

  const [fileViewer, setFileViewer] = useState<{
    isOpen: boolean;
    file: FileItem | null;
    type: string | null;
  }>({
    isOpen: false,
    file: null,
    type: null,
  });

  const [propertiesModal, setPropertiesModal] = useState<{
    isOpen: boolean;
    files: FileItem[];
  }>({
    isOpen: false,
    files: [],
  });

  const [newFolderModal, setNewFolderModal] = useState({
    isOpen: false,
  });

  const [uploadModal, setUploadModal] = useState({
    isOpen: false,
  });

  // Add delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    files: FileItem[];
  }>({
    isOpen: false,
    files: [],
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add the delete mutation
  const deleteFilesMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      // Delete each file/folder
      const deletePromises = fileIds.map((id) => deleteFilesOrFolder(id));
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      toast.success('Files deleted successfully!');
      // Refresh the current folder/directory
      if (currentFolderId) {
        queryClient.invalidateQueries({
          queryKey: ['filemanager-folder', currentFolderId],
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ['filemanager-top'],
        });
      }
      // Clear selection
      setSelectedIds(new Set());
      setLastSelectedId(null);
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      toast.error('Delete failed. Please try again.');
    },
    onSettled: () => {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, files: [] });
    },
  });

  // Add the upload mutation
  const uploadFilesMutation = useMutation({
    mutationFn: uploadMultipleFilesApi,
    onSuccess: () => {
      toast.success('Files uploaded successfully!');
      // Refresh the current folder/directory
      if (currentFolderId) {
        queryClient.invalidateQueries({
          queryKey: ['filemanager-folder', currentFolderId],
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ['filemanager-top'],
        });
      }
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      toast.error('Upload failed. Please try again.');
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Query for top-level files
  const {
    data: filemanTopData,
    isLoading: isTopLoading,
    isError: isTopError,
  } = useQuery({
    queryFn: getTopLevelEntitiesFromFileManager,
    queryKey: ['filemanager-top'],
    enabled: currentFolderId === null, // Only fetch when at root level
    select: (data) => {
      return data.data.items;
    },
  });

  // Query for folder contents
  const {
    data: folderData,
    isLoading: isFolderLoading,
    isError: isFolderError,
  } = useQuery({
    queryFn: () => getFilesByFolderId(currentFolderId!),
    queryKey: ['filemanager-folder', currentFolderId],
    enabled: currentFolderId !== null, // Only fetch when inside a folder
    select: (data) => {
      // Transform the API response to match your FileItem structure
      const folderInfo = data.data;
      const children = folderInfo.children || [];

      return children.map((child: any) => ({
        id: child.id,
        name: child.name,
        nature: child.nature,
        size: child.size,
        date_created: child.date_created,
        date_updated: child.date_updated,
        file: child.file,
        file_id: child.file_id,
        // Add parent reference for navigation
        recent_parent: currentFolderId ? { id: currentFolderId } : null,
      }));
    },
  });

  const createNewFolderMutation = useMutation({
    mutationFn: createNewFolder,
    mutationKey: ['filemanager-folder', currentFolderId],
    onSuccess: () => {
      toast.success('Created folder successfully.');
      if (currentFolderId) {
        queryClient.invalidateQueries({
          queryKey: ['filemanager-folder', currentFolderId],
        });
      }

      queryClient.invalidateQueries({
        queryKey: ['filemanager-top'],
      });
    },
  });

  const handleNewFolder = async (data: any) => {
    try {
      console.log('Creating new folder with data:', data);

      // Here you would typically make an API call to create the folder
      // For now, we'll just log the FormData as requested
      console.log('=== New Folder Creation ===');
      console.log('Parent ID:', data.parent_id || 'root');
      console.log('Folder Name:', data.folder_name);

      // Example API call (uncomment when ready to implement):
      // const response = await createFolder(data.formData);
      // console.log('Folder created successfully:', response);

      // Refresh the file list after creation
      // You might want to refetch your data here
      createNewFolderMutation.mutate({
        name: data.folder_name,
        parent_id: data.parent_id,
      });
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  };

  const handleUploadFiles = async (files: File[], parentId: string | null) => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();

      // Add parent_id if exists (now passed from UploadModal)
      if (parentId) {
        formData.append('parent_id', parentId);
      }

      // Add all selected files
      files.forEach((file) => {
        formData.append('files', file);
      });

      // Call the upload mutation
      await uploadFilesMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Upload failed:', error);
      throw error; // Re-throw to let UploadModal handle the error display
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    const fileIds = deleteModal.files.map((file) => file.id);
    setIsDeleting(true);
    await deleteFilesMutation.mutateAsync(fileIds);
  };

  // Update files when data changes
  React.useEffect(() => {
    if (currentFolderId === null && filemanTopData) {
      // At root level, use top-level data
      setFiles(filemanTopData);
    } else if (currentFolderId && folderData) {
      // Inside a folder, use folder data
      setFiles(folderData);
    }
  }, [filemanTopData, folderData, currentFolderId]);

  // Keyboard event handler for multi-selection shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll(true);
      }

      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setLastSelectedId(null);
      }

      if (e.key === 'Delete' && selectedIds.size > 0) {
        handleAction('delete');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds]);

  // Clear selection when path changes
  React.useEffect(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, [currentPath, currentFolderId]);

  // Enhanced navigation function
  const navigateToFolder = (folderId: string, folderName: string) => {
    const newPath = [...currentPath, folderName];
    const newPathWithIds = [...pathWithIds, { name: folderName, id: folderId }];

    setCurrentPath(newPath);
    setPathWithIds(newPathWithIds);
    setCurrentFolderId(folderId);
    setSelectedIds(new Set());
    setLastSelectedId(null);
  };

  const navigateToPath = (targetPath: string[]) => {
    // Find the corresponding folder ID for the target path
    const targetIndex = targetPath.length - 1;
    const targetPathWithId = pathWithIds[targetIndex];

    if (targetPathWithId) {
      setCurrentPath(targetPath);
      setPathWithIds(pathWithIds.slice(0, targetIndex + 1));
      setCurrentFolderId(targetPathWithId.id);
    } else {
      // Fallback to root if path not found
      setCurrentPath(['root']);
      setPathWithIds([{ name: 'root', id: null }]);
      setCurrentFolderId(null);
    }

    setSelectedIds(new Set());
    setLastSelectedId(null);
  };

  // Get current files (now simplified since we handle this in useEffect)
  const getCurrentFiles = () => {
    return files;
  };

  // Filtered and sorted files
  const filteredAndSortedFiles = useMemo(() => {
    let result = getCurrentFiles().filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!viewConfig.showHidden) {
      result = result.filter((file) => !file.name.startsWith('.'));
    }

    result.sort((a, b) => {
      let aVal, bVal;

      switch (viewConfig.sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'size':
          aVal = a.size || 0;
          bVal = b.size || 0;
          break;
        case 'date_created':
          aVal = new Date(a.date_created).getTime();
          bVal = new Date(b.date_created).getTime();
          break;
        case 'nature':
          aVal = a.nature;
          bVal = b.nature;
          break;
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }

      if (viewConfig.sortOrder === 'desc') {
        [aVal, bVal] = [bVal, aVal];
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal);
      }
      return (aVal as number) - (bVal as number);
    });

    // Sort folders first
    return result.sort((a, b) => {
      if (a.nature === 'folder' && b.nature === 'file') return -1;
      if (a.nature === 'file' && b.nature === 'folder') return 1;
      return 0;
    });
  }, [files, searchQuery, viewConfig]);

  // Enhanced multi-selection handler
  const handleSelect = (id: string, multi = false, shift = false) => {
    const newSelected = new Set(selectedIds);

    if (shift && lastSelectedId) {
      const currentIndex = filteredAndSortedFiles.findIndex((f) => f.id === id);
      const lastIndex = filteredAndSortedFiles.findIndex(
        (f) => f.id === lastSelectedId
      );

      if (currentIndex !== -1 && lastIndex !== -1) {
        const startIndex = Math.min(currentIndex, lastIndex);
        const endIndex = Math.max(currentIndex, lastIndex);

        if (!multi) {
          newSelected.clear();
        }

        for (let i = startIndex; i <= endIndex; i++) {
          newSelected.add(filteredAndSortedFiles[i].id);
        }
      }
    } else if (multi) {
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    } else {
      newSelected.clear();
      newSelected.add(id);
    }

    setSelectedIds(newSelected);
    setLastSelectedId(id);
    if (pickerMode && onPickerSelect) {
      const selectedFiles = filteredAndSortedFiles.filter((f) =>
        newSelected.has(f.id)
      );
      onPickerSelect(Array.from(newSelected), selectedFiles);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredAndSortedFiles.map((f) => f.id));
      setSelectedIds(allIds);
      setLastSelectedId(filteredAndSortedFiles[0]?.id || null);
    } else {
      setSelectedIds(new Set());
      setLastSelectedId(null);
    }
  };

  // File opening function
  const openFileViewer = (file: FileItem) => {
    const fileType = getFileType(file);

    setFileViewer({
      isOpen: true,
      file: file,
      type: fileType,
    });
  };

  const closeFileViewer = () => {
    setFileViewer({
      isOpen: false,
      file: null,
      type: null,
    });
  };

  // Enhanced double-click handler
  const handleDoubleClick = (item: FileItem) => {
    if (item.nature === 'folder') {
      navigateToFolder(item.id, item.name);
    } else {
      openFileViewer(item);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, item: FileItem) => {
    event.preventDefault();

    if (!selectedIds.has(item.id)) {
      setSelectedIds(new Set([item.id]));
      setLastSelectedId(item.id);
    }

    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      item,
    });
  };

  // Enhanced context action handler
  const handleContextAction = (action: string) => {
    if (!contextMenu.item) return;

    const selectedFiles = filteredAndSortedFiles.filter((f) =>
      selectedIds.has(f.id)
    );
    const isMultipleSelection = selectedFiles.length > 1;

    switch (action) {
      case 'open':
        if (contextMenu.item.nature === 'file') {
          openFileViewer(contextMenu.item);
        } else {
          handleDoubleClick(contextMenu.item);
        }
        break;
      case 'copy':
        console.log(
          `Copy ${
            isMultipleSelection
              ? selectedFiles.length + ' items'
              : contextMenu.item.name
          }`
        );
        break;
      case 'move':
        console.log(
          `Move ${
            isMultipleSelection
              ? selectedFiles.length + ' items'
              : contextMenu.item.name
          }`
        );
        break;
      case 'rename':
        if (isMultipleSelection) {
          console.log('Cannot rename multiple items at once');
        } else {
          console.log('Rename:', contextMenu.item.name);
        }
        break;
      case 'delete':
        setDeleteModal({
          isOpen: true,
          files: isMultipleSelection ? selectedFiles : [contextMenu.item],
        });
        break;
      case 'download':
        if (isMultipleSelection) {
          downloadMultipleFiles(selectedFiles);
        } else {
          downloadSingleFile(contextMenu.item);
        }
        break;
      case 'share':
        console.log(
          `Share ${
            isMultipleSelection
              ? selectedFiles.length + ' items'
              : contextMenu.item.name
          }`
        );
        break;
      case 'properties':
        setPropertiesModal({
          isOpen: true,
          files: isMultipleSelection ? selectedFiles : [contextMenu.item],
        });
        break;
      default:
        console.log('Unknown action:', action);
    }

    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  const handleAction = (action: string) => {
    const selectedFiles = filteredAndSortedFiles.filter((f) =>
      selectedIds.has(f.id)
    );

    switch (action) {
      case 'upload':
        setUploadModal({ isOpen: true });
        break;
      case 'newfolder':
        setNewFolderModal({ isOpen: true });
        break;
      case 'copy':
        console.log(`Copy ${selectedFiles.length} selected files`);
        break;
      case 'move':
        console.log(`Move ${selectedFiles.length} selected files`);
        break;
      case 'delete':
        if (selectedFiles.length > 0) {
          setDeleteModal({
            isOpen: true,
            files: selectedFiles,
          });
        }
        break;
      case 'share':
        console.log(`Share ${selectedFiles.length} selected files`);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleViewChange = (config: Partial<ViewConfig>) => {
    setViewConfig((prev) => ({ ...prev, ...config }));
  };

  const allSelected =
    filteredAndSortedFiles.length > 0 &&
    filteredAndSortedFiles.every((file) => selectedIds.has(file.id));

  // Loading state
  const isLoading = isTopLoading || isFolderLoading;
  const isError = isTopError || isFolderError;

  // Render file viewer
  const renderFileViewer = () => {
    if (!fileViewer.isOpen || !fileViewer.file) return null;

    const commonProps = {
      file: fileViewer.file,
      onClose: closeFileViewer,
    };

    switch (fileViewer.type) {
      case 'image':
        return <ImageViewer {...commonProps} files={filteredAndSortedFiles} />;
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

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Error loading files
          </h3>
          <p className="text-gray-400">
            There was an error loading the file manager. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <FileManagerHeader
        viewConfig={viewConfig}
        onViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCount={selectedIds.size}
        onAction={handleAction}
      />

      {/* Breadcrumb */}
      <Breadcrumb
        path={currentPath}
        pathWithIds={pathWithIds}
        onNavigate={navigateToPath}
      />

      {/* File Content */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading files...</p>
            </div>
          </div>
        ) : filteredAndSortedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <HugeiconsIcon
              icon={FileIcon}
              className="w-16 h-16 text-gray-300 mb-4"
            />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No files found
            </h3>
            <p className="text-gray-400 text-center max-w-md">
              {searchQuery
                ? `No files match "${searchQuery}". Try adjusting your search terms.`
                : 'This folder is empty. Upload files or create new folders to get started.'}
            </p>
          </div>
        ) : viewConfig.type === 'grid' ? (
          <GridView
            files={filteredAndSortedFiles}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
          />
        ) : (
          <ListView
            files={filteredAndSortedFiles}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            onSelectAll={handleSelectAll}
            allSelected={allSelected}
          />
        )}
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        onAction={handleContextAction}
        item={contextMenu.item}
      />

      <PropertiesModal
        isOpen={propertiesModal.isOpen}
        files={propertiesModal.files}
        onClose={() => setPropertiesModal({ isOpen: false, files: [] })}
      />

      <NewFolderModal
        isOpen={newFolderModal.isOpen}
        onClose={() => setNewFolderModal({ isOpen: false })}
        parentId={currentFolderId}
        onSubmit={handleNewFolder}
      />

      <UploadModal
        isOpen={uploadModal.isOpen}
        onClose={() => setUploadModal({ isOpen: false })}
        parentId={currentFolderId}
        onUpload={handleUploadFiles}
        isUploading={isUploading}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, files: [] })}
        onConfirm={handleDeleteConfirm}
        files={deleteModal.files}
        isDeleting={isDeleting}
      />

      {/* File Viewer */}
      {renderFileViewer()}
    </div>
  );
};

export default FileManager;
