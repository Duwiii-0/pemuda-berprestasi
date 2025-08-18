import { Link } from 'react-router-dom';

interface GeneralButtonProps {
  label: string;
  type?: "link" | "scroll" | "action";
  to?: string;
  onClick?: () => void;
  className?:string;
  disabled?: boolean;
}

const GeneralButton: React.FC<GeneralButtonProps> = ({ label, type, to, onClick, className, disabled }) => {
  if (type === "link" && to) {
    return <Link to={to}       onClick={() => window.scrollTo(0, 0)} // tambahin ini
    className={`py-6 md:py-0 text-center btn px-6 rounded-lg font-inter flex justify-center items-center cursor-pointer ${className}`}>{label}</Link>; // Bisa diganti Link kalau full page routing
  }
  
  if (type === "scroll" && to) {
    return (
      <button
        className={`btn px-6 rounded-sm font-inter flex justify-center items-center cursor-pointer ${className}`}
        onClick={() => {
          document.querySelector(to)?.scrollIntoView({ behavior: "smooth" });
        }}
        
      >
        {label}
      </button>
    );
  }

    if (type === "action") {
      return (
        <button className={`relative group hover:scale-105 hover:border-0 duration-300 w-64 flex items-center overflow-hidden btn px-6 rounded-lg font-inter cursor-pointer ${className}`} onClick={onClick}>
          <span></span>
          <span className='absolute transition-transform duration-400 group-hover:-translate-y-10'>{label}</span>
          <span className='absolute text-black transition-transform duration-400 translate-y-10 group-hover:translate-y-0 z-10'>{label}</span>

          <span className='absolute inset-0 bg-white transition-transform duration-400 -translate-y-11 group-hover:translate-y-0 group-hover:scale-105 w-full h-full'/>
        </button>
      );
  }
    return (
      <button
        className={`btn px-6 rounded-sm font-inter flex justify-center items-center cursor-pointer ${className} `} onClick={onClick}
        disabled={disabled}
      >
        {label}
      </button>
    );
};


export default GeneralButton;