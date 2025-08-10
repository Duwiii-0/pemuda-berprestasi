import React, { useState, useRef } from "react";

type FileInputProps = {
  accept?: string; // contoh: "image/*", ".pdf", ".docx"
  onFileSelect?: (file: File | null) => void;
  className?: string;
  disabled?: boolean;

};

const FileInput: React.FC<FileInputProps> = ({ accept, onFileSelect, className, disabled }) => {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (onFileSelect) onFileSelect(selectedFile);
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }  
  };

  return (
    <>
      {/* Input asli disembunyikan */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Kotak custom */}
      <div
        onClick={handleClick}
        className={`border-2 border-red rounded-lg cursor-pointer flex items-center justify-center overflow-hidden relative ${className} w-full h-60 py-4`}
      >
        {file && accept?.startsWith("image/") ? (
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            className="w-full h-full object-contain m-10"
          />
        ) : file ? (
          <p className="text-sm text-gray-600">📄 {file.name}</p>
        ) : (
          <p className="text-gray-400">Klik untuk pilih file</p>
        )}
      </div>
    </>
  );
};

export default FileInput;
