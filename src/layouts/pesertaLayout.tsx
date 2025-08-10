import { Outlet } from "react-router-dom";

export default function PesertaLayout() {
  console.log('PesertaLayout dipakai')
  return (
    <div className="min-h-screen">
      <main>
        <Outlet />
      </main>
    </div>
    
  );
}
