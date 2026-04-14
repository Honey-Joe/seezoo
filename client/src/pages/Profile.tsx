import { Link } from "react-router-dom";
import { useAppSelector } from "../store";
import type { IPet } from "../types";

const SPECIES_EMOJI: Record<IPet["species"], string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", fish: "🐠", reptile: "🦎", other: "🐾",
};

const Profile = () => {
  const user = useAppSelector((s) => s.auth.user);

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-purple-50 to-white pb-16">

      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 h-44 relative">
        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* New Post button */}
          <Link
            to="/new-post"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-white/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Post
          </Link>

          {/* Lost & Found button */}
          <Link
            to="/lost-found"
            className="flex items-center gap-2 bg-amber-400/80 hover:bg-amber-400 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-amber-300/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Lost & Found
          </Link>

          {/* Settings button */}
          <Link
            to="/settings"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-white/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">

        {/* Avatar + info */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 mb-8">
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
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                  🔒 Private
                </span>
              )}
            </div>
            <p className="text-purple-600 font-medium text-sm mb-2">@{user.username}</p>
            {user.bio && <p className="text-gray-600 text-sm max-w-md">{user.bio}</p>}
          </div>

          {/* Stats */}
          <div className="flex gap-6 pb-1 shrink-0">
            {[
              { label: "Pets",      value: user.pets.length },
              { label: "Followers", value: user.followers.length },
              { label: "Following", value: user.following.length },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Member since + quick actions row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-xs text-gray-400">
            🗓 Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>

          {/* Change Password shortcut */}
          <Link
            to="/change-password"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            🔐 {user.authProvider === "google" ? "Set a Password" : "Change Password"}
          </Link>
        </div>

        {/* Pets section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            🐾 Pets
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {user.pets.length}
            </span>
          </h2>

          {user.pets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-purple-200 p-12 text-center">
              <p className="text-4xl mb-3">🐾</p>
              <p className="text-gray-500 text-sm mb-4">No pets added yet.</p>
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-sm"
              >
                + Add your first pet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.pets.map((pet) => (
                <div key={pet._id} className="bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow p-4 flex gap-4">
                  {/* Pet avatar */}
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                    {pet.profileImage
                      ? <img src={pet.profileImage} alt={pet.name} className="w-full h-full object-cover" />
                      : SPECIES_EMOJI[pet.species]
                    }
                  </div>

                  {/* Pet info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-gray-900">{pet.name}</p>
                      <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full capitalize">
                        {SPECIES_EMOJI[pet.species]} {pet.species}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {pet.breed && (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">
                          {pet.breed}
                        </span>
                      )}
                      {pet.age !== undefined && (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">
                          {pet.age} yr{pet.age !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {pet.bio && (
                      <p className="text-xs text-gray-500 line-clamp-2">{pet.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
