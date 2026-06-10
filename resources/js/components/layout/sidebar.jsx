import { useState } from "react";
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

const sidebarData = [
  {
    group: "Menu",
    items: [
          {
        id: "UI List",
        label: "UI List",
        icon: SquaresFourIcon,
        subItems: [
          { label: "input", link: "/input" },
          { label: "table", link: "/table" },
        { label: "Alert Modal", link: "/alert-modal" },
        ]
      },
      {
        id: "dashboard",
        label: "Dashboard",
        icon: SquaresFourIcon,
        link: "/"
      },
      {
        id: "approval",
        label: "Approval",
        icon: CheckSquareOffsetIcon,
        subItems: [
          { label: "penjualan", link: "/approval/penjualan" },
                    { label: "Pembelian", link: "/approval/pembelian" },
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
          { label: "Pembelian", link: "/inventory/pembelian" },
          { label: "Item Inventory", link: "/inventory/inventory" },
          { label: "Pengeluaran Item", link: "/inventory/pengeluaran-item" },
          { label: "Transfer", link: "/inventory/transfer" },
          { label: "Stock Opname", link: "/inventory/stock-opname" }
        ]
      },
      {
        id: "penjualan",
        label: "Penjualan",
        icon: ShoppingCartIcon,
        link: "/penjualan"
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
        link: "/report"
      }
    ]
  },
  {
    group: "Administrator",
    items: [
      { id: "user", label: "User", icon: UsersIcon, link: "/administrator/users" },
      { id: "cabang", label: "Cabang", icon: StorefrontIcon, link: "/administrator/cabang" },
      { id: "setting", label: "Setting", icon: GearIcon, link: "/administrator/setting" },
            { id: "MasterBank", label: "Master Bank", icon: GearIcon, link: "/administrator/master-bank" }
    ]
  }
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [openMenus, setOpenMenus] = useState({

  });

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-neutral-black/50 transition-opacity lg:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-primary-950 text-gray-400 transition-all duration-300 ease-in-out overflow-hidden lg:static lg:shrink-0 ${
          isOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full w-64 lg:translate-x-0 lg:w-0"
        }`}
      >
        <div className="w-64 h-full flex flex-col">
          <div className="flex items-center justify-between h-16 px-4 bg-primary-950 border-b border-primary-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-white rounded flex items-center justify-center">
                <div className="w-4 h-4 bg-primary-500 rounded-sm"></div>
              </div>
              <span className="font-semibold text-neutral-white text-sm">Nama Sistem</span>
            </div>
            <button
              className="lg:hidden text-gray-400 hover:text-neutral-white cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <XIcon size={20} weight="bold" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
            {sidebarData.map((section, sectionIdx) => (
              <div key={section.group}>
                <div
                  className={`px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                    sectionIdx > 0 ? "mt-6" : ""
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
                            className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer ${
                              isMenuOpen
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
                                  className={({ isActive }) =>
                                    `block px-11 py-2 text-sm transition-colors cursor-pointer ${
                                      isActive
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
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${
                            isActive
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
