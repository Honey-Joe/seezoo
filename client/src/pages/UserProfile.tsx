import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store";
import { setUser } from "../store/authSlice";
import { getUserProfile, followUser, unfollowUser, acceptFollowRequest, declineFollowRequest } from "../services/userService";
import { getUserPosts } from "../services/postService";
import FollowListModal from "../components/FollowListModal";
import type { IPublicUser, IPet, IFollowRequester } from "../types";
import type { IFeedPost } from "../services/postService";

const SPECIES_EMOJI: Record<IPet["species"], string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", fish: "🐠", reptile: "🦎", other: "🐾",
};

const UserProfile = () => {
  const { username }   = useParams<{ username: string }>();
  const me             = useAppSelector((s) => s.auth.user);
  const dispatch       = useAppDispatch();

  const [profile,      setProfile]      = useState<IPublicUser | null>(null);
  const [posts,        setPosts]        = useState<IFeedPost[]>([]);
  const [postsBlocked, setPostsBlocked] = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [followLoading,setFollowLoading]= useState(false);
  const [isPending,    setIsPending]    = useState(false);
  const [activeTab,    setActiveTab]    = useState<"posts" | "pets">("posts");
  const [notFound,     setNotFound]     = useState(false);
  const [modal,        setModal]        = useState<"followers" | "following" | null>(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);
    setPostsBlocked(false);
    setIsPending(false);

    getUserProfile(username)
      .then((r) => {
        setProfile(r.data);
        getUserPosts(r.data._id)
          .then((pr) => setPosts(pr.data))
          .catch((err) => { if (err?.response?.status === 403) setPostsBlocked(true); });
      })
      .catch((err) => { if (err?.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl animate-bounce mb-3">🐾</p>
        <p className="text-purple-600 text-sm font-semibold">Loading profile...</p>
      </div>
    </div>
  );

  if (notFound || !profile) return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">🐾</p>
        <p className="text-gray-700 font-bold text-lg mb-2">User not found</p>
        <p className="text-gray-400 text-sm">@{username} doesn't exist.</p>
      </div>
    </div>
  );

  const isMe        = me?._id === profile._id;
  const isFollowing  = me?.following.includes(profile._id) ?? false;
  const hasPending   = isPending;

  const handleFollow = async () => {
    if (!me || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(profile._id);
        setProfile((p) => p ? { ...p, followers: p.followers.filter((id) => id !== me._id) } : p);
        dispatch(setUser({ ...me, following: me.following.filter((id) => id !== profile._id) }));
      } else if (hasPending) {
        // Cancel pending request
        await unfollowUser(profile._id);
        setIsPending(false);
      } else {
        const res = await followUser(profile._id);
        if ((res.data as { message?: string })?.message === "Follow request sent") {
          setIsPending(true);
        } else {
          setProfile((p) => p ? { ...p, followers: [...p.followers, me._id] } : p);
          dispatch(setUser({ ...me, following: [...me.following, profile._id] }));
        }
      }
    } finally { setFollowLoading(false); }
  };

  const handleAccept = async (requesterId: string) => {
    await acceptFollowRequest(requesterId);
    setProfile((p) => p ? {
      ...p,
      followers: [...p.followers, requesterId],
      followRequests: (p.followRequests ?? []).filter((r) => (r as IFollowRequester)._id !== requesterId),
    } : p);
  };

  const handleDecline = async (requesterId: string) => {
    await declineFollowRequest(requesterId);
    setProfile((p) => p ? {
      ...p,
      followRequests: (p.followRequests ?? []).filter((r) => (r as IFollowRequester)._id !== requesterId),
    } : p);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-16">

      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 h-44" />

      <div className="max-w-3xl mx-auto px-4">

        {/* Avatar + info */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 mb-6">
          <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-4xl font-bold shrink-0">
            {profile.profileImage
              ? <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
              : <div className="my-5">{profile.name.charAt(0).toUpperCase()}</div> 
            }
          </div>

          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2 mb-1 mt-10">
              <h1 className="text-2xl font-bold text-gray-900 pt-5">{profile.name}</h1>
              {profile.isPrivate && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">🔒 Private</span>
              )}
            </div>
            <p className="text-purple-600 font-medium text-sm mt-2">@{profile.username}</p>
            {profile.bio && <p className="text-gray-600 text-sm max-w-md">{profile.bio}</p>}
          </div>

          {/* Stats */}
          <div className="flex gap-6 pb-1 shrink-0">
            {[
              { label: "Posts",     value: posts.length,             onClick: undefined },
              { label: "Followers", value: profile.followers.length, onClick: () => setModal("followers") },
              { label: "Following", value: profile.following.length, onClick: () => setModal("following") },
            ].map(({ label, value, onClick }) => (
              <button key={label} onClick={onClick} disabled={!onClick}
                className={`text-center ${onClick ? "cursor-pointer hover:opacity-70" : "cursor-default"}`}>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Follow button */}
        {!isMe && me && (
          <div className="mb-6">
            <button onClick={handleFollow} disabled={followLoading}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50 ${
                isFollowing
                  ? "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200"
                  : hasPending
                  ? "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-red-50 hover:text-red-600"
                  : "bg-gradient-to-r from-purple-600 to-violet-500 text-white hover:opacity-90"
              }`}>
              {followLoading ? "..." : isFollowing ? "Following ✓" : hasPending ? "Requested ⏳" : "+ Follow"}
            </button>
          </div>
        )}

        {/* Follow requests (only visible to profile owner) */}
        {isMe && profile.isPrivate && (profile.followRequests ?? []).length > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-purple-100 shadow-sm p-4">
            <p className="text-sm font-bold text-gray-700 mb-3">Follow Requests ({profile.followRequests!.length})</p>
            <div className="flex flex-col gap-3">
              {(profile.followRequests as IFollowRequester[]).map((requester) => (
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
              {tab === "posts" ? `📸 Posts (${posts.length})` : `🐾 Pets (${profile.pets.length})`}
            </button>
          ))}
        </div>

        {/* Posts tab */}
        {activeTab === "posts" && (
          postsBlocked ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🔒</p>
              <p className="text-gray-700 font-bold text-base mb-1">This account is private</p>
              <p className="text-gray-400 text-sm">Follow this account to see their posts.</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📸</p>
              <p className="text-gray-400 text-sm">No posts yet.</p>
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
          profile.pets.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🐾</p>
              <p className="text-gray-400 text-sm">No pets added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.pets.map((pet) => (
                <div key={pet._id} className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 flex gap-4">
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
                    {pet.breed && <p className="text-xs text-gray-500">{pet.breed}</p>}
                    {pet.age !== undefined && <p className="text-xs text-gray-400">{pet.age} yr{pet.age !== 1 ? "s" : ""}</p>}
                    {pet.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pet.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>

    {modal && profile && (
      <FollowListModal
        userId={profile._id}
        mode={modal}
        isOwner={isMe}
        onClose={() => setModal(null)}
        onCountChange={(delta) => {
          setProfile((p) => {
            if (!p) return p;
            const followers = delta.followers !== undefined
              ? p.followers.slice(0, Math.max(0, p.followers.length + delta.followers))
              : p.followers;
            const following = delta.following !== undefined
              ? p.following.slice(0, Math.max(0, p.following.length + delta.following))
              : p.following;
            return { ...p, followers, following };
          });
        }}
      />
    )}
    </>
  );
};

export default UserProfile;
