import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { logout } from "../store/authSlice";

const navItems = [
  {
    to: "/feed",
    label: "Home",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: "/search",
    label: "Search",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    to: "/lost-found",
    label: "Lost & Found",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
    accent: "text-amber-500",
  },
  {
    to: "/messages",
    label: "Messages",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const Sidebar = () => {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();
  const user       = useAppSelector((s) => s.auth.user);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex h-screen  flex-col w-60 shrink-0 sticky top-16 h-[calc(100vh-4rem)] border-r border-purple-100 bg-white px-3 py-6 gap-1">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 mb-6">
          <span className="text-2xl">🐾</span>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
            Seezoo
          </span>
        </div>

        {/* Nav links */}
        {navItems.map(({ to, label, icon, accent }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive
                ? "bg-purple-50 text-purple-700 font-semibold"
                : `text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${accent ?? ""}`
              }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile + logout */}
        {user && (
          <div className="border-t border-purple-100 pt-4 space-y-1">
            <NavLink to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`
              }
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.profileImage
                  ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                  : user.name?.charAt(0).toUpperCase()
                }
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-800 text-xs">{user.name}</p>
                <p className="truncate text-gray-400 text-xs">@{user.username}</p>
              </div>
            </NavLink>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* ── Mobile bottom bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-purple-100 flex items-center justify-around px-2 py-2 shadow-lg">
        {navItems.map(({ to, label, icon, accent }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs font-medium transition-all
              ${isActive ? "text-purple-600" : `text-gray-400 ${accent ?? ""}`}`
            }
          >
            {icon}
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
        <NavLink to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs font-medium transition-all
            ${isActive ? "text-purple-600" : "text-gray-400"}`
          }
        >
          <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold">
            {user?.profileImage
              ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              : user?.name?.charAt(0).toUpperCase()
            }
          </div>
          <span className="text-[10px]">Profile</span>
        </NavLink>
      </nav>
    </>
  );
};

export default Sidebar;
