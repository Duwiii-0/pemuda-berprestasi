import React from "react";

export interface TextInputProps {
  icon?: React.ReactNode;
  className?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string; // Pastikan ada ini!
  disabled?: boolean;
  min?: string;
  max?: string;
  step?: string;
  maxLength?: number;
}

const TextInput: React.FC<TextInputProps> = ({
  icon,
  className = "",
  type = "text",
  disabled = false,
  ...props
}) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-1 text-red ">
        {icon}
      </div>
    )}
    <input
      type={type} 
      disabled={disabled}
      {...props}
      className={`placeholder-red/50 w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-3 border-2 rounded-xl font-plex transition-all duration-300 focus:outline-none ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-red/40'
      } ${className}`}
    />
  </div>
);

export default TextInput;
