import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store";
import { setUser } from "../store/authSlice";
import { searchUsers, followUser, unfollowUser } from "../services/userService";
import type { IPublicUser } from "../types";

const Search = () => {
  const me       = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();

  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<IPublicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsers(query.trim());
        setResults(res.data);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleFollow = async (user: IPublicUser) => {
    if (!me || followLoading) return;
    setFollowLoading(user._id);
    const isFollowing = me.following.includes(user._id);
    try {
      if (isFollowing) {
        await unfollowUser(user._id);
        dispatch(setUser({ ...me, following: me.following.filter((id) => id !== user._id) }));
        setResults((prev) => prev.map((u) =>
          u._id === user._id ? { ...u, followers: u.followers.filter((id) => id !== me._id) } : u
        ));
      } else {
        await followUser(user._id);
        dispatch(setUser({ ...me, following: [...me.following, user._id] }));
        setResults((prev) => prev.map((u) =>
          u._id === user._id ? { ...u, followers: [...u.followers, me._id] } : u
        ));
      }
    } finally { setFollowLoading(null); }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24 lg:pb-6">

      {/* Search bar */}
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name or username..."
          autoFocus
          className="w-full bg-white border border-purple-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
        />
        {loading && (
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        )}
      </div>

      {/* Empty state */}
      {!query && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-500 font-semibold mb-1">Find pet lovers</p>
          <p className="text-gray-400 text-sm">Search by name or @username</p>
        </div>
      )}

      {/* No results */}
      {query && !loading && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🐾</p>
          <p className="text-gray-500 text-sm">No users found for "<span className="font-semibold">{query}</span>"</p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {results.map((user) => {
          const isFollowing = me?.following.includes(user._id) ?? false;
          const isMe        = me?._id === user._id;

          return (
            <div key={user._id} className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 flex items-center gap-4">
              {/* Avatar */}
              <Link to={`/u/${user.username}`} className="shrink-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-lg font-bold">
                  {user.profileImage
                    ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                    : user.name.charAt(0).toUpperCase()
                  }
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/u/${user.username}`}>
                  <p className="font-bold text-gray-900 hover:underline truncate">{user.name}</p>
                </Link>
                <p className="text-xs text-gray-400">@{user.username}</p>
                {user.bio && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{user.bio}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{user.followers.length} followers</p>
              </div>

              {/* Follow button */}
              {!isMe && me && (
                <button
                  onClick={() => handleFollow(user)}
                  disabled={followLoading === user._id}
                  className={`shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                    isFollowing
                      ? "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500 border border-gray-200"
                      : "bg-gradient-to-r from-purple-600 to-violet-500 text-white hover:opacity-90 shadow-sm"
                  }`}>
                  {followLoading === user._id ? "..." : isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Search;
