import { Link } from 'react-router-dom';

interface GeneralButtonProps {
  label: string;
  type: "link" | "scroll" | "action";
  to?: string;
  onClick?: () => void;
  className?:string;
}

const GeneralButton: React.FC<GeneralButtonProps> = ({ label, type, to, onClick, className }) => {
  if (type === "link" && to) {
    return <Link to={to} className={`btn px-6 rounded-lg font-inter flex justify-center items-center cursor-pointer ${className}`}>{label}</Link>; // Bisa diganti Link kalau full page routing
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

  return (
    <button className={`btn px-6 rounded-sm font-inter flex justify-center items-center cursor-pointer ${className}`} onClick={onClick}>
      {label}
    </button>
  );
};


export default GeneralButton;