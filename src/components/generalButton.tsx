import { Link } from 'react-router-dom';

interface GeneralButtonProps {
  label: string;
  type?: "link" | "scroll" | "action" | "hero" | 'navbar' | 'submit';
  to?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const GeneralButton: React.FC<GeneralButtonProps> = ({ label, type, to, onClick, className, disabled }) => {
  if (type === "link" && to) {
    return <Link to={to} onClick={() => window.scrollTo(0, 0)} 
    className={`py-6 md:py-0 text-center btn px-6 rounded-2xl font-plex flex justify-center items-center cursor-pointer ${className}`}>{label}</Link>;
  }
  
  if (type === "hero" && to) {
    return <>
      <Link to={to} onClick={() => window.scrollTo(0, 0)} 
        className={`relative group hover:scale-103 hover:border-0 duration-300 w-48 md:w-64 flex justify-center items-center overflow-hidden btn px-6 rounded-lg font-plex cursor-pointer ${className}`}>
          <span className='md:text-xl absolute transition-transform duration-400 group-hover:translate-x-100 text-center'>{label}</span>
          <span className='text-xl absolute text-red transition-transform duration-400 -translate-x-100 group-hover:translate-x-0 z-10'>{label}</span>

          <span className='absolute inset-0 bg-white rounded-xl transition-transform duration-400 -translate-x-100 group-hover:translate-x-0 group-hover:scale-105 w-full h-full'/>

      </Link>
    </>
  }

  if (type === "navbar" && to) {
    return <>
      <Link to={to} onClick={() => window.scrollTo(0, 0)} 
        className={`relative group hover:scale-103 duration-300 md:w-32 flex justify-center items-center overflow-hidden btn px-6 rounded-lg font-plex cursor-pointer ${className}`}>
          <span className='text-xl absolute transition-transform duration-400 group-hover:translate-y-10'>{label}</span>
          <span className='text-xl absolute transition-transform duration-400 -translate-y-10 group-hover:translate-y-0 z-10'>{label}</span>
      </Link>
    </>
  }

  if (type === "scroll" && to) {
    return (
      <button
        className={`btn px-6 rounded-sm font-plex flex justify-center items-center cursor-pointer ${className}`}
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
      <button className={`relative group hover:scale-105 hover:border-0 duration-300 w-62 flex items-center overflow-hidden btn px-6 rounded-lg font-plex cursor-pointer ${className}`} onClick={onClick}>
        <span className='text-xl text-center absolute transition-transform duration-300 group-hover:-translate-y-10'>{label}</span>
        <span className='text-xl text-center absolute text-red transition-transform duration-300 translate-y-10 group-hover:translate-y-0 z-10'>{label}</span>

        <span className='absolute inset-0 bg-white rounded-lg transition-transform duration-300 -translate-y-11 group-hover:translate-y-0 group-hover:scale-105 w-full h-full'/>
      </button>
    );
  }

  if (type === "submit") {
    return (
      <button
        type="submit"
        className={`btn px-6 rounded-2xl font-plex flex justify-center items-center cursor-pointer ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      className={`btn px-6 rounded-2xl font-plex flex justify-center items-center cursor-pointer ${className}`} 
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default GeneralButton;