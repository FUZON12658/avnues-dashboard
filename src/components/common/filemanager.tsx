"use client";
import React, { useState, useMemo } from 'react';
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
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react';

// Types
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified: string;
  extension?: string;
  thumbnail?: string;
  parentId?: string;
  path: string[];
}

interface ViewConfig {
  type: 'grid' | 'list';
  sortBy: 'name' | 'size' | 'modified' | 'type';
  sortOrder: 'asc' | 'desc';
  showHidden: boolean;
}

// Sample Data
const sampleFiles: FileItem[] = [
  {
    id: '1',
    name: 'Documents',
    type: 'folder',
    modified: '2024-06-01',
    path: ['root'],
  },
  {
    id: '2',
    name: 'Projects',
    type: 'folder',
    modified: '2024-06-10',
    path: ['root'],
  },
  {
    id: '3',
    name: 'Images',
    type: 'folder',
    modified: '2024-06-05',
    path: ['root'],
  },
  {
    id: '4',
    name: 'report.pdf',
    type: 'file',
    size: 2048576,
    extension: 'pdf',
    modified: '2024-06-08',
    path: ['root'],
  },
  {
    id: '5',
    name: 'presentation.pptx',
    type: 'file',
    size: 5242880,
    extension: 'pptx',
    modified: '2024-06-07',
    path: ['root'],
  },
  {
    id: '6',
    name: 'budget.xlsx',
    type: 'file',
    size: 1048576,
    extension: 'xlsx',
    modified: '2024-06-06',
    path: ['root'],
  },
  {
    id: '7',
    name: 'notes.txt',
    type: 'file',
    size: 2048,
    extension: 'txt',
    modified: '2024-06-09',
    path: ['root'],
  },
  {
    id: '8',
    name: 'avatar.jpg',
    type: 'file',
    size: 512000,
    extension: 'jpg',
    modified: '2024-06-04',
    path: ['root'],
  },
];

// Utility Functions
const formatFileSize = (bytes?: number): string => {
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
  });
};

const getFileIcon = (item: FileItem) => {
  if (item.type === 'folder') {
    return (
      <HugeiconsIcon icon={FolderIcon} className="w-5 h-5 text-blue-500" />
    );
  }

  const iconMap: Record<string, React.ReactNode> = {
    pdf: <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-red-500" />,
    doc: <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-blue-600" />,
    docx: <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-blue-600" />,
    xls: <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-green-600" />,
    xlsx: <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-green-600" />,
    ppt: <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-orange-600" />,
    pptx: <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-orange-600" />,
    txt: <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-gray-500" />,
    jpg: <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-purple-500" />,
    jpeg: <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-purple-500" />,
    png: <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-purple-500" />,
    gif: <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-purple-500" />,
  };

  return (
    iconMap[item.extension || ''] || (
      <HugeiconsIcon icon={FileIcon} className="w-5 h-5 text-purple-500" />
    )
  );
};

const SettingsDropdown: React.FC<{
  viewConfig: ViewConfig;
  onViewChange: (config: Partial<ViewConfig>) => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ viewConfig, onViewChange, isOpen, onClose }) => {
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
            <HugeiconsIcon icon={GridViewIcon} className="w-4 h-4 text-gray-500" />
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
        <h3 className="text-sm font-medium  mb-3">Sort by</h3>
        <div className="space-y-2">
          {[
            { value: 'name', label: 'Name', icon: SortByUp01Icon },
            { value: 'modified', label: 'Date modified', icon: Calendar01Icon },
            { value: 'size', label: 'Size', icon: ArrowUp01Icon },
            { value: 'type', label: 'Type', icon: File01Icon },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer hover:bg-surface-200 -mx-2 px-2 py-1 rounded">
              <input
                type="radio"
                name="sort-by"
                checked={viewConfig.sortBy === option.value}
                onChange={() => onViewChange({ sortBy: option.value as any })}
                className="w-4 h-4 text-blue-600"
              />
              <HugeiconsIcon icon={option.icon} className="w-4 h-4 text-gray-500" />
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
            <HugeiconsIcon icon={SortByUp01Icon} className="w-4 h-4 text-gray-500" />
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
            <HugeiconsIcon icon={SortByDown01Icon} className="w-4 h-4 text-gray-500" />
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
            <h1 className="text-3xl font-bold ">File Manager</h1>
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
            {/* <button
              onClick={() => onAction('filter')}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
            >
              <HugeiconsIcon icon={FilterIcon} className="w-4 h-4" />
              Filter
            </button> */}

            {/* View Toggle */}
            {/* <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => onViewChange({ type: 'grid' })}
                className={`p-3 transition-all ${
                  viewConfig.type === 'grid'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Grid view"
              >
                <HugeiconsIcon icon={GridViewIcon} className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewChange({ type: 'list' })}
                className={`p-3 transition-all ${
                  viewConfig.type === 'list'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="List view"
              >
                <HugeiconsIcon icon={MenuIcon} className="w-4 h-4" />
              </button>
            </div> */}

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
      {selectedCount > 0 && (
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

// Breadcrumb Component
const Breadcrumb: React.FC<{
  path: string[];
  onNavigate: (path: string[]) => void;
}> = ({ path, onNavigate }) => {
  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-background">
      <button
        onClick={() => onNavigate(['root'])}
        className="flex items-center  gap-2 px-2 py-1 text-sm hover:bg-surface-200 rounded-md transition-all"
      >
        <HugeiconsIcon icon={Home01Icon} className="w-4 h-4" />
        <span className='mt-[0.125rem]'>Home</span>
      </button>

      {path.slice(1).map((segment, index) => (
        <React.Fragment key={index}>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="w-4 h-4 text-gray-400 mt-[0.125rem]"
          />
          <button
            onClick={() => onNavigate(path.slice(0, index + 2))}
            className="px-2 py-1 mt-[0.125rem] text-sm hover:bg-surface-200 rounded-md transition-all"
          >
            {segment}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

// Grid View Component
const GridView: React.FC<{
  files: FileItem[];
  selectedIds: Set<string>;
  onSelect: (id: string, multi?: boolean) => void;
  onDoubleClick: (item: FileItem) => void;
  onAction: (action: string, item: FileItem) => void;
}> = ({ files, selectedIds, onSelect, onDoubleClick, onAction }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-6">
      {files.map((item) => (
        <div
          key={item.id}
          className={`group relative p-4 rounded-lg bg-background border-2 transition-all cursor-pointer hover:shadow-md ${
            selectedIds.has(item.id)
              ? 'border-blue-500 bg-background/90'
              : 'border-border hover:border-gray-300'
          }`}
          onClick={(e) => onSelect(item.id, e.ctrlKey || e.metaKey)}
          onDoubleClick={() => onDoubleClick(item)}
        >
          {/* Selection checkbox */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <input
              type="checkbox"
              checked={selectedIds.has(item.id)}
              onChange={() => onSelect(item.id)}
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
              <p className="text-sm font-medium truncate mb-1">
                {item.name}
              </p>
              <p className="text-xs text-gray-400">
                {item.type === 'file' ? formatFileSize(item.size) : 'Folder'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(item.modified)}
              </p>
            </div>
          </div>

          {/* Action menu */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('menu', item);
                }}
                className="p-1 rounded-md  border border-border shadow-sm hover:bg-surface-200 cursor-pointer transition-all"
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} className="w-3 h-3" />
              </button>
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
  onSelect: (id: string, multi?: boolean) => void;
  onDoubleClick: (item: FileItem) => void;
  onAction: (action: string, item: FileItem) => void;
}> = ({ files, selectedIds, onSelect, onDoubleClick, onAction }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-border">
          <tr>
            <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                onChange={(e) => {
                  if (e.target.checked) {
                    files.forEach((file) => onSelect(file.id, true));
                  } else {
                    files.forEach((file) => onSelect(file.id, false));
                  }
                }}
              />
            </th>
            <th className="text-left py-3 px-6 text-xs font-medium uppercase tracking-wider">
              Name
            </th>
            <th className="text-left py-3 px-6 text-xs font-medium uppercase tracking-wider">
              Size
            </th>
            <th className="text-left py-3 px-6 text-xs font-medium uppercase tracking-wider">
              Type
            </th>
            <th className="text-left py-3 px-6 text-xs font-medium uppercase tracking-wider">
              Modified
            </th>
            <th className="text-left py-3 px-6 text-xs font-medium uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {files.map((item) => (
            <tr
              key={item.id}
              className={`transition-colors hover:bg-surface-100 cursor-pointer ${
                selectedIds.has(item.id) ? 'bg-surface-200' : ''
              }`}
              onClick={(e) => onSelect(item.id, e.ctrlKey || e.metaKey)}
              onDoubleClick={() => onDoubleClick(item)}
            >
              <td className="py-4 px-6">
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => onSelect(item.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  {getFileIcon(item)}
                  <span className="text-sm font-medium ">
                    {item.name}
                  </span>
                </div>
              </td>
              <td className="py-4 px-6 text-sm text-gray-500">
                {item.type === 'file' ? formatFileSize(item.size) : '—'}
              </td>
              <td className="py-4 px-6 text-sm text-gray-500 capitalize">
                {item.type === 'folder' ? 'Folder' : item.extension || 'File'}
              </td>
              <td className="py-4 px-6 text-sm text-gray-500">
                {formatDate(item.modified)}
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('download', item);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Download"
                  >
                    <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('share', item);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Share"
                  >
                    <HugeiconsIcon icon={Share08Icon} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('edit', item);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Rename"
                  >
                    <HugeiconsIcon icon={Edit02Icon} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction('menu', item);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="More"
                  >
                    <HugeiconsIcon
                      icon={MoreHorizontalIcon}
                      className="w-4 h-4"
                    />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Main File Manager Component
const FileManager: React.FC = () => {
  const [files] = useState<FileItem[]>(sampleFiles);
  const [currentPath, setCurrentPath] = useState<string[]>(['root']);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewConfig, setViewConfig] = useState<ViewConfig>({
    type: 'grid',
    sortBy: 'name',
    sortOrder: 'asc',
    showHidden: false,
  });

  // Filter and sort files
  const displayedFiles = useMemo(() => {
    let filteredFiles = files.filter((file) => {
      // Filter by current path
      const pathMatch = file.path.join('/') === currentPath.join('/');

      // Filter by search query
      const searchMatch =
        !searchQuery ||
        file.name.toLowerCase().includes(searchQuery.toLowerCase());

      return pathMatch && searchMatch;
    });

    // Sort files
    filteredFiles.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (viewConfig.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'modified':
          aValue = new Date(a.modified).getTime();
          bValue = new Date(b.modified).getTime();
          break;
        case 'type':
          aValue = a.type === 'folder' ? 'aaa' : a.extension || 'zzz';
          bValue = b.type === 'folder' ? 'aaa' : b.extension || 'zzz';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return viewConfig.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return viewConfig.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filteredFiles;
  }, [files, currentPath, searchQuery, viewConfig]);

  const handleSelect = (id: string, multi: boolean = false) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);

      if (multi) {
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      } else {
        newSet.clear();
        newSet.add(id);
      }

      return newSet;
    });
  };

  const handleDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentPath([...currentPath, item.name]);
      setSelectedIds(new Set());
    } else {
      // Handle file opening
      console.log('Opening file:', item.name);
    }
  };

  const handleAction = (action: string, item?: FileItem) => {
    console.log('Action:', action, item ? `on ${item.name}` : '');

    switch (action) {
      case 'upload':
        // Handle file upload
        break;
      case 'newfolder':
        // Handle new folder creation
        break;
      case 'delete':
        setSelectedIds(new Set());
        break;
      case 'copy':
      case 'share':
      case 'download':
      case 'edit':
      case 'menu':
        // Handle specific actions
        break;
    }
  };

  const handleViewChange = (config: Partial<ViewConfig>) => {
    setViewConfig((prev) => ({ ...prev, ...config }));
  };

  const handleNavigate = (path: string[]) => {
    setCurrentPath(path);
    setSelectedIds(new Set());
  };

  return (
    <div className="min-h-screen bg-background">
      <FileManagerHeader
        viewConfig={viewConfig}
        onViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCount={selectedIds.size}
        onAction={handleAction}
      />

      <Breadcrumb path={currentPath} onNavigate={handleNavigate} />

      <div className="min-h-[600px] bg-background">
        {displayedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <HugeiconsIcon
              icon={FolderIcon}
              className="w-16 h-16 mb-4 text-gray-300"
            />
            <p className="text-lg font-medium">No files found</p>
            <p className="text-sm">
              {searchQuery
                ? `No files match "${searchQuery}"`
                : 'This folder is empty'}
            </p>
          </div>
        ) : (
          <>
            {viewConfig.type === 'grid' ? (
              <GridView
                files={displayedFiles}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onDoubleClick={handleDoubleClick}
                onAction={handleAction}
              />
            ) : (
              <ListView
                files={displayedFiles}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onDoubleClick={handleDoubleClick}
                onAction={handleAction}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FileManager;
