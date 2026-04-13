import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getListings, resolveListing } from "../services/lostFoundService";
import { useAppSelector } from "../store";
import type { ILostFound, PetSpecies } from "../types";

/* ─── helpers ─────────────────────────────────────── */
const SPECIES_EMOJI: Record<PetSpecies, string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", fish: "🐠", reptile: "🦎", other: "🐾",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isUserObj(u: ILostFound["user"]): u is { _id: string; name: string; username: string; profileImage?: string } {
  return typeof u === "object" && u !== null;
}

/* ─── card ────────────────────────────────────────── */
const ListingCard = ({
  listing,
  currentUserId,
  onResolve,
}: {
  listing: ILostFound;
  currentUserId?: string;
  onResolve: (id: string) => void;
}) => {
  const isLost     = listing.type === "lost";
  const owner      = isUserObj(listing.user) ? listing.user : null;
  const isOwner    = owner?._id === currentUserId;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
      listing.isResolved ? "opacity-60 grayscale" : ""
    } ${isLost ? "border-red-100" : "border-green-100"}`}>

      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {listing.photos[0] ? (
          <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {SPECIES_EMOJI[listing.species]}
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow ${
          listing.isResolved
            ? "bg-gray-500"
            : isLost
              ? "bg-gradient-to-r from-red-500 to-orange-500"
              : "bg-gradient-to-r from-green-500 to-emerald-500"
        }`}>
          {listing.isResolved ? "✓ Resolved" : isLost ? "🔍 Lost" : "🐾 Found"}
        </div>

        {/* Reward badge */}
        {listing.rewardOffered && !listing.isResolved && (
          <div className="absolute top-3 right-3 bg-amber-400 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            🏅 {listing.rewardAmount ? `$${listing.rewardAmount} Reward` : "Reward"}
          </div>
        )}

        {/* Photo count */}
        {listing.photos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            +{listing.photos.length - 1} photos
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-tight">
              {listing.petName ? listing.petName : `${listing.species.charAt(0).toUpperCase() + listing.species.slice(1)}`}
              <span className="ml-1.5 text-base">{SPECIES_EMOJI[listing.species]}</span>
            </h3>
            {listing.breed && (
              <p className="text-xs text-gray-400">{listing.breed}</p>
            )}
          </div>
          <span className="text-xs text-gray-400 shrink-0">{timeAgo(listing.createdAt)}</span>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{listing.gender}</span>
          <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{listing.size}</span>
          <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{listing.color}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="truncate">{listing.lastSeenLocation}</span>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{listing.description}</p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Contact */}
          {!listing.isResolved && (
            <a
              href={`tel:${listing.contactPhone}`}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all ${
                isLost
                  ? "bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90"
                  : "bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.37 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Call
            </a>
          )}
          {listing.contactEmail && !listing.isResolved && (
            <a href={`mailto:${listing.contactEmail}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Email
            </a>
          )}
          {/* Resolve — owner only */}
          {isOwner && !listing.isResolved && (
            <button onClick={() => onResolve(listing._id)}
              className="flex items-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-all">
              ✓ Resolved
            </button>
          )}
        </div>

        {/* Posted by */}
        {owner && (
          <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
            Posted by
            <span className="font-semibold text-gray-500">@{owner.username}</span>
          </p>
        )}
      </div>
    </div>
  );
};

/* ─── main page ───────────────────────────────── */
const LostFound = () => {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const [listings, setListings] = useState<ILostFound[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [typeFilter,    setTypeFilter]    = useState<"" | "lost" | "found">("");
  const [speciesFilter, setSpeciesFilter] = useState<"" | PetSpecies>("");
  const [showResolved,  setShowResolved]  = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await getListings({
        type:     typeFilter    || undefined,
        species:  speciesFilter || undefined,
        resolved: showResolved,
      });
      setListings(res.data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, [typeFilter, speciesFilter, showResolved]); // eslint-disable-line

  const handleResolve = async (id: string) => {
    try {
      await resolveListing(id);
      setListings((prev) => prev.map((l) => l._id === id ? { ...l, isResolved: true } : l));
    } catch { /* silent */ }
  };

  const active   = listings.filter((l) => !l.isResolved);
  const resolved = listings.filter((l) =>  l.isResolved);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50 to-white">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold mb-1 flex items-center gap-2">
                🔍 Lost & Found
              </h1>
              <p className="text-orange-100 text-sm max-w-md">
                Help reunite pets with their families. Every share brings them one step closer to home.
              </p>
            </div>
            {user && (
              <Link
                to="/new-lost-found"
                className="self-start sm:self-center flex items-center gap-2 bg-white text-orange-600 font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Report
              </Link>
            )}
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-extrabold">{active.filter((l) => l.type === "lost").length}</p>
              <p className="text-xs text-orange-200">Missing</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold">{active.filter((l) => l.type === "found").length}</p>
              <p className="text-xs text-orange-200">Found</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold">{resolved.length}</p>
              <p className="text-xs text-orange-200">Reunited 🎉</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sticky top-16 z-20 bg-white/90 backdrop-blur border-b border-amber-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-semibold">
            {(["", "lost", "found"] as const).map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 transition-colors ${typeFilter === t ? "bg-orange-500 text-white" : "bg-white text-gray-500 hover:bg-orange-50"}`}>
                {t === "" ? "All" : t === "lost" ? "🔍 Lost" : "🐾 Found"}
              </button>
            ))}
          </div>

          {/* Species filter */}
          <select value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value as ""| PetSpecies)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 text-gray-600 focus:outline-none focus:border-orange-400 bg-white">
            <option value="">All species</option>
            <option value="dog">🐶 Dog</option>
            <option value="cat">🐱 Cat</option>
            <option value="bird">🐦 Bird</option>
            <option value="rabbit">🐰 Rabbit</option>
            <option value="fish">🐠 Fish</option>
            <option value="reptile">🦎 Reptile</option>
            <option value="other">🐾 Other</option>
          </select>

          {/* Show resolved toggle */}
          <button onClick={() => setShowResolved((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-colors ${
              showResolved ? "bg-gray-100 text-gray-700 border-gray-300" : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
            }`}>
            {showResolved ? "✓ " : ""}Show Resolved
          </button>

          <span className="ml-auto text-xs text-gray-400">{listings.length} listing{listings.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-amber-100 overflow-hidden animate-pulse">
                <div className="bg-amber-50 aspect-[4/3]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🐾</p>
            <p className="text-gray-500 font-semibold mb-2">No listings yet</p>
            <p className="text-gray-400 text-sm mb-6">Be the first to post — every second counts!</p>
            {user && (
              <Link to="/new-lost-found"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-6 py-3 rounded-xl hover:opacity-90 shadow-md">
                + New Report
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((l) => (
              <ListingCard key={l._id} listing={l} currentUserId={user?._id} onResolve={handleResolve} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LostFound;
