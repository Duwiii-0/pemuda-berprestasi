import Hero from '../../components/hero'
import About from '../../components/about'
import OngoingComp from '../../components/ongoingComp'

const Home = () => {
  return (
    <main className="min-h-screen w-full bg-white">
      <Hero />
      <About />
      <OngoingComp />
      
      {/* Optional: Add spacing for navbar if needed */}
      <div className="h-20"></div>
    </main>
  );
};

export default Home;