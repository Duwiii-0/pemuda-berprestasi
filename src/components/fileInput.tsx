import React, { useState, useRef, useEffect } from "react";

type FileInputProps = {
  accept?: string;
  file?: File | null; // file baru dari parent
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  previewUrl?: string; // URL file lama dari server
};

const FileInput: React.FC<FileInputProps> = ({ accept, file, onChange, className, disabled, previewUrl }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  // Buat preview ketika user pilih file baru
  useEffect(() => {
    // hanya buat object URL kalau file benar-benar File/Blob
    if (file instanceof File && accept?.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl); // bersihkan memory
    } else {
      setLocalPreview(null);
    }
  }, [file, accept]);


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
        className={`border-2 border-red/20 bg-white/80 rounded-lg cursor-pointer flex items-center justify-center overflow-hidden relative ${className} w-full h-60 py-4`}
      >
        {localPreview ? (
          <img
            src={localPreview}
            alt="teskuu"
            className="w-full h-full object-contain"
          />
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt="tesss"
            className="w-full h-full object-contain"
          />
        ) : (
          <p className="text-gray-400">Klik untuk pilih file</p>
        )}
      </div>
    </>
  );
};

export default FileInput;
