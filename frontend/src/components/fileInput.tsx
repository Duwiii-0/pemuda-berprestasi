// src/components/fileInput.tsx
import React, { useRef } from 'react';
import { Upload, FileIcon, X } from 'lucide-react';

interface FileInputProps {
  accept?: string;
  multiple?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  file?: File | null;
  placeholder?: string;
}

const FileInput: React.FC<FileInputProps> = ({
  accept = "/*",
  multiple = false,
  onChange,
  disabled = false,
  className = "",
  file,
  placeholder = "Pilih file..."
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      // Create synthetic event for clearing
      const syntheticEvent = {
        target: { files: null },
        currentTarget: fileInputRef.current
      } as React.ChangeEvent<HTMLInputElement>;

      if (onChange) {
        onChange(syntheticEvent);
      }
    }
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <Upload size={20} className="flex-shrink-0" />;

    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return <FileIcon size={20} className="text-red-500 flex-shrink-0" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Upload size={20} className="text-blue-500 flex-shrink-0" />;
      default:
        return <FileIcon size={20} className="flex-shrink-0" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`relative w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      <div
        onClick={handleClick}
        className={`
          flex items-center justify-between w-full px-3 py-3 sm:px-4
          border-2 border-dashed rounded-xl cursor-pointer
          transition-all duration-300 min-h-[48px] sm:min-h-[52px]
          ${disabled 
            ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
            : 'border-red/30 hover:border-red/50 bg-white/50 hover:bg-white/70'
          }
        `}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
          <div className="flex-shrink-0">
            {getFileIcon(file?.name)}
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            {file ? (
              <div className="flex flex-col gap-0.5 sm:gap-1 w-full">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate w-full">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 font-plex truncate">
                {placeholder}
              </p>
            )}
          </div>
        </div>

        {file && !disabled && (
          <button
            type="button"
            onClick={clearFile}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 ml-1 sm:ml-2 touch-manipulation"
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* File type hint */}
      <div className="mt-1 text-xs text-gray-500 font-plex px-1">
        {accept === "image/*" && "Format yang didukung: JPG, PNG, GIF"}
        {accept === "image/*,application/pdf" && "Format yang didukung: JPG, PNG, GIF, PDF"}
        {accept === "/*" && "Semua format file"}
      </div>
    </div>
  );
};

export default FileInput;