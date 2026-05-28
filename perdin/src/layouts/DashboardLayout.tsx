import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Building2,
  Users,
  FileText,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getMenuItems = () => {
    if (!user) return [];

    const items = [];

    // Master Kota (Admin & SDM)
    if (user?.roles?.includes("ADMIN") || user?.roles?.includes("DIVISI_SDM")) {
      items.push({
        name: "Master Kota",
        path: "/admin/cities",
        icon: <Building2 className="w-5 h-5" />,
      });
    }

    // Admin-only Menus
    if (user?.roles?.includes("ADMIN")) {
      items.push({
        name: "Master User",
        path: "/admin/users",
        icon: <Users className="w-5 h-5" />,
      });
    }

    // Pegawai Menus
    if (user?.roles?.includes("PEGAWAI")) {
      items.push({
        name: "Pengajuan Perdin",
        path: "/pegawai/perdin",
        icon: <FileText className="w-5 h-5" />,
      });
    }

    // SDM Menus
    if (user?.roles?.includes("DIVISI_SDM")) {
      items.push({
        name: "Approval Perdin",
        path: "/sdm/perdin",
        icon: <ClipboardCheck className="w-5 h-5" />,
      });
    }

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-600">Perdin App</span>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span
                  className={`mr-3 ${isActive ? "text-blue-600" : "text-gray-400"}`}
                >
                  {item.icon}
                </span>
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center ml-auto space-x-4">
            <div className="flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
              <UserIcon className="w-5 h-5 text-gray-500 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 leading-tight">
                  {user?.username}
                </span>
                <span className="text-xs text-gray-500 leading-tight">
                  {user?.roles?.join(", ") || ""}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
