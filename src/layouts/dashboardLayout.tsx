import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/authContext";
import toast from "react-hot-toast";

export default function DashboardLayout() {
  const { user } = useAuth();

  if (!user) {
    toast.error("Anda harus login terlebih dahulu ")  
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen">
      <main>
        <Outlet />
      </main>
    </div>
    
  );
}
