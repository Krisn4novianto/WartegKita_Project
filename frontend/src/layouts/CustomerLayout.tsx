import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function CustomerLayout() {
  return (
    <>
      <Navbar />
      <main className="page-container">
        <Outlet />
      </main>
    </>
  );
}
