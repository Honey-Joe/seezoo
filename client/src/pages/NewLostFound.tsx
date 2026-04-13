import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store";
import { createListing } from "../services/lostFoundService";
import type { PetSpecies, PetGender, PetSize } from "../types";

/* ─── constants ─────────────────────────────── */
const SPECIES_OPTIONS: { value: PetSpecies; emoji: string; label: string }[] = [
  { value: "dog",     emoji: "🐶", label: "Dog" },
  { value: "cat",     emoji: "🐱", label: "Cat" },
  { value: "bird",    emoji: "🐦", label: "Bird" },
  { value: "rabbit",  emoji: "🐰", label: "Rabbit" },
  { value: "fish",    emoji: "🐠", label: "Fish" },
  { value: "reptile", emoji: "🦎", label: "Reptile" },
  { value: "other",   emoji: "🐾", label: "Other" },
];

const SIZE_OPTIONS: { value: PetSize; label: string }[] = [
  { value: "tiny",       label: "Tiny (< 5 kg)" },
  { value: "small",      label: "Small (5–10 kg)" },
  { value: "medium",     label: "Medium (10–25 kg)" },
  { value: "large",      label: "Large (25–45 kg)" },
  { value: "extra-large", label: "Extra-large (> 45 kg)" },
];

const GENDER_OPTIONS: { value: PetGender; label: string; emoji: string }[] = [
  { value: "male",    label: "Male",    emoji: "♂️" },
  { value: "female",  label: "Female",  emoji: "♀️" },
  { value: "unknown", label: "Unknown", emoji: "❓" },
];

/* ─── helpers ────────────────────────────────── */
function today() {
  return new Date().toISOString().split("T")[0];
}

const InputRow = ({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white transition-all";

/* ─── component ──────────────────────────────── */
const NewLostFound = () => {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* report type */
  const [reportType, setReportType] = useState<"lost" | "found">("lost");

  /* photos */
  const [photos, setPhotos]   = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragOver, setDragOver]   = useState(false);

  /* pet details */
  const [petName,    setPetName]    = useState("");
  const [species,    setSpecies]    = useState<PetSpecies>("dog");
  const [breed,      setBreed]      = useState("");
  const [age,        setAge]        = useState("");
  const [gender,     setGender]     = useState<PetGender>("unknown");
  const [size,       setSize]       = useState<PetSize>("medium");
  const [color,      setColor]      = useState("");
  const [description, setDescription] = useState("");
  const [microchipId, setMicrochipId] = useState("");

  /* location & date */
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [lastSeenDate,     setLastSeenDate]     = useState(today());

  /* contact */
  const [contactName,  setContactName]  = useState(user?.name ?? "");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email ?? "");

  /* reward */
  const [rewardOffered, setRewardOffered] = useState(false);
  const [rewardAmount,  setRewardAmount]  = useState("");

  /* ui */
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  /* ── photo helpers ── */
  const addPhotos = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    if (photos.length + arr.length > 6) { setError("Maximum 6 photos allowed."); return; }
    setPhotos((p) => [...p, ...arr]);
    arr.forEach((f) => { const url = URL.createObjectURL(f); setPreviews((p) => [...p, url]); });
    setError(null);
  }, [photos.length]);

  const removePhoto = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
    setActiveIdx((a) => Math.max(0, a >= i ? a - 1 : a));
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!photos.length)          { setError("Please add at least one photo."); return; }
    if (!color.trim())           { setError("Please describe the pet's colour/markings."); return; }
    if (!description.trim())     { setError("Please provide a description."); return; }
    if (!lastSeenLocation.trim()){ setError("Please enter the last seen location."); return; }
    if (!contactName.trim())     { setError("Please enter a contact name."); return; }
    if (!contactPhone.trim())    { setError("Please enter a contact phone number."); return; }

    setLoading(true);
    setError(null);
    try {
      await createListing({
        photos, type: reportType,
        petName: petName.trim() || undefined,
        species, breed: breed.trim() || undefined,
        age: age || undefined,
        gender, size,
        color, description, microchipId: microchipId.trim() || undefined,
        lastSeenLocation, lastSeenDate,
        contactName, contactPhone,
        contactEmail: contactEmail.trim() || undefined,
        rewardOffered,
        rewardAmount: rewardOffered && rewardAmount ? rewardAmount : undefined,
      });
      navigate("/lost-found");
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isLost = reportType === "lost";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50 to-white">

      {/* ── Sticky header ── */}
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur border-b border-amber-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <span className="text-lg">{isLost ? "🔍" : "🐾"}</span>
            <h1 className="text-base font-bold text-gray-900">
              {isLost ? "Report Lost Pet" : "Report Found Pet"}
            </h1>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !photos.length}
            className={`text-sm font-bold text-white px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all shadow-sm ${
              isLost
                ? "bg-gradient-to-r from-red-500 to-orange-500 shadow-red-100"
                : "bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-100"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Posting…
              </span>
            ) : "Post"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* ── LEFT ── */}
        <div className="space-y-5">

          {/* Report type toggle */}
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">I am reporting a…</p>
            <div className="grid grid-cols-2 gap-3">
              {(["lost", "found"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setReportType(t)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                    reportType === t
                      ? t === "lost"
                        ? "border-red-400 bg-red-50 text-red-600"
                        : "border-green-400 bg-green-50 text-green-600"
                      : "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{t === "lost" ? "😿" : "🐶"}</span>
                  <span>{t === "lost" ? "Lost Pet" : "Found Stray"}</span>
                  <span className="text-xs font-normal opacity-70">
                    {t === "lost" ? "My pet is missing" : "I found a stray pet"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Photos ── */}
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Photos <span className="text-red-400">*</span>
              <span className="ml-1 font-normal normal-case text-gray-400">(up to 6)</span>
            </p>

            {photos.length === 0 ? (
              <div
                onDrop={(e) => { e.preventDefault(); setDragOver(false); addPhotos(e.dataTransfer.files); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  dragOver ? "border-amber-400 bg-amber-50" : "border-amber-200 hover:border-amber-400 hover:bg-amber-50/50"
                }`}
              >
                <span className="text-4xl mb-2">📷</span>
                <p className="text-sm font-semibold text-gray-600">Add photos of the pet</p>
                <p className="text-xs text-gray-400 mt-1">Drag & drop or click • max 6 photos</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "4/3" }}>
                  <img src={previews[activeIdx]} alt="" className="w-full h-full object-contain" />
                  {photos.length > 1 && (
                    <>
                      {activeIdx > 0 && (
                        <button onClick={() => setActiveIdx((i) => i - 1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full text-white flex items-center justify-center">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                      )}
                      {activeIdx < photos.length - 1 && (
                        <button onClick={() => setActiveIdx((i) => i + 1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full text-white flex items-center justify-center">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                      )}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {photos.map((_, i) => (
                          <button key={i} onClick={() => setActiveIdx(i)}
                            className={`h-1.5 rounded-full transition-all ${i === activeIdx ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
                        ))}
                      </div>
                    </>
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {activeIdx + 1} / {photos.length}
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {previews.map((src, i) => (
                    <div key={i} className="relative shrink-0 group">
                      <button onClick={() => setActiveIdx(i)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activeIdx ? "border-amber-500 ring-2 ring-amber-300" : "border-transparent opacity-60 hover:opacity-100"}`}>
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </button>
                      <button onClick={() => removePhoto(i)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                  ))}
                  {photos.length < 6 && (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-14 h-14 shrink-0 rounded-lg border-2 border-dashed border-amber-200 hover:border-amber-400 bg-amber-50 flex items-center justify-center text-amber-400 text-xl hover:text-amber-600 transition-all">+</button>
                  )}
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => e.target.files && addPhotos(e.target.files)} />
          </div>

          {/* ── Pet Details ── */}
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pet Details</p>

            {/* Pet name */}
            <InputRow label="Pet Name (if known)">
              <input value={petName} onChange={(e) => setPetName(e.target.value)}
                placeholder="e.g. Buddy" className={inputCls} />
            </InputRow>

            {/* Species pills */}
            <InputRow label="Species" required>
              <div className="flex flex-wrap gap-2">
                {SPECIES_OPTIONS.map((s) => (
                  <button key={s.value} onClick={() => setSpecies(s.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      species === s.value
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-amber-300"
                    }`}>
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </InputRow>

            {/* Breed + age row */}
            <div className="grid grid-cols-2 gap-3">
              <InputRow label="Breed">
                <input value={breed} onChange={(e) => setBreed(e.target.value)}
                  placeholder="e.g. Golden Retriever" className={inputCls} />
              </InputRow>
              <InputRow label="Age (years)">
                <input type="number" min="0" max="30" value={age} onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 3" className={inputCls} />
              </InputRow>
            </div>

            {/* Gender */}
            <InputRow label="Gender">
              <div className="flex gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button key={g.value} onClick={() => setGender(g.value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      gender === g.value
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-amber-300"
                    }`}>
                    {g.emoji} {g.label}
                  </button>
                ))}
              </div>
            </InputRow>

            {/* Size */}
            <InputRow label="Size">
              <select value={size} onChange={(e) => setSize(e.target.value as PetSize)} className={inputCls}>
                {SIZE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </InputRow>

            {/* Color */}
            <InputRow label="Colour & Markings" required>
              <input value={color} onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Golden fur, white patch on chest" className={inputCls} />
            </InputRow>

            {/* Description */}
            <InputRow label="Description" required>
              <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                placeholder="Any unique features, collar colour, behaviour, where it was last seen…"
                rows={4} className={`${inputCls} resize-none`} />
              <p className="text-right text-xs text-gray-300 mt-1">{2000 - description.length} / 2000</p>
            </InputRow>

            {/* Microchip */}
            <InputRow label="Microchip ID (optional)">
              <input value={microchipId} onChange={(e) => setMicrochipId(e.target.value)}
                placeholder="15-digit chip number" className={inputCls} />
            </InputRow>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="space-y-4">

          {/* ── Location & Date ── */}
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              {isLost ? "Last Seen" : "Where Found"}
            </p>

            <InputRow label={isLost ? "Last Seen Location" : "Location Found"} required>
              <div className="flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-amber-400 focus-within:bg-white transition-all">
                <svg className="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <input value={lastSeenLocation} onChange={(e) => setLastSeenLocation(e.target.value)}
                  placeholder="e.g. Central Park near the fountain"
                  className="flex-1 text-sm text-gray-900 placeholder-gray-300 focus:outline-none bg-transparent" />
              </div>
            </InputRow>

            <InputRow label={isLost ? "Date Last Seen" : "Date Found"} required>
              <input type="date" value={lastSeenDate} max={today()}
                onChange={(e) => setLastSeenDate(e.target.value)} className={inputCls} />
            </InputRow>
          </div>

          {/* ── Contact Info ── */}
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact Information</p>

            <InputRow label="Your Name" required>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)}
                placeholder="Full name" className={inputCls} />
            </InputRow>
            <InputRow label="Phone Number" required>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 234 567 8900" className={inputCls} />
            </InputRow>
            <InputRow label="Email (optional)">
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@example.com" className={inputCls} />
            </InputRow>
          </div>

          {/* ── Reward (lost only) ── */}
          {isLost && (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Reward Offered</p>
                  <p className="text-xs text-gray-400 mt-0.5">Offer a reward for safe return</p>
                </div>
                <button
                  onClick={() => { setRewardOffered((v) => !v); if (rewardOffered) setRewardAmount(""); }}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${rewardOffered ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${rewardOffered ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>

              {rewardOffered && (
                <InputRow label="Reward Amount">
                  <div className="flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-amber-400 focus-within:bg-white transition-all">
                    <span className="text-sm text-gray-400 font-semibold">$</span>
                    <input type="number" min="0" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)}
                      placeholder="0.00" className="flex-1 text-sm text-gray-900 placeholder-gray-300 focus:outline-none bg-transparent" />
                  </div>
                </InputRow>
              )}
            </div>
          )}

          {/* ── Urgency tip ── */}
          <div className={`rounded-2xl p-4 text-sm ${isLost ? "bg-red-50 border border-red-100" : "bg-green-50 border border-green-100"}`}>
            <p className={`font-semibold mb-1 ${isLost ? "text-red-600" : "text-green-600"}`}>
              {isLost ? "🚨 Tips to find your pet faster" : "💚 Tips while caring for a found pet"}
            </p>
            <ul className={`text-xs space-y-1 ${isLost ? "text-red-500" : "text-green-600"}`}>
              {isLost ? (
                <>
                  <li>• Post on local Facebook / Nextdoor groups</li>
                  <li>• Visit local shelters in person every 2 days</li>
                  <li>• Leave a worn piece of clothing near disappearance spot</li>
                  <li>• Check with vets — microchip may have been scanned</li>
                </>
              ) : (
                <>
                  <li>• Keep the pet safe and warm indoors</li>
                  <li>• Take it to a vet to scan for a microchip</li>
                  <li>• Post on local social media groups too</li>
                  <li>• Do not give away to strangers until owner verified</li>
                </>
              )}
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Mobile share btn */}
          <button onClick={handleSubmit} disabled={loading || !photos.length}
            className={`lg:hidden w-full py-3.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-all shadow-lg ${
              isLost ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-green-500 to-emerald-500"
            }`}>
            {loading ? "Posting…" : isLost ? "Post Lost Report 🔍" : "Post Found Report 🐾"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewLostFound;
