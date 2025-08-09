import React from "react";

type TextProps = {
  placeholder: string;
  className?: string;
  icon?: React.ReactNode;
};

const TextInput = ({ placeholder, className, icon }: TextProps) => {
  return (
    <div className={`flex items-center border-2 border-red rounded-md px-2 gap-2 ${className}`}>
      {icon && <span>{icon}</span>}
      <input
        placeholder={placeholder}
        type="text"
        className="flex-1 outline-none bg-transparent placeholder-red/50"
      />
    </div>
  );
};

export default TextInput;
