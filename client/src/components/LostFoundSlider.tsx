import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getListings } from "../services/lostFoundService";
import type { ILostFound, PetSpecies } from "../types";

const SPECIES_EMOJI: Record<PetSpecies, string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", fish: "🐠", reptile: "🦎", other: "🐾",
};

const LostFoundSlider = () => {
  const [items, setItems]   = useState<ILostFound[]>([]);
  const trackRef            = useRef<HTMLDivElement>(null);
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getListings({ resolved: false })
      .then((r) => setItems(r.data.slice(0, 10)))
      .catch(() => {});
  }, []);

  /* auto-scroll */
  useEffect(() => {
    if (!trackRef.current || items.length === 0) return;
    timerRef.current = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const cardW = el.firstElementChild?.clientWidth ?? 220;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardW + 12, behavior: "smooth" });
      }
    }, 3000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 my-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-amber-700 flex items-center gap-2">
          🔍 Lost & Found nearby
        </h3>
        <Link
          to="/lost-found"
          className="text-xs font-semibold text-amber-600 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full transition-colors"
        >
          See all →
        </Link>
      </div>

      {/* Scrollable track */}
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => {
          const isLost = item.type === "lost";
          return (
            <Link
              key={item._id}
              to="/lost-found"
              className="shrink-0 w-44 bg-white rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Photo */}
              <div className="relative h-28 bg-amber-50 overflow-hidden">
                {item.photos[0] ? (
                  <img src={item.photos[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {SPECIES_EMOJI[item.species]}
                  </div>
                )}
                <span className={`absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${
                  isLost ? "bg-red-500" : "bg-green-500"
                }`}>
                  {isLost ? "🔍 Lost" : "🐾 Found"}
                </span>
              </div>
              {/* Info */}
              <div className="p-2.5">
                <p className="text-xs font-bold text-gray-800 truncate">
                  {item.petName ?? item.species}
                </p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">
                  📍 {item.lastSeenLocation}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default LostFoundSlider;
