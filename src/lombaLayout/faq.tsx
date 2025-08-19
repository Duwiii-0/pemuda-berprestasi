import FaqCard from "../components/faqCard";

const FAQ = () => {

    return(
        <div className="flex flex-col min-h-screen">
            <div className="h-full w-full  pt-40 flex gap-20 flex-col justify-start items-center" >
                <h1 className="text-5xl md:text-7xl lg:text-judul max-w-4xl text-center text-red font-bebas leading-[80%] uppercase ">
                  Frequently ask questions
                </h1>
                <div className="h-full w-full flex flex-col md:flex-row md:py-20">
                  <div className="w-full flex flex-col h-full px-4 md:px-12 lg:px-20 gap-4 md:gap-0">
                    <div className="text-center md:text-left font-bebas leading-none text-black text-4xl md:text-7xl">
                      General FAQ'S
                    </div>
                    <div className="text-center md:text-left font-inter leading-none text-black text-md md:text-md lg:text-xl pb-6 md:pb-0">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    </div>
                  </div>
                  <div className="px-4 md:px-0 w-full md:mr-12 lg:mr-20">
                    <div className="w-full flex flex-col h-full border-t-2 border-yellow">
                      <FaqCard
                        question="Apakah gratis?"
                        answer="Ya, semua layanan kami dapat digunakan tanpa biaya apapun."
                      />
                      <FaqCard
                        question="Bagaimana cara mendaftar?"
                        answer="Anda cukup mengisi formulir pendaftaran di website kami."
                      />
                    </div>
                  </div>
                </div>
            </div>
            <div>
                <div className="h-full w-full flex flex-col md:flex-row md:py-20">
                  <div className="w-full flex flex-col h-full px-4 md:px-12 lg:px-20 gap-4 md:gap-0">
                    <div className="text-center md:text-left font-bebas leading-none text-black text-4xl md:text-7xl">
                      General FAQ'S
                    </div>
                    <div className="text-center md:text-left font-inter leading-none text-black text-md md:text-md lg:text-xl pb-6 md:pb-0">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    </div>
                  </div>
                  <div className="px-4 md:px-0 w-full md:mr-12 lg:mr-20">
                    <div className="w-full flex flex-col h-full border-t-2 border-yellow">
                      <FaqCard
                        question="Apakah gratis?"
                        answer="Ya, semua layanan kami dapat digunakan tanpa biaya apapun."
                      />
                      <FaqCard
                        question="Bagaimana cara mendaftar?"
                        answer="Anda cukup mengisi formulir pendaftaran di website kami."
                      />
                    </div>
                  </div>
                </div>


            </div>
            <div>
                <div className="h-full w-full flex flex-col md:flex-row md:py-20">
                  <div className="w-full flex flex-col h-full px-4 md:px-12 lg:px-20 gap-4 md:gap-0">
                    <div className="text-center md:text-left font-bebas leading-none text-black text-4xl md:text-7xl">
                      General FAQ'S
                    </div>
                    <div className="text-center md:text-left font-inter leading-none text-black text-md md:text-md lg:text-xl pb-6 md:pb-0">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    </div>
                  </div>
                  <div className="px-4 md:px-0 w-full md:mr-12 lg:mr-20">
                    <div className="w-full flex flex-col h-full border-t-2 border-yellow">
                      <FaqCard
                        question="Apakah gratis?"
                        answer="Ya, semua layanan kami dapat digunakan tanpa biaya apapun."
                      />
                      <FaqCard
                        question="Bagaimana cara mendaftar?"
                        answer="Anda cukup mengisi formulir pendaftaran di website kami."
                      />
                    </div>
                  </div>
                </div>

            </div>
        </div>
    )    
}

export default FAQ;