import { useState } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import { Outlet } from "react-router";
import LoadingStore from "../../Store/LoadingStore";
import LoadingComponent from "../Loading";

const Layout = () => {
  // Mulai tertutup di mobile (< lg / 1024px), terbuka di desktop.
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 1024
  );
  const loading = LoadingStore((state) => state.loading);

  return (
    <div className="flex h-screen bg-neutral-bg-white-smk font-sans overflow-hidden">
        {loading && <LoadingComponent />}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar setIsOpen={setIsSidebarOpen} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:px-4 lg:py-4">
           <div className="w-full min-w-0 max-w-full">
             <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
