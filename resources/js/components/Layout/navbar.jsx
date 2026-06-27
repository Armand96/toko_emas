import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ListIcon, CaretDownIcon, MagnifyingGlassIcon, SignOutIcon } from "@phosphor-icons/react";
import AuthService from "../../Services/Auth.apis";
import UsersStore from "../../Services/User.apis";
import AuthStore from "../../Store/AuthStore";
import OptionsStore from "../../Store/OptionsStore";
import StoreSettingStore from "../../Store/StoreSettingStore";
import { showAlert } from "../../utils/showAlert";

const Navbar = ({ setIsOpen }) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);

  const ensureBranches = OptionsStore((s) => s.ensureBranches);
  const storeSetting = StoreSettingStore((state) => state.storeSetting);

  const user = AuthStore((state) => state.user);
  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'U';

  const roleName = roles.find((r) => r.id === user?.role_id)?.role_name || '-';
  const branchName = branches.find((b) => b.id === user?.branch_id)?.branch_name || '-';

  useEffect(() => {
    UsersStore.GetRole('?per_page=10000000')
      .then((res) => setRoles(res?.data || []))
      .catch((err) => console.error(err));

    ensureBranches()
      .then((data) => setBranches(data || []))
      .catch((err) => console.error(err));
  }, []);


  const handleLogout = async () => {
    const { confirmed } = await showAlert({
      title: 'Keluar dari Sistem',
      message: 'Apakah Anda yakin ingin keluar?',
      icon: 'warning',
      confirmText: 'Keluar',
      cancelText: 'Batal',
    });
    if (!confirmed) return;

    await AuthService.logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-neutral-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="p-2 -ml-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none cursor-pointer"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <ListIcon size={24} />
        </button>
      </div>

      <div className="relative">
        <button
          className="flex items-center gap-3 p-1 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <div className="w-8 h-8 rounded-full bg-info-50 text-info-600 flex items-center justify-center font-bold text-xs border border-info-200">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-neutral-black leading-none">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{roleName} · {branchName}</p>
          </div>
          <CaretDownIcon size={16} className="text-gray-500 hidden md:block" />
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-neutral-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-info-50 text-info-600 flex items-center justify-center font-bold text-sm shrink-0 border border-info-200">
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-neutral-black truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{roleName} · {branchName}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-3 transition-colors cursor-pointer"
            >
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
