'use client';
import React, { useState, useEffect } from 'react';
import {
  Cancel01Icon,
  ZoomInAreaIcon,
  ZoomOutAreaIcon,
  Rotate01Icon,
  Download01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Maximize01Icon,
  Minimize01Icon,
  VolumeHighIcon,
  VolumeMute01Icon,
  PlayIcon,
  PauseIcon,
  Settings02Icon,
  PrinterIcon,
  Copy01Icon,
  FullScreenIcon,
  ArrowShrink01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
// File type detection
export const FILE_TYPES = {
  image: {
    extensions: [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'bmp',
      'webp',
      'svg',
      'ico',
      'tiff',
    ],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/svg+xml',
    ],
  },
  pdf: {
    extensions: ['pdf'],
    mimeTypes: ['application/pdf'],
  },
  document: {
    extensions: ['doc', 'docx', 'txt', 'rtf', 'odt'],
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
  },
  spreadsheet: {
    extensions: ['xls', 'xlsx', 'csv', 'ods'],
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
  },
  presentation: {
    extensions: ['ppt', 'pptx', 'odp'],
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
  },
  video: {
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'],
    mimeTypes: ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm'],
  },
  audio: {
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'],
    mimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/aac',
    ],
  },
  code: {
    extensions: [
      'js',
      'ts',
      'jsx',
      'tsx',
      'html',
      'css',
      'py',
      'java',
      'cpp',
      'c',
      'php',
      'rb',
      'go',
      'rs',
      'json',
      'xml',
      'yml',
      'yaml',
      'sql',
    ],
    mimeTypes: [
      'text/javascript',
      'text/html',
      'text/css',
      'application/json',
      'text/xml',
    ],
  },
  text: {
    extensions: ['txt', 'md', 'log', 'cfg', 'ini', 'conf'],
    mimeTypes: ['text/plain', 'text/markdown'],
  },
};

export const getFileType = (file: any): string => {
  const extension =
    file.file?.extension?.toLowerCase().replace('.', '') ||
    file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.file?.mime_type?.toLowerCase();

  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (extension && config.extensions.includes(extension)) {
      return type;
    }
    if (mimeType && config.mimeTypes.includes(mimeType)) {
      return type;
    }
  }
  return 'unknown';
};

// Image Viewer Component
export const ImageViewer: React.FC<{
  file: any;
  onClose: () => void;
  files?: any[];
}> = ({ file, onClose, files = [] }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const imageFiles = files.filter((f) => getFileType(f) === 'image');
  const canNavigate = imageFiles.length > 1;

  useEffect(() => {
    const currentImageIndex = imageFiles.findIndex((f) => f.id === file.id);
    if (currentImageIndex >= 0) {
      setCurrentIndex(currentImageIndex);
    }
  }, [file.id, imageFiles]);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === '+' || e.key === '=') handleZoomIn();
    if (e.key === '-') handleZoomOut();
    if (e.key === 'r' || e.key === 'R') handleRotate();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const handlePrevious = () => {
    if (canNavigate && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (canNavigate && currentIndex < imageFiles.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const currentFile = imageFiles[currentIndex] || file;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-80 p-4 flex justify-between items-center">
        <div className="text-white">
          <h3 className="text-lg font-medium">{currentFile.name}</h3>
          {canNavigate && (
            <p className="text-sm text-gray-300">
              {currentIndex + 1} of {imageFiles.length}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
          >
            <HugeiconsIcon icon={ZoomOutAreaIcon} className="w-5 h-5" />
          </button>
          <span className="text-white text-sm min-w-12 text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
          >
            <HugeiconsIcon icon={ZoomInAreaIcon} className="w-5 h-5" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
          >
            <HugeiconsIcon icon={Rotate01Icon} className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
          >
            <HugeiconsIcon
              icon={isFullscreen ? Minimize01Icon : Maximize01Icon}
              className="w-5 h-5"
            />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {canNavigate && currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 z-10"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-6 h-6" />
          </button>
        )}

        <img
          src={
            `${process.env.NEXT_PUBLIC_API_HOST}/${currentFile.file?.path}` ||
            `/api/files/${currentFile.id}/preview`
          }
          alt={currentFile.name}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
          }}
          onDoubleClick={handleReset}
        />

        {canNavigate && currentIndex < imageFiles.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 z-10"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="bg-black bg-opacity-80 p-4 text-center">
        <p className="text-gray-300 text-sm">
          Double-click to reset • Arrow keys to navigate • +/- to zoom • R to
          rotate • ESC to close
        </p>
      </div>
    </div>
  );
};

// PDF Viewer Component
export const PDFViewer: React.FC<{
  file: any;
  onClose: () => void;
}> = ({ file, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);

  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = `${process.env.NEXT_PUBLIC_FILE_HOST}/${
      file.file?.path || `/api/files/${file.id}/preview`
    }`;
    link.download = file.name || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPDF = () => {
    const printWindow = window.open(
      `${process.env.NEXT_PUBLIC_FILE_HOST}/${
        file.file?.path || `/api/files/${file.id}/preview`
      }`,
      '_blank'
    );
    printWindow?.focus();
    printWindow?.print();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="bg-background border-border border-b p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{file.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((prev) => Math.max(prev - 25, 25))}
            className="px-3 py-1 bg-surface-200 hover:bg-surface-300 rounded text-sm"
          >
            <HugeiconsIcon icon={ZoomOutAreaIcon} className="w-4 h-4" />
          </button>
          <span className="text-sm min-w-12 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((prev) => Math.min(prev + 25, 300))}
            className="px-3 py-1 bg-surface-200 hover:bg-surface-300 rounded text-sm"
          >
            <HugeiconsIcon icon={ZoomInAreaIcon} className="w-4 h-4" />
          </button>
          <button
            onClick={printPDF}
            className="px-3 py-1 bg-surface-200 hover:bg-surface-300 rounded text-sm"
          >
            <HugeiconsIcon icon={PrinterIcon} className="w-4 h-4" />
          </button>

          <button
            onClick={downloadPDF}
            className="px-3 py-1 bg-surface-200 hover:bg-surface-300 rounded text-sm"
          >
            <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-surface-200 hover:bg-surface-300 rounded text-sm"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="flex justify-center p-4">
          <div
            className="bg-white shadow-lg min-h-[45rem] min-w-[50rem]"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(
                `${process.env.NEXT_PUBLIC_FILE_HOST}/${
                  file.file?.path || `/api/files/${file.id}/preview`
                }`
              )}&embedded=true`}
              style={{ width: '100%', height: '100%' }}
              frameBorder="0"
            />
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      {/* <div className="bg-gray-100 border-t p-4 flex justify-center items-center gap-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage <= 1}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <input
          type="number"
          value={currentPage}
          onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
          className="w-16 text-center border rounded px-2 py-1"
          min="1"
          max={totalPages}
        />
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div> */}
    </div>
  );
};

// Document Viewer Component
export const DocumentViewer: React.FC<{
  file: any;
  onClose: () => void;
}> = ({ file, onClose }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewerOption, setViewerOption] = useState('microsoft');
  useEffect(() => {
    // Simulate loading document content
    setTimeout(() => {
      setContent(
        `Document content for ${file.name}\n\nThis is a preview of the document...`
      );
      setLoading(false);
    }, 1000);
  }, [file]);

  const fileUrl = `${process.env.NEXT_PUBLIC_FILE_HOST}/${
    file.file?.path || `/api/files/${file.id}/preview`
  }`;

  const getViewerUrl = () => {
    const encodedUrl = encodeURIComponent(fileUrl);

    if (viewerOption === 'microsoft') {
      // Microsoft Office Online - Better for Word docs
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
    } else {
      // Google Docs Viewer
      return `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
    }
  };

  const downloadDoc = () => {
    const link = document.createElement('a');
    link.href = `${process.env.NEXT_PUBLIC_FILE_HOST}/${
      file.file?.path || `/api/files/${file.id}/preview`
    }`;
    link.download = file.name || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printDoc = () => {
    const printWindow = window.open(
      `${process.env.NEXT_PUBLIC_FILE_HOST}/${
        file.file?.path || `/api/files/${file.id}/preview`
      }`,
      '_blank'
    );
    printWindow?.focus();
    printWindow?.print();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{file.name}</h3>
          <p className="text-sm text-blue-100">
            Document Viewer
            <select
              value={viewerOption}
              onChange={(e) =>
                setViewerOption(e.target.value as 'google' | 'microsoft')
              }
              className="text-xs border rounded px-2 py-1 mx-2"
            >
              <option value="google" className="text-black">
                Google Drive
              </option>
              <option value="microsoft" className="text-black">
                Microsoft Office
              </option>
            </select>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm"
            onClick={printDoc}
          >
            <HugeiconsIcon icon={PrinterIcon} className="w-4 h-4" />
          </button>

          <button
            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm"
            onClick={downloadDoc}
          >
            <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document Content */}
      {/* Content */}
      <div className="flex-1 overflow-auto bg-background py-2">
        <div className="max-w-4xl mx-auto shadow-lg rounded-lg p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none h-[calc(100vh-10rem)]">
              <iframe
                src={getViewerUrl()}
                style={{ width: '100%', height: '100%' }}
                frameBorder="0"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Spreadsheet Viewer Component
export const SpreadsheetViewer: React.FC<{
  file: any;
  onClose: () => void;
}> = ({ file, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [viewerOption, setViewerOption] = useState('microsoft');

  const fileUrl = `${process.env.NEXT_PUBLIC_FILE_HOST}/${
    file.file?.path || `/api/files/${file.id}/preview`
  }`;

  const getViewerUrl = () => {
    const encodedUrl = encodeURIComponent(fileUrl);

    if (viewerOption === 'microsoft') {
      // Microsoft Office Online - Better for Word docs
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
    } else {
      // Google Docs Viewer
      return `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
    }
  };
  useEffect(() => {
    const delay = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(delay);
  }, []);

  const downloadXlsx = () => {
    const link = document.createElement('a');
    link.href = `${process.env.NEXT_PUBLIC_FILE_HOST}/${
      file.file?.path || `/api/files/${file.id}/preview`
    }`;
    link.download = file.name || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{file.name}</h3>
          <p className="text-sm text-blue-100">
            Spreadsheet Viewer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 bg-green-700 hover:bg-green-800 rounded text-sm"
            onClick={downloadXlsx}
          >
            <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-green-700 hover:bg-green-800 rounded text-sm"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-background py-2">
        <div className="max-w-4xl mx-auto shadow-lg rounded-lg p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none h-[calc(100vh-10rem)]">
              <iframe
                src={getViewerUrl()}
                style={{ width: '100%', height: '100%' }}
                frameBorder="0"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Presentation Viewer Component
export const PresentationViewer: React.FC<{
  file: any;
  onClose: () => void;
}> = ({ file, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [viewerOption, setViewerOption] = useState('microsoft');

  useEffect(() => {
    const delay = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(delay);
  }, []);

  const fileUrl = `${process.env.NEXT_PUBLIC_FILE_HOST}/${
    file.file?.path || `/api/files/${file.id}/preview`
  }`;

  const getViewerUrl = () => {
    const encodedUrl = encodeURIComponent(fileUrl);

    if (viewerOption === 'microsoft') {
      // Microsoft Office Online Viewer
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
    } else {
      // Google Docs Viewer (default)
      return `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
    }
  };

  const downloadPpt = () => {
    const link = document.createElement('a');
    link.href = `${process.env.NEXT_PUBLIC_FILE_HOST}/${
      file.file?.path || `/api/files/${file.id}/preview`
    }`;
    link.download = file.name || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{file.name}</h3>
          <p className="text-sm text-blue-100">
            Presentation Viewer
            <select
              value={viewerOption}
              onChange={(e) =>
                setViewerOption(e.target.value as 'google' | 'microsoft')
              }
              className="text-xs border rounded px-2 py-1 mx-2"
            >
              <option value="google" className="text-black">
                Google Drive
              </option>
              <option value="microsoft" className="text-black">
                Microsoft Office
              </option>
            </select>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 bg-orange-700 hover:bg-orange-800 rounded text-sm"
            onClick={downloadPpt}
          >
            <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-orange-700 hover:bg-orange-800 rounded text-sm"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-background py-2">
        <div className="max-w-4xl mx-auto shadow-lg rounded-lg p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none h-[calc(100vh-11rem)]">
              <iframe
                src={getViewerUrl()}
                style={{ width: '100%', height: '100%' }}
                frameBorder="0"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Video Viewer Component
export const VideoViewer: React.FC<{
  file: any;
  onClose: () => void;
}> = ({ file, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-80 p-4 flex justify-between items-center">
        <div className="text-white">
          <h3 className="text-lg font-medium">{file.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded">
            <HugeiconsIcon icon={Settings02Icon} className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 flex items-center justify-center">
        <video
          className="max-w-full max-h-full"
          controls
          autoPlay={isPlaying}
          muted={isMuted}
          src={file.file?.path || `/api/files/${file.id}/preview`}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

// Audio Player Component
export const AudioPlayer: React.FC<{
  file: any;
  onClose: () => void;
}> = ({ file, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">{file.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>
        </div>

        {/* Album Art Placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg mb-6 flex items-center justify-center">
          <HugeiconsIcon
            icon={VolumeHighIcon}
            className="w-16 h-16 text-white"
          />
        </div>

        {/* Audio Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700"
            >
              <HugeiconsIcon
                icon={isPlaying ? PauseIcon : PlayIcon}
                className="w-6 h-6"
              />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-sm text-gray-500">
            <span>
              {Math.floor(currentTime / 60)}:
              {String(Math.floor(currentTime % 60)).padStart(2, '0')}
            </span>
            <span>
              {Math.floor(duration / 60)}:
              {String(Math.floor(duration % 60)).padStart(2, '0')}
            </span>
          </div>
        </div>

        <audio
          src={file.file?.path || `/api/files/${file.id}/preview`}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          className="hidden"
        />
      </div>
    </div>
  );
};

export const CodeViewer: React.FC<{
  file: any;
  onClose: () => void;
}> = ({ file, onClose }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading code content
    setTimeout(() => {
      setContent(
        `// ${file.name}\n\nfunction example() {\n  console.log("Hello, World!");\n  return true;\n}\n\nexample();\n\nclass MyClass {\n  constructor(name) {\n    this.name = name;\n  }\n\n  greet() {\n    return \`Hello, \${this.name}!\`;\n  }\n}\n\nconst instance = new MyClass("World");\nconsole.log(instance.greet());`
      );
      setLoading(false);
    }, 500);
  }, [file]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{file.name}</h3>
          <p className="text-sm text-gray-300">Code Editor</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
          </button>
          <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">
            <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto bg-gray-900 text-gray-100 font-mono text-sm">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div>
        ) : (
          <div className="flex">
            {/* Line Numbers */}
            <div className="bg-gray-800 text-gray-500 p-4 select-none border-r border-gray-700">
              {content.split('\n').map((_, index) => (
                <div key={index} className="leading-6 text-right">
                  {index + 1}
                </div>
              ))}
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 overflow-x-auto">
              <pre className="whitespace-pre leading-6">
                <code>{content}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Text Viewer Component
export const TextViewer: React.FC<{
  file: any;
  onClose: () => void;
}> = ({ file, onClose }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading text content
    setTimeout(() => {
      setContent(
        `${file.name}\n\nThis is a sample text file.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`
      );
      setLoading(false);
    }, 500);
  }, [file]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-600 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{file.name}</h3>
          <p className="text-sm text-gray-200">Text Viewer</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 bg-gray-700 hover:bg-gray-800 rounded text-sm">
            <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-800 rounded text-sm"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Text Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                {content}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
