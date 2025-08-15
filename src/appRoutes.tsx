import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import './style/index.css';


// Layouts
import LandingLayout from "./layouts/landingLayout";
import PesertaLayout from "./layouts/pesertaLayout";

// Landing Pages
import Login from "./pages/auth/login";
import RegisterDojang from "./pages/auth/registerDojang";
import Register from "./pages/auth/register";
import Home from "./pages/landingPage/home";
import Event from "./pages/landingPage/event";
import NotFound from "./pages/notFound";

// Dashboard
import ChangePassword from "./pages/dashboard/changePassword";
import Atlit from "./pages/dashboard/dataAtlit";
import Dojang from "./pages/dashboard/dataDojang";
import MatchHistory from "./pages/dashboard/matchHistory";

// data atlit
import Profile from "./pages/atlit/profilePage";


export default function AppRoutes() {
  return (
    <>
      <Toaster />
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registerdojang" element={<RegisterDojang />} />

        {/* Landing pages */}
        <Route element={<LandingLayout />}>
          <Route index element={<Home />} />
          <Route path="event" element={<Event />} />
        </Route>

        {/* Dashboard Peserta */}
        <Route path="dashboard" element={<PesertaLayout />}>
          <Route path="dojang" element={<Dojang />} />
          <Route path="atlit" element={<Atlit />} />
          <Route path="profilepeserta" element={<Profile />} />
          <Route path="changepassword" element={<ChangePassword />} />
          <Route path="riwayatpertandingan" element={<MatchHistory />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
