import Hero from '../components/hero'
import About from '../components/about'
import OngoingComp from '../components/ongoingComp'

const Home = () => {

     return (
        <div className="min-h-screen w-full">
            <Hero/>
            <About/>
            <OngoingComp/>
        </div>
    )
}

export default Home;