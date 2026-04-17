import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { adminLogout } from "../../redux/slices/authSlice";
import toast from "react-hot-toast";

const navItems = [
  { to: "/admin/dashboard",     label: "Dashboard",      icon: "📊" },
  { to: "/admin/users",         label: "Users",          icon: "👥" },
  { to: "/admin/posts",         label: "Posts",          icon: "📸" },
  { to: "/admin/reports",       label: "Reports",        icon: "🚨" },
  { to: "/admin/categories",    label: "Categories",     icon: "🏷️" },
  { to: "/admin/notifications", label: "Notifications",  icon: "🔔" },
];

const AdminLayout = () => {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const admin     = useAppSelector((s) => s.auth.admin);

  const handleLogout = async () => {
    await dispatch(adminLogout());
    toast.success("Logged out");
    navigate("/admin/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <div>
              <p className="text-base font-bold text-gray-900">Seezoo</p>
              <p className="text-xs text-purple-600 font-medium">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-purple-50 text-purple-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }>
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Admin profile */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              {admin?.name?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{admin?.name ?? "Admin"}</p>
              <p className="text-[10px] text-gray-400 truncate">{admin?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <h1 className="text-lg font-bold text-gray-900">
            {navItems.find((n) => location.pathname.startsWith(n.to))?.label ?? "Admin"}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            {admin?.role === "superadmin" ? "Super Admin" : "Admin"}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
