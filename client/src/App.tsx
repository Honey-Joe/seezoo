import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store";
import { fetchMe, logout } from "./store/authSlice";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";

import Login           from "./pages/Login";
import Register        from "./pages/Register";
import Landing         from "./pages/Landing";
import Feed            from "./pages/Feed";
import Profile         from "./pages/Profile";
import UpdateProfile   from "./pages/UpdateProfile";
import NewPost         from "./pages/NewPost";
import LostFound       from "./pages/LostFound";
import NewLostFound    from "./pages/NewLostFound";
import LostFoundSeeAll from "./pages/LostFoundSeeAll";
import SetupUsername   from "./pages/SetupUsername";
import VerifyEmail     from "./pages/VerifyEmail";
import ResetPassword   from "./pages/ResetPassword";
import ChangePassword  from "./pages/ChangePassword";
import Search          from "./pages/Search";
import UserProfile     from "./pages/UserProfile";
import Messages        from "./pages/Messages";

const SIDEBAR_ROUTES = ["/feed", "/search", "/lost-found", "/messages", "/profile", "/settings", "/new-post", "/new-lost-found", "/lost-found-seeall", "/u/"];

const Navbar = () => {
  const dispatch     = useAppDispatch();
  const user         = useAppSelector((s) => s.auth.user);
  const { pathname } = useLocation();

  if (SIDEBAR_ROUTES.some((r) => pathname.startsWith(r))) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-purple-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={user ? "/feed" : "/"} className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
            Seezoo
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile"
                className="hidden sm:flex items-center gap-2 bg-purple-50 hover:bg-purple-100 rounded-full px-3 py-1.5 transition-colors">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user.profileImage
                    ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                    : user.name?.charAt(0).toUpperCase()
                  }
                </div>
                <span className="text-sm text-purple-700 font-medium">@{user.username}</span>
              </Link>
              <button onClick={() => dispatch(logout())}
                className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors px-3 py-1.5">
                Login
              </Link>
              <Link to="/register"
                className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-violet-500 text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm">
                Join Free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const SidebarLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen">
    <Sidebar />
    <div className="flex-1 min-w-0 bg-gradient-to-b from-purple-50 to-white">
      {children}
    </div>
  </div>
);

const App = () => {
  const dispatch = useAppDispatch();

  useEffect(() => { dispatch(fetchMe()); }, [dispatch]);

  return (
    <BrowserRouter>
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/"               element={<Landing />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/setup-username" element={<SetupUsername />} />
          <Route path="/verify-email"   element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Sidebar pages — protected */}
          <Route path="/feed" element={<ProtectedRoute><SidebarLayout><Feed /></SidebarLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><SidebarLayout><Profile /></SidebarLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SidebarLayout><UpdateProfile /></SidebarLayout></ProtectedRoute>} />
          <Route path="/new-post" element={<ProtectedRoute><SidebarLayout><NewPost /></SidebarLayout></ProtectedRoute>} />
          <Route path="/new-lost-found" element={<ProtectedRoute><SidebarLayout><NewLostFound /></SidebarLayout></ProtectedRoute>} />
          <Route path="/lost-found" element={<ProtectedRoute><SidebarLayout><LostFound /></SidebarLayout></ProtectedRoute>} />
          <Route path="/lost-found-seeall" element={<ProtectedRoute><SidebarLayout><LostFoundSeeAll /></SidebarLayout></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SidebarLayout><Search /></SidebarLayout></ProtectedRoute>} />
          <Route path="/u/:username" element={<ProtectedRoute><SidebarLayout><UserProfile /></SidebarLayout></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><SidebarLayout><Messages /></SidebarLayout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
};

export default App;
