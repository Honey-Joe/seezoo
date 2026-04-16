import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store";
import { setUser } from "../store/authSlice";
import { getMyPosts } from "../services/postService";
import { acceptFollowRequest, declineFollowRequest } from "../services/userService";
import FollowListModal from "../components/FollowListModal";
import type { IFeedPost } from "../services/postService";
import type { IPet, IFollowRequester } from "../types";

const SPECIES_EMOJI: Record<IPet["species"], string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", fish: "🐠", reptile: "🦎", other: "🐾",
};

const Profile = () => {
  const user     = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [posts,        setPosts]        = useState<IFeedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeTab,    setActiveTab]    = useState<"posts" | "pets">("posts");
  const [modal,        setModal]        = useState<"followers" | "following" | null>(null);

  useEffect(() => {
    getMyPosts()
      .then((r) => setPosts(r.data))
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, []);

  if (!user) return null;

  const handleAccept = async (requesterId: string) => {
    await acceptFollowRequest(requesterId);
    dispatch(setUser({
      ...user,
      followers: [...user.followers, requesterId],
      followRequests: user.followRequests.filter((r) => r._id !== requesterId),
    }));
  };

  const handleDecline = async (requesterId: string) => {
    await declineFollowRequest(requesterId);
    dispatch(setUser({
      ...user,
      followRequests: user.followRequests.filter((r) => r._id !== requesterId),
    }));
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-16">

      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 h-44 relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Link to="/new-post"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-white/30">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Post
          </Link>
          <Link to="/settings"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-white/30">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">

        {/* Avatar + info */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 mb-6">
          <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-4xl font-bold shrink-0">
            {user.profileImage
              ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              : user.name.charAt(0).toUpperCase()
            }
          </div>
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              {user.isPrivate && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">🔒 Private</span>
              )}
            </div>
            <p className="text-purple-600 font-medium text-sm mb-1">@{user.username}</p>
            {user.bio && <p className="text-gray-600 text-sm max-w-md">{user.bio}</p>}
          </div>
          <div className="flex gap-6 pb-1 shrink-0">
            {[
              { label: "Posts",     value: posts.length,          onClick: undefined },
              { label: "Followers", value: user.followers.length, onClick: () => setModal("followers") },
              { label: "Following", value: user.following.length, onClick: () => setModal("following") },
            ].map(({ label, value, onClick }) => (
              <button key={label} onClick={onClick} disabled={!onClick}
                className={`text-center ${onClick ? "cursor-pointer hover:opacity-70" : "cursor-default"}`}>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-xs text-gray-400">
            🗓 Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
          <Link to="/change-password"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-colors">
            🔐 {user.authProvider === "google" ? "Set a Password" : "Change Password"}
          </Link>
        </div>

        {/* Follow requests — only shown when account is private and requests exist */}
        {user.isPrivate && user.followRequests.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-purple-100 shadow-sm p-4">
            <p className="text-sm font-bold text-gray-700 mb-3">Follow Requests ({user.followRequests.length})</p>
            <div className="flex flex-col gap-3">
              {(user.followRequests as IFollowRequester[]).map((requester) => (
                <div key={requester._id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                      {requester.profileImage
                        ? <img src={requester.profileImage} alt={requester.name} className="w-full h-full object-cover" />
                        : requester.name.charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{requester.name}</p>
                      <p className="text-xs text-purple-500 truncate">@{requester.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleAccept(requester._id)}
                      className="px-3 py-1 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      Accept
                    </button>
                    <button onClick={() => handleDecline(requester._id)}
                      className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(["posts", "pets"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}>
              {tab === "posts" ? `📸 Posts (${posts.length})` : `🐾 Pets (${user.pets.length})`}
            </button>
          ))}
        </div>

        {/* Posts tab */}
        {activeTab === "posts" && (
          postsLoading ? (
            <div className="grid grid-cols-3 gap-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-purple-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📸</p>
              <p className="text-gray-500 text-sm mb-4">No posts yet.</p>
              <Link to="/new-post"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 shadow-sm">
                + Create your first post
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div key={post._id} className="aspect-square overflow-hidden rounded-lg bg-gray-100 relative group cursor-pointer">
                  <img src={post.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {post.images.length > 1 && (
                    <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      +{post.images.length - 1}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                    <span>❤️ {(post.likes ?? []).length}</span>
                    <span>💬 {(post.comments ?? []).length}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Pets tab */}
        {activeTab === "pets" && (
          user.pets.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🐾</p>
              <p className="text-gray-500 text-sm mb-4">No pets added yet.</p>
              <Link to="/settings"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 shadow-sm">
                + Add your first pet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.pets.map((pet) => (
                <div key={pet._id} className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow p-4 flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                    {pet.profileImage
                      ? <img src={pet.profileImage} alt={pet.name} className="w-full h-full object-cover" />
                      : SPECIES_EMOJI[pet.species]
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-gray-900">{pet.name}</p>
                      <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full capitalize">
                        {SPECIES_EMOJI[pet.species]} {pet.species}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {pet.breed && <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">{pet.breed}</span>}
                      {pet.age !== undefined && <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">{pet.age} yr{pet.age !== 1 ? "s" : ""}</span>}
                    </div>
                    {pet.bio && <p className="text-xs text-gray-500 line-clamp-2">{pet.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>

    {modal && (
      <FollowListModal
        userId={user._id}
        mode={modal}
        isOwner
        onClose={() => setModal(null)}
        onCountChange={(delta) => {
          dispatch(setUser({
            ...user,
            followers: delta.followers !== undefined
              ? user.followers.slice(0, Math.max(0, user.followers.length + delta.followers))
              : user.followers,
            following: delta.following !== undefined
              ? user.following.slice(0, Math.max(0, user.following.length + delta.following))
              : user.following,
          }));
        }}
      />
    )}
    </>
  );
};

export default Profile;
