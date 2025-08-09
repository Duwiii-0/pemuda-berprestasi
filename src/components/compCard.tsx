import GeneralButton from "./generalButton";

const CompCard = () => { 

    return (
        <div className="h-64 w-[65vw] bg-white border-2 border-yellow shadow-2xl px-20 flex items-center gap-12 rounded-lg">
            <img src="src/assets/logo/sriwijaya.png" alt="tes tes" className="flex w-56 h-56 shrink-0"/>
            <div className="flex flex-col h-56 justify-between py-2">
                <div className="flex flex-col pr-60 gap-2">
                    <div className="font-bebas text-h2 text-red leading-none">Sriwijawa international taekwondo championship 2025</div>
                    <div className="font-inter text-isi text-black">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
                    </div>
                </div>
                <div className="w-full flex justify-end ">
                    <GeneralButton className="bg-red text-white rounded-lg">
                        Join the Competition
                    </GeneralButton>
                </div>
            </div> 
        </div>
    )
}

export default CompCard;