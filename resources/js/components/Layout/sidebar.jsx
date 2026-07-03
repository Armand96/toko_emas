import { useState, useMemo, useEffect } from "react";
import { NavLink } from "react-router";
import {
  SquaresFourIcon,
  CheckSquareOffsetIcon,
  CubeIcon,
  ShoppingCartIcon,
  MoneyIcon,
  ChartBarIcon,
  UsersIcon,
  StorefrontIcon,
  GearIcon,
  CaretDownIcon,
  CaretUpIcon,
  XIcon
} from "@phosphor-icons/react";
import PermissionStore from "../../Store/PermissionStore";
import StoreSettingStore from "../../Store/StoreSettingStore";

const sidebarData = [
  {
    group: "Menu",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: SquaresFourIcon,
        link: "/dashboard"
      },
      {
        id: "approval",
        label: "Approval",
        icon: CheckSquareOffsetIcon,
        subItems: [
          { label: "Penjualan", link: "/approval/penjualan" },
          { label: "Pembelian", link: "/approval/pembelian" },
          { label: "Remove Item", link: "/approval/remove-item" },
          { label: "Transfer", link: "/approval/transfer" }
        ]
      },
      {
        id: "inventory",
        label: "Inventory",
        icon: CubeIcon,
        subItems: [
          { label: "Master Kategori", link: "/inventory/master-kategori" },
          { label: "Master Produk", link: "/inventory/master-produk" },
          { label: "Item Inventory", link: "/inventory/inventory" },
          { label: "Remove", link: "/inventory/remove" },
          { label: "In Repair", link: "/inventory/in-repair" },
          { label: "Transfer", link: "/inventory/transfer" },
          { label: "Stock Opname", link: "/inventory/stock-opname" }
        ]
      },
      {
        id: "transaksi",
        label: "Transaksi",
        icon: SquaresFourIcon,
        subItems: [
          {
            id: "penjualan",
            label: "Penjualan",
            link: "/transaksi/penjualan"
          },
          { label: "Pembelian", link: "/transaksi/pembelian" },

        ]
      },
      {
        id: "finance",
        label: "Finance",
        icon: MoneyIcon,
        link: "/finance"
      },
      {
        id: "report",
        label: "Report",
        icon: ChartBarIcon,
        subItems: [
          { label: "Inventory", link: "/report/inventory" },
          { label: "Penjualan", link: "/report/penjualan" },
          { label: "Pembelian", link: "/report/pembelian" },
          { label: "Finance", link: "/report/finance" },
          { label: "Customer", link: "/report/customer" }
        ]
      }
    ]
  },
  {
    group: "Administrator",
    items: [
      { id: "user", label: "User", icon: UsersIcon, link: "/administrator/users" },
      { id: "cabang", label: "Cabang", icon: StorefrontIcon, link: "/administrator/cabang" },
      { id: "setting", label: "Setting", icon: GearIcon, link: "/administrator/setting" },
      { id: "MasterBank", label: "Master Bank", icon: GearIcon, link: "/administrator/master-bank" },
      { id: "MasterSupplier", label: "Master Supplier", icon: GearIcon, link: "/administrator/supplier" },
      { id: "MasterCustomer", label: "Master Customer", icon: GearIcon, link: "/administrator/customer" },
      { id: "MasterCategoryFinance", label: "Master Kategori Finance", icon: GearIcon, link: "/administrator/master-category-finance" }
    ]
  }
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [openMenus, setOpenMenus] = useState({});
  const permissions = PermissionStore((state) => state.permissions);
  const canSeeMenu = PermissionStore((state) => state.canSeeMenu);
  const canSeeSubMenu = PermissionStore((state) => state.canSeeSubMenu);
  const storeSetting = StoreSettingStore((state) => state.storeSetting);
  const fetched = StoreSettingStore((state) => state.fetched);
  const fetchStoreSetting = StoreSettingStore((state) => state.fetchStoreSetting);

  useEffect(() => {
    if (!fetched) fetchStoreSetting();
  }, [fetched, fetchStoreSetting]);

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Tutup sidebar saat navigasi di mobile (viewport < lg / 1024px).
  const handleNavigate = () => {
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  const filteredSidebar = useMemo(() => sidebarData
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => canSeeMenu(item))
        .map((item) => {
          if (!item.subItems) return item;
          const filteredSubs = item.subItems.filter((sub) => canSeeSubMenu(sub.link));
          if (filteredSubs.length === 0) return null;
          return { ...item, subItems: filteredSubs };
        })
        .filter(Boolean),
    }))
    .filter((section) => section.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissions]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-neutral-black/50 transition-opacity lg:hidden ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-primary-950 text-gray-400 transition-all duration-300 ease-in-out overflow-hidden lg:static lg:shrink-0 ${isOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full w-64 lg:translate-x-0 lg:w-0"
          }`}
      >
        <div className="w-64 h-full flex flex-col">
          <div className="flex items-center justify-between h-16 px-4 bg-primary-950 border-b border-primary-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-white rounded flex items-center justify-center overflow-hidden">
                {storeSetting?.image_path ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}storage/${storeSetting.image_path}`}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-4 h-4 bg-primary-500 rounded-sm"></div>
                )}
              </div>
              <span className="font-semibold text-neutral-white text-sm">
                {storeSetting?.shop_name || "Nama Sistem"}
              </span>
            </div>
            <button
              className="lg:hidden text-gray-400 hover:text-neutral-white cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <XIcon size={20} weight="bold" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
            {filteredSidebar.map((section, sectionIdx) => (
              <div key={section.group}>
                <div
                  className={`px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider ${sectionIdx > 0 ? "mt-6" : ""
                    }`}
                >
                  {section.group}
                </div>
                <nav className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const hasSub = item.subItems !== undefined && item.subItems.length > 0;
                    const isMenuOpen = openMenus[item.id];

                    if (hasSub) {
                      return (
                        <div key={item.id}>
                          <button
                            onClick={() => toggleMenu(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer ${isMenuOpen
                                ? "bg-primary-900 text-neutral-white"
                                : "hover:bg-primary-900 hover:text-neutral-white"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={20} />
                              <span className="text-sm">{item.label}</span>
                            </div>
                            {isMenuOpen ? <CaretUpIcon size={16} /> : <CaretDownIcon size={16} />}
                          </button>
                          {isMenuOpen && (
                            <div className="bg-primary-900/50 py-1">
                              {item.subItems.map((sub, subIdx) => (
                                <NavLink
                                  key={subIdx}
                                  to={sub.link}
                                  onClick={handleNavigate}
                                  className={({ isActive }) =>
                                    `block px-11 py-2 text-sm transition-colors cursor-pointer ${isActive
                                      ? "text-neutral-white font-medium"
                                      : "hover:text-neutral-white text-gray-400"
                                    }`
                                  }
                                >
                                  • {sub.label}
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <NavLink
                        key={item.id}
                        to={item.link}
                        onClick={handleNavigate}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${isActive
                            ? "bg-primary-900 text-neutral-white"
                            : "hover:bg-primary-900 hover:text-neutral-white text-gray-400"
                          }`
                        }
                      >
                        <Icon size={20} />
                        <span className="text-sm">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
