import { useState } from "react";
import { ListIcon, CaretDownIcon, MagnifyingGlassIcon, SignOutIcon } from "@phosphor-icons/react";

const Navbar = ({ setIsOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="h-16 bg-neutral-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 z-30 shrink-0">
      <button
        className="p-2 -ml-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <ListIcon size={24} />
      </button>

      <div className="relative">
        <button
          className="flex items-center gap-3 p-1 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <div className="w-8 h-8 rounded-full bg-info-50 text-info-600 flex items-center justify-center font-bold text-xs border border-info-200">
            AJ
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-neutral-black leading-none">
              Alexander Johnatha...
            </p>
            <p className="text-xs text-gray-500 mt-1">Owner</p>
          </div>
          <CaretDownIcon size={16} className="text-gray-500 hidden md:block" />
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-neutral-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-info-50 text-info-600 flex items-center justify-center font-bold text-sm shrink-0 border border-info-200">
                AJ
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-neutral-black truncate">
                  Alexander Johnathan Faturah...
                </p>
                <p className="text-xs text-gray-500">Penaksir</p>
              </div>
            </div>
            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer">
              <MagnifyingGlassIcon size={18} />
              Ubah Password
            </button>
            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer">
              <SignOutIcon size={18} />
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
