import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import './style/index.css';


// Layouts
import LandingLayout from "./layouts/layout";
import PesertaLayout from "./layouts/pesertaLayout";
import LombaLayout from "./layouts/lombaLayout";

// Auth page
import Login from "./pages/auth/login";
import RegisterDojang from "./pages/auth/registerDojang";
import Register from "./pages/auth/register";
import ResetPassword from "./pages/auth/changepassword";

//Landing Page
import Home from "./pages/landingPage/home";
import Event from "./pages/landingPage/event";
import NotFound from "./pages/notFound";

// Dashboard
import DataAtlit from "./pages/dashboard/dataAtlit";
import Dojang from "./pages/dashboard/dataDojang";
import MatchHistory from "./pages/dashboard/dataKompetisi";

// data atlit
import Profile from "./pages/atlit/profilePage";

// lomba
import LandingPage from "./lombaLayout/home";
import Timeline from "./lombaLayout/timeline";
import FAQ from "./lombaLayout/faq";

// settings
import Settings from "./pages/settings/settings";
import TambahAtlit from "./pages/dashboard/TambahAtlit";


export default function AppRoutes() {
  return (
    <>
      <Toaster />
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registerdojang" element={<RegisterDojang />} />
        <Route path='/resetpassword' element={<ResetPassword />} />

        {/* Landing pages */}
        <Route element={<LandingLayout />}>
          <Route index element={<Home />} />
          <Route path="event" element={<Event />} />
        </Route>

        {/* settings*/ }
        <Route path="/settings" element={<Settings />} />

        {/* Dashboard */}
        <Route path="dashboard" element={<PesertaLayout />}>
          <Route index element={<DataAtlit />} />   {/* default */}
          <Route path="dojang" element={<Dojang />} />
          <Route path="atlit" element={<DataAtlit />} />
          <Route path="atlit/:id" element={<Profile />} />
          <Route path="atlit/add" element={<TambahAtlit />} />
          <Route path="dataKompetisi" element={<MatchHistory />} />
        </Route>


        <Route path="lomba" element={<LombaLayout/>}>
          <Route path="home" element={<LandingPage />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="timeline" element={<Timeline />} />
        </Route>


        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
