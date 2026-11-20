import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Building2, ClipboardCheck, FileText, LogOut, Users } from "lucide-react";
import { Brand } from "../components/Brand";
import { useAuth } from "../contexts/useAuth";
import type { Role } from "../types";

const pages = [
  { name: "Master Kota", path: "/admin/cities", icon: Building2, roles: ["ADMIN", "DIVISI_SDM"] },
  { name: "Master Pengguna", path: "/admin/users", icon: Users, roles: ["ADMIN"] },
  { name: "Pengajuan Saya", path: "/pegawai/perdin", icon: FileText, roles: ["PEGAWAI"] },
  { name: "Persetujuan", path: "/sdm/perdin", icon: ClipboardCheck, roles: ["DIVISI_SDM"] },
];

const roleLabel: Record<Role, string> = {
  ADMIN: "Administrator", DIVISI_SDM: "Divisi SDM", PEGAWAI: "Pegawai",
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [logoutError, setLogoutError] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const menu = pages.filter(page => user?.roles.some(role => page.roles.includes(role)));
  const section = menu.find(page => page.path === pathname);
  async function signOut() {
    setLogoutError(false);
    setLeaving(true);
    try { await logout(); }
    catch { setLogoutError(true); }
    finally { setLeaving(false); }
  }

  return (
    <div className="df-shell">
      <a href="#df-content" className="df-skip">Lewati ke konten</a>
      <aside className="df-sidebar">
        <div className="df-sidebar-brand"><Brand /></div>
        <nav aria-label="Navigasi utama" className="df-navigation">
          {menu.map(({ name, path, icon: Icon }) => (
            <NavLink key={path} to={path} end>
              <Icon size={19} aria-hidden="true" />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="df-workspace">
        <header className="df-topbar">
          <div className="df-mobile-brand"><Brand /></div>
          <div className="df-breadcrumb">Ruang kerja <span aria-hidden="true">/</span> <strong>{section?.name}</strong></div>
          <div className="df-account">
            <span className="df-avatar" aria-hidden="true">{user?.username.slice(0, 2).toUpperCase()}</span>
            <div className="df-account-name"><strong>{user?.username}</strong><small>{user?.roles.map(role => roleLabel[role]).join(", ")}</small></div>
            <button type="button" disabled={leaving} onClick={() => void signOut()} aria-label="Keluar" title="Keluar"><LogOut size={18} aria-hidden="true" /></button>
          </div>
        </header>
        <main id="df-content" tabIndex={-1} className="df-content">
          {logoutError && <p role="alert" className="df-error">Gagal keluar. Silakan coba lagi.</p>}
          <div className="df-page-enter" key={pathname}><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
