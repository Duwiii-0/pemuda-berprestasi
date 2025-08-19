interface StepsProps {
  number: number;
  title: string;
  desc: string;
}

const Steps: React.FC<StepsProps> = ({ number, title, desc }) => {
  return (
    <div className="min-w-full h-60 flex gap-8 justify-center group">
      <div className="flex-col gap-2 items-center pt-2">
        <div className="bg-yellow rounded-full h-16 w-16 flex items-center justify-center text-center font-bebas text-5xl text-red pt-1 group-hover:scale-110 group-hover:rotate-7 group-hover:shadow-2xl transition-all duration-300">
          {number}
        </div>
        <div className="text-black/30 text-xl font-plex text-center">Step</div>
      </div>

      <div className="flex flex-col justify-center gap-2 sm:gap-4 bg-white shadow-2xl rounded-xl w-3/4 px-8 py-4 sm:py-8 border-2 border-yellow group-hover:scale-102 transition-all duration-300">
        <div className="text-center sm:text-left font-bebas text-red text-4xl md:text-4xl md:pl-4">{title}</div>
        <div className="hidden sm:block font-plex text-black sm:text-lg">{desc}</div>
      </div>
    </div>
  );
};

export default Steps;
