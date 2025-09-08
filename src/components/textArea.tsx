import React from "react";

type TextAreaProps = {
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; // ganti tipe
  rows?: number; // biar bisa set tinggi awal
};

const TextArea = ({ placeholder, className, icon, value, disabled, onChange, rows = 3 }: TextAreaProps) => {
  return (
    <div className={`flex items-start justify-start border-2 border-red rounded-md px-2 gap-2 font-plex ${className}`}>
      {icon && <span className="pt-2">{icon}</span>}
      <textarea
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className="flex-1 outline-none bg-transparent placeholder-red/50 resize-none placeholder:pt-1"
      />
    </div>
  );
};

export default TextArea;
