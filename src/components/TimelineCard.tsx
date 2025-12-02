interface TimelineCardProps {
  event: string;
  time: string;
}

export const TimelineCardKanan = ({ event, time }: TimelineCardProps) => {
  return (
    <div className="rounded-lg hover:scale-102 transition-transform duration-300 ease-in-out relative flex bg-[#F5B700]/20 text-red w-[13rem] h-[5rem] sm:w-[16rem] sm:h-[6rem] md:w-[18rem] md:h-[7rem] lg:w-[20rem] lg:h-[7rem] xl:w-[22rem] xl:h-[8rem] shadow-2xl justify-center items-center border-red border font-bebas">
      {/* Content */}
      <div className="text-center lowercase">
        <p className="text-red text-xl md:text-2xl xl:text-3xl">{event}</p>
        <p className="text-black md:text-lg">{time}</p>
      </div>
    </div>
  );
};

export const TimelineCardKiri = ({ event, time }: TimelineCardProps) => {
  return (
    <div className="rounded-lg hover:scale-102 transition-transform duration-300 ease-in-out relative flex bg-[#F5B700]/20 text-red sm:w-[16rem] sm:h-[6rem] md:w-[18rem] md:h-[7rem] lg:w-[20rem] lg:h-[7rem] xl:w-[22rem] xl:h-[8rem] justify-center shadow-2xl items-center border-red border font-bebas rotate-y-180">
      {/* Content */}
      <div className="text-center rotate-y-180">
        <p className="text-red text-xl md:text-2xl xl:text-3xl">{event}</p>
        <p className="text-black md:text-lg">{time}</p>
      </div>
    </div>
  );
};
