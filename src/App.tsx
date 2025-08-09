// src/App.tsx
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Footer from './components/footer';
import Navbar from './components/navbar';

// Pages
import Login from './pages/login';
import Register from './pages/register';
import Home from './pages/home'
import Event from './pages/event';
import NotFound from './pages/notFound';

const MainLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
      <main className="">
        <Outlet />
      </main>
    <Footer />
  </div>
);


export default function App() {
  const location = useLocation();

  return (
    <>
      <Toaster />
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/event" element={<Event />} />
          </Route>  

          <Route path="*" element={<NotFound />} />
        </Routes>
    </>
  );
}
