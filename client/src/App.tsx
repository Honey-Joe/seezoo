import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store";
import { fetchMe, logout } from "./store/authSlice";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import Profile from "./pages/Profile";
import UpdateProfile from "./pages/UpdateProfile";
import NewPost from "./pages/NewPost";
import LostFound from "./pages/LostFound";
import NewLostFound from "./pages/NewLostFound";
import LostFoundSeeAll from "./pages/LostFoundSeeAll";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-purple-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? "/profile" : "/"} className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
            Seezoo
          </span>
        </Link>

        {/* Nav actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Avatar chip */}
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 bg-purple-50 hover:bg-purple-100 rounded-full px-3 py-1.5 transition-colors"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user.profileImage
  ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
  : user.name?.charAt(0).toUpperCase()
}
                </div>
                <span className="text-sm text-purple-700 font-medium">@{user.username}</span>
              </Link>

              <Link
                to="/profile"
                className="sm:hidden text-sm font-medium text-purple-600 hover:text-purple-800 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Profile
              </Link>

              {/* Lost & Found link */}
              <Link
                to="/lost-found"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
              >
                🔍 Lost & Found
              </Link>

              <button
                onClick={() => dispatch(logout())}
                className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors px-3 py-1.5"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-violet-500 text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                Join Free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const App = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <UpdateProfile />
            </ProtectedRoute>
          } />
          <Route path="/new-post" element={
            <ProtectedRoute>
              <NewPost />
            </ProtectedRoute>
          } />
          <Route path="/lost-found" element={<LostFound />} />
          <Route path="/new-lost-found" element={
            <ProtectedRoute>
              <NewLostFound />
            </ProtectedRoute>
          } />
          <Route path="/lost-found-seeall" element={<LostFoundSeeAll />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
};

export default App;
