import { useState } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import { Outlet } from "react-router";
import LoadingStore from "../../Store/LoadingStore";
import LoadingComponent from "../Loading";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const loading = LoadingStore((state) => state.loading);

  console.log("loading", loading);

  return (
    <div className="flex h-screen bg-neutral-bg-white-smk font-sans overflow-hidden">
        {loading && <LoadingComponent />}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar setIsOpen={setIsSidebarOpen} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
           <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
