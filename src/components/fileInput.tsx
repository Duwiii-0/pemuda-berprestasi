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
  accept = "*/*",
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
    if (!fileName) return <Upload size={20} />;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileIcon size={20} className="text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Upload size={20} className="text-blue-500" />;
      default:
        return <FileIcon size={20} />;
    }
  };

  return (
    <div className={`relative ${className}`}>
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
          flex items-center justify-between w-full px-4 py-3 
          border-2 border-dashed rounded-xl cursor-pointer
          transition-all duration-300 min-h-[48px]
          ${disabled 
            ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
            : 'border-red/30 hover:border-red/50 bg-white/50 hover:bg-white/70'
          }
          ${className}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {getFileIcon(file?.name)}
          </div>
          
          <div className="flex-1 min-w-0">
            {file ? (
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 font-plex">
                {placeholder}
              </p>
            )}
          </div>
        </div>
        
        {file && !disabled && (
          <button
            type="button"
            onClick={clearFile}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 ml-2"
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {/* File type hint */}
      <div className="mt-1 text-xs text-gray-500 font-plex">
        {accept === "image/*" && "Format yang didukung: JPG, PNG, GIF"}
        {accept === "image/*,application/pdf" && "Format yang didukung: JPG, PNG, GIF, PDF"}
        {accept === "*/*" && "Semua format file"}
      </div>
    </div>
  );
};

export default FileInput;