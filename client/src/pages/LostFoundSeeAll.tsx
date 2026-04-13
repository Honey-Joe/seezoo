import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getListings } from "../services/lostFoundService";
import type { ILostFound, PetSpecies } from "../types";

/* ─── helpers ───────────────────────────────────── */
const SPECIES_EMOJI: Record<PetSpecies, string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰",
  fish: "🐠", reptile: "🦎", other: "🐾",
};

function daysAgo(dateStr: string) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

function isUserObj(u: ILostFound["user"]): u is { _id: string; name: string; username: string; profileImage?: string } {
  return typeof u === "object" && u !== null;
}

/* ─── horizontal listing card ───────────────────── */
const ListingRow = ({ listing }: { listing: ILostFound }) => {
  const isLost   = listing.type === "lost";
  const owner    = isUserObj(listing.user) ? listing.user : null;
  const dayLabel = daysAgo(listing.lastSeenDate);
  const urgent   = isLost && Math.floor((Date.now() - new Date(listing.lastSeenDate).getTime()) / 86400000) <= 3;

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = `${isLost ? "🔍 LOST PET" : "🐾 FOUND PET"}: ${listing.petName || listing.species} · ${listing.lastSeenLocation} · Contact: ${listing.contactPhone}`;
    if (navigator.share) {
      await navigator.share({ title: text, text, url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
      listing.isResolved
        ? "border-gray-200 opacity-60"
        : isLost
          ? urgent ? "border-red-300 shadow-md shadow-red-50" : "border-red-100 shadow-sm"
          : "border-green-100 shadow-sm"
    }`}>

      {/* urgent pulse ring */}
      {urgent && !listing.isResolved && (
        <span className="absolute -top-1 -left-1 w-3 h-3 z-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      )}

      <div className="flex">
        {/* ── Photo ── */}
        <div className="relative shrink-0 w-36 sm:w-44 h-36 sm:h-44 overflow-hidden bg-gray-100">
          {listing.photos[0] ? (
            <img
              src={listing.photos[0]}
              alt={listing.petName || listing.species}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-amber-50 to-orange-100">
              {SPECIES_EMOJI[listing.species]}
            </div>
          )}

          {/* Resolved overlay */}
          {listing.isResolved && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-bold bg-emerald-500 px-2 py-1 rounded-lg">✓ Reunited</span>
            </div>
          )}

          {/* Photo count */}
          {listing.photos.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              +{listing.photos.length - 1}
            </div>
          )}
        </div>

        {/* ── Details ── */}
        <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
          <div>
            {/* Top row: name + badges */}
            <div className="flex flex-wrap items-start gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-gray-900 text-lg leading-tight truncate">
                  {listing.petName
                    ? listing.petName
                    : `${listing.species.charAt(0).toUpperCase()}${listing.species.slice(1)}`}
                </h3>
                {listing.breed && (
                  <p className="text-xs text-gray-400">{listing.breed}</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                {/* Status pill */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white ${
                  listing.isResolved
                    ? "bg-gray-400"
                    : isLost
                      ? "bg-gradient-to-r from-red-500 to-orange-500"
                      : "bg-gradient-to-r from-green-500 to-emerald-500"
                }`}>
                  {listing.isResolved ? "✓ Resolved" : isLost ? "🔍 Lost" : "🐾 Found"}
                </span>

                {/* Reward */}
                {listing.rewardOffered && !listing.isResolved && (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    🏅 {listing.rewardAmount ? `$${listing.rewardAmount}` : "Reward"}
                  </span>
                )}
              </div>
            </div>

            {/* Attribute chips */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                {SPECIES_EMOJI[listing.species]} {listing.species}
              </span>
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                {listing.gender === "unknown" ? "❓" : listing.gender === "male" ? "♂️" : "♀️"} {listing.gender}
              </span>
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                {listing.size}
              </span>
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                🎨 {listing.color}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 line-clamp-2 mb-2.5 leading-relaxed">
              {listing.description}
            </p>

            {/* Location + date */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="truncate max-w-[160px]">{listing.lastSeenLocation}</span>
              </span>
              <span className={`flex items-center gap-1 font-semibold ${urgent ? "text-red-400" : "text-gray-400"}`}>
                🕐 {dayLabel}
              </span>
            </div>
          </div>

          {/* Bottom row: actions */}
          <div className="flex items-center gap-2 mt-3">
            {!listing.isResolved && (
              <a
                href={`tel:${listing.contactPhone}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 ${
                  isLost
                    ? "bg-gradient-to-r from-red-500 to-orange-500"
                    : "bg-gradient-to-r from-green-500 to-emerald-500"
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.37 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {listing.contactPhone}
              </a>
            )}

            {listing.contactEmail && !listing.isResolved && (
              <a href={`mailto:${listing.contactEmail}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
                ✉️ Email
              </a>
            )}

            {/* Share */}
            <button
              onClick={handleShare}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-100 transition-all"
            >
              {copied ? (
                <>✓ Copied</>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Share
                </>
              )}
            </button>
          </div>

          {/* Posted by */}
          {owner && (
            <p className="text-[11px] text-gray-300 mt-2">
              Posted by <span className="text-gray-400 font-semibold">@{owner.username}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── skeleton ───────────────────────────────────── */
const SkeletonRow = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse flex">
    <div className="w-44 h-44 bg-gray-100 shrink-0" />
    <div className="flex-1 p-4 space-y-3">
      <div className="h-5 bg-gray-100 rounded w-1/3" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded-full w-14" />)}
      </div>
      <div className="h-3 bg-gray-100 rounded" />
      <div className="h-3 bg-gray-100 rounded w-4/5" />
      <div className="h-3 bg-gray-100 rounded w-2/5" />
    </div>
  </div>
);

/* ─── empty state ─────────────────────────────────── */
const EmptyState = ({ type }: { type: "lost" | "found" }) => (
  <div className="text-center py-20">
    <p className="text-6xl mb-4">{type === "lost" ? "🔍" : "🐾"}</p>
    <p className="text-gray-500 font-semibold text-lg mb-1">
      {type === "lost" ? "No missing pets reported" : "No found pets reported"}
    </p>
    <p className="text-gray-400 text-sm">
      {type === "lost"
        ? "Great news — no pets are reported missing right now!"
        : "No found strays reported yet in your area."}
    </p>
  </div>
);

/* ─── main page ───────────────────────────────── */
const LostFoundSeeAll = () => {
  const [lostList,  setLostList]  = useState<ILostFound[]>([]);
  const [foundList, setFoundList] = useState<ILostFound[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");
  const [filterSpecies, setFilterSpecies] = useState<"" | PetSpecies>("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [lostRes, foundRes] = await Promise.all([
          getListings({ type: "lost",  resolved: false }),
          getListings({ type: "found", resolved: false }),
        ]);
        setLostList(lostRes.data);
        setFoundList(foundRes.data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const applyFilter = (list: ILostFound[]) =>
    filterSpecies ? list.filter((l) => l.species === filterSpecies) : list;

  const filteredLost  = applyFilter(lostList);
  const filteredFound = applyFilter(foundList);
  const activeList    = activeTab === "lost" ? filteredLost : filteredFound;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-white">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">
        {/* Background emoji grid */}
        <div className="absolute inset-0 flex flex-wrap gap-8 p-8 opacity-5 text-5xl pointer-events-none select-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i}>{["🐶","🐱","🐦","🐰","🐾","🔍"][i % 6]}</span>
          ))}
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Live
                </span>
                <span className="text-slate-400 text-sm">Updated in real-time</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                Lost & Found Board
              </h1>
              <p className="text-slate-400 text-sm max-w-md">
                Every moment counts. Help reunite pets with their families by sharing these listings.
              </p>
            </div>

            {/* Stats */}
            <div className="sm:ml-auto flex gap-4">
              <div className={`flex flex-col items-center bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-3 cursor-pointer transition-all hover:bg-red-500/20 ${activeTab === "lost" ? "ring-2 ring-red-500" : ""}`}
                onClick={() => setActiveTab("lost")}>
                <span className="text-3xl font-extrabold text-red-400">{lostList.length}</span>
                <span className="text-xs text-red-300 font-semibold">Missing</span>
              </div>
              <div className={`flex flex-col items-center bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-3 cursor-pointer transition-all hover:bg-green-500/20 ${activeTab === "found" ? "ring-2 ring-green-500" : ""}`}
                onClick={() => setActiveTab("found")}>
                <span className="text-3xl font-extrabold text-green-400">{foundList.length}</span>
                <span className="text-xs text-green-300 font-semibold">Found</span>
              </div>
            </div>
          </div>

          {/* Urgency strip — most recent lost */}
          {!loading && lostList.length > 0 && activeTab === "lost" && (() => {
            const urgent = lostList.filter(l => Math.floor((Date.now() - new Date(l.lastSeenDate).getTime()) / 86400000) <= 2);
            if (!urgent.length) return null;
            return (
              <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-red-400 text-xs font-bold whitespace-nowrap shrink-0">🚨 Recent (48 h):</span>
                {urgent.slice(0, 6).map((l) => (
                  <div key={l._id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 shrink-0">
                    {l.photos[0]
                      ? <img src={l.photos[0]} className="w-5 h-5 rounded-full object-cover" alt="" />
                      : <span className="text-sm">{SPECIES_EMOJI[l.species]}</span>
                    }
                    <span className="text-white text-xs font-semibold">
                      {l.petName || l.species}
                    </span>
                    <span className="text-slate-400 text-[10px]">· {l.lastSeenLocation.split(",")[0]}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Tab bar + filter ── */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto">

            {/* Tabs */}
            <button
              onClick={() => setActiveTab("lost")}
              className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === "lost" ? "text-red-500" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              🔍 Missing Pets
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === "lost" ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-400"}`}>
                {filteredLost.length}
              </span>
              {activeTab === "lost" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("found")}
              className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === "found" ? "text-green-500" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              🐾 Found Strays
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === "found" ? "bg-green-100 text-green-500" : "bg-gray-100 text-gray-400"}`}>
                {filteredFound.length}
              </span>
              {activeTab === "found" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
              )}
            </button>

            {/* Species filter */}
            <select
              value={filterSpecies}
              onChange={(e) => setFilterSpecies(e.target.value as "" | PetSpecies)}
              className="ml-auto my-2 text-xs border border-gray-200 rounded-xl px-3 py-1.5 text-gray-600 focus:outline-none focus:border-orange-400 bg-white shrink-0"
            >
              <option value="">All species</option>
              <option value="dog">🐶 Dog</option>
              <option value="cat">🐱 Cat</option>
              <option value="bird">🐦 Bird</option>
              <option value="rabbit">🐰 Rabbit</option>
              <option value="fish">🐠 Fish</option>
              <option value="reptile">🦎 Reptile</option>
              <option value="other">🐾 Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
        ) : activeList.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <>
            {/* Context banner */}
            <div className={`flex items-center gap-3 text-sm px-4 py-3 rounded-xl mb-2 ${
              activeTab === "lost"
                ? "bg-red-50 border border-red-100 text-red-600"
                : "bg-green-50 border border-green-100 text-green-600"
            }`}>
              <span className="text-lg">{activeTab === "lost" ? "🙏" : "💚"}</span>
              <span className="font-medium">
                {activeTab === "lost"
                  ? `${filteredLost.length} pet${filteredLost.length !== 1 ? "s" : ""} currently missing — please share to help find them!`
                  : `${filteredFound.length} stray${filteredFound.length !== 1 ? "s" : ""} found and waiting for their owner — recognize any?`
                }
              </span>
            </div>

            {activeList.map((listing) => (
              <ListingRow key={listing._id} listing={listing} />
            ))}

            {/* Bottom CTA */}
            <div className="text-center pt-6 pb-2">
              <Link
                to="/new-lost-found"
                className={`inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white shadow-lg transition-all hover:opacity-90 hover:scale-105 ${
                  activeTab === "lost"
                    ? "bg-gradient-to-r from-red-500 to-orange-500 shadow-red-100"
                    : "bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-100"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {activeTab === "lost" ? "Report a Missing Pet" : "Report a Found Stray"}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LostFoundSeeAll;
