import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import './style/index.css';


// Layouts
import LandingLayout from "./layouts/landingLayout";
import PesertaLayout from "./layouts/pesertaLayout";

// Landing Pages
import Login from "./pages/landingPage/login";
import Register from "./pages/landingPage/register";
import RegisterDojang from "./pages/landingPage/registerDojang";
import RegisterPeserta from "./pages/landingPage/registerPeserta";
import Home from "./pages/landingPage/home";
import Event from "./pages/landingPage/event";
import NotFound from "./pages/landingPage/notFound";

// Dashboard Peserta
import ChangePassword from "./pages/peserta/changePassword";
import Dojang from "./pages/peserta/dojang";
import Profile from "./pages/peserta/profilePage";
import MatchHistory from "./pages/peserta/matchHistory";

export default function AppRoutes() {
  return (
    <>
      <Toaster />
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registerdojang" element={<RegisterDojang />} />
        <Route path="/registerpeserta" element={<RegisterPeserta />} />

        {/* Landing pages */}
        <Route element={<LandingLayout />}>
          <Route index element={<Home />} />
          <Route path="event" element={<Event />} />
        </Route>

        {/* Dashboard Peserta */}
        <Route path="dashboard/peserta" element={<PesertaLayout />}>
          <Route path="dojang" element={<Dojang />} />
          <Route path="profile" element={<Profile />} />
          <Route path="changepassword" element={<ChangePassword />} />
          <Route path="riwayatpertandingan" element={<MatchHistory />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
