type ButtonProps = {
    children?: React.ReactNode
    className?: string;
};

const GeneralButton = ({ children, className }: ButtonProps) => {
  return (
    <button
      type="button"
      className={`h-12 px-6 rounded-sm font-inter flex justify-center items-center cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
};

export default GeneralButton;
