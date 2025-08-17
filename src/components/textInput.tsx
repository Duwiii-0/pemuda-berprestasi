import React from "react";

type TextProps = {
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

};

const TextInput = ({ placeholder, className, icon, value, disabled, onChange }: TextProps) => {
  return (
    <div className={`flex items-center border-2 border-red rounded-md px-2 gap-2 ${className}`}>
      {icon && <span>{icon}</span>}
      <input
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        type="text"
        className="w-full outline-none bg-transparent placeholder-red/50"
      />
    </div>
  );
};

export default TextInput;
