import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFollowers, getFollowing, unfollowUser, removeFollower } from "../services/userService";
import type { IFollowRequester } from "../types";

interface Props {
  userId: string;
  mode: "followers" | "following";
  isOwner: boolean;       // true = viewing own profile (show Remove / Unfollow)
  onClose: () => void;
  onCountChange?: (delta: { followers?: number; following?: number }) => void;
}

const FollowListModal = ({ userId, mode, isOwner, onClose, onCountChange }: Props) => {
  const navigate = useNavigate();
  const [list,    setList]    = useState<IFollowRequester[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState<string | null>(null);

  useEffect(() => {
    (mode === "followers" ? getFollowers(userId) : getFollowing(userId))
      .then((r) => setList(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, mode]);

  const handleRemoveFollower = async (personId: string) => {
    setBusy(personId);
    try {
      await removeFollower(personId);
      setList((l) => l.filter((u) => u._id !== personId));
      onCountChange?.({ followers: -1 });
    } finally { setBusy(null); }
  };

  const handleUnfollow = async (personId: string) => {
    setBusy(personId);
    try {
      await unfollowUser(personId);
      setList((l) => l.filter((u) => u._id !== personId));
      onCountChange?.({ following: -1 });
    } finally { setBusy(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="font-bold text-gray-900 capitalize">{mode}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 py-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <p className="text-purple-500 text-sm animate-pulse">Loading...</p>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No {mode} yet.</p>
            </div>
          ) : (
            list.map((person) => (
              <div key={person._id} className="flex items-center justify-between gap-3 py-2.5">
                <button
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  onClick={() => { navigate(`/u/${person.username}`); onClose(); }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                    {person.profileImage
                      ? <img src={person.profileImage} alt={person.name} className="w-full h-full object-cover" />
                      : person.name.charAt(0).toUpperCase()
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{person.name}</p>
                    <p className="text-xs text-purple-500 truncate">@{person.username}</p>
                  </div>
                </button>

                {isOwner && (
                  mode === "followers" ? (
                    <button
                      disabled={busy === person._id}
                      onClick={() => handleRemoveFollower(person._id)}
                      className="shrink-0 px-3 py-1 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {busy === person._id ? "..." : "Remove"}
                    </button>
                  ) : (
                    <button
                      disabled={busy === person._id}
                      onClick={() => handleUnfollow(person._id)}
                      className="shrink-0 px-3 py-1 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {busy === person._id ? "..." : "Unfollow"}
                    </button>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowListModal;
