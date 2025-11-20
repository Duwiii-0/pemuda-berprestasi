import Hero from '../../components/hero'
import About from '../../components/about'
import OngoingComp from '../../components/ongoingComp'

const Home = () => {
  return (
    <main className="min-h-screen w-full bg-white">
      <Hero />
      <About />
      <OngoingComp />
    </main>
  );
};

export default Home;