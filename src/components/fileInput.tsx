import React, { useState, useRef } from "react";

type FileInputProps = {
  accept?: string;
  file?: File | null; // ⬅️ ambil file dari parent
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
};

const FileInput: React.FC<FileInputProps> = ({ accept, file, onChange, className, disabled }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        onClick={handleClick}
        className={`border-2 border-red rounded-lg cursor-pointer flex items-center justify-center overflow-hidden relative ${className} w-full h-60 py-4`}
      >
        {file && accept?.startsWith("image/") ? (
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            className="w-full h-full object-contain"
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
