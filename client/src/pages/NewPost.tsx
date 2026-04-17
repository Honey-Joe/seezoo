import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store";
import { createPost } from "../services/postService";

/* ───── tiny helpers ───── */
const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰",
  fish: "🐠", reptile: "🦎", other: "🐾",
};

function formatBytes(b: number) {
  return b < 1024 * 1024
    ? `${(b / 1024).toFixed(0)} KB`
    : `${(b / 1024 / 1024).toFixed(1)} MB`;
}

/* ───── component ───── */
const NewPost = () => {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* state */
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  /* add files */
  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    const total = files.length + arr.length;
    if (total > 10) {
      setError("Maximum 10 images per post.");
      return;
    }
    setFiles((prev) => [...prev, ...arr]);
    arr.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPreviews((prev) => [...prev, url]);
    });
    setError(null);
  }, [files.length]);

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
    setActiveIdx((prev) => Math.max(0, prev > i ? prev - 1 : Math.min(prev, files.length - 2)));
  };

  /* pet tag toggle */
  const togglePet = (id: string) =>
    setSelectedPetIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  /* drag-and-drop */
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  /* submit */
  const handleSubmit = async () => {
    if (!files.length) { setError("Please add at least one photo."); return; }
    setLoading(true);
    setError(null);
    try {
      await createPost({ images: files, caption, location, petTags: selectedPetIds, commentsEnabled });
      navigate("/profile");
    } catch {
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const captionLeft = 2200 - caption.length;

  return (
    <div className="h-screen bg-gradient-to-b from-purple-50 to-white">

      {/* ── Header ── */}
      <div className="sticky     z-30 bg-white/90 backdrop-blur border-b border-purple-100 shadow-sm">
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
          <h1 className="text-base font-bold text-gray-900">New Post</h1>
          <button
            onClick={handleSubmit}
            disabled={loading || !files.length}
            className="text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-violet-500 px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all shadow-sm shadow-purple-200"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Sharing…
              </span>
            ) : "Share"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* ── LEFT: image area ── */}
        <div className="space-y-4">

          {/* Drop zone / preview */}
          {files.length === 0 ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed cursor-pointer transition-all h-[420px] ${
                dragOver
                  ? "border-purple-500 bg-purple-50 scale-[1.01]"
                  : "border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50/50"
              }`}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center mb-4">
                <svg className="w-9 h-9 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <p className="text-gray-700 font-semibold mb-1">Drag photos here</p>
              <p className="text-gray-400 text-sm">or click to select • up to 10 images</p>
              <div className="mt-5 bg-gradient-to-r from-purple-600 to-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-purple-200">
                Select from device
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Main Preview */}
              <div className="relative rounded-3xl overflow-hidden bg-black shadow-xl shadow-purple-100/60" style={{ aspectRatio: "1/1" }}>
                <img
                  src={previews[activeIdx]}
                  alt={`Preview ${activeIdx + 1}`}
                  className="w-full h-full object-contain"
                />
                {/* Nav arrows */}
                {files.length > 1 && (
                  <>
                    {activeIdx > 0 && (
                      <button
                        onClick={() => setActiveIdx((i) => i - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                    )}
                    {activeIdx < files.length - 1 && (
                      <button
                        onClick={() => setActiveIdx((i) => i + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    )}
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {files.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIdx ? "w-4 bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
                {/* Count badge */}
                <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {activeIdx + 1} / {files.length}
                </div>
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
                {previews.map((src, i) => (
                  <div key={i} className="relative shrink-0 snap-start group">
                    <button
                      onClick={() => setActiveIdx(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        i === activeIdx ? "border-purple-500 ring-2 ring-purple-300" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      ×
                    </button>
                    <p className="text-[9px] text-gray-400 mt-0.5 text-center truncate w-16">{formatBytes(files[i].size)}</p>
                  </div>
                ))}

                {/* Add more */}
                {files.length < 10 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 shrink-0 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-400 hover:text-purple-600 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* ── RIGHT: Details Panel ── */}
        <div className="space-y-4">

          {/* User chip */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user.profileImage
                ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                : user.name.charAt(0).toUpperCase()
              }
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
              <p className="text-xs text-purple-500">@{user.username}</p>
            </div>
          </div>

          {/* Caption */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 2200))}
              placeholder="Write a caption… 🐾"
              rows={4}
              className="w-full text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none leading-relaxed"
            />
            <p className={`text-right text-xs mt-1 ${captionLeft < 100 ? "text-orange-400" : "text-gray-300"}`}>
              {captionLeft} / 2200
            </p>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Location</label>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value.slice(0, 100))}
                placeholder="Add location…"
                className="flex-1 text-sm text-gray-800 placeholder-gray-300 focus:outline-none"
              />
              {location && (
                <button onClick={() => setLocation("")} className="text-gray-300 hover:text-gray-500 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Pet Tags */}
          {user.pets.length > 0 && (
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Tag Pets
                {selectedPetIds.length > 0 && (
                  <span className="ml-2 bg-purple-100 text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full lowercase">
                    {selectedPetIds.length} tagged
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {user.pets.map((pet) => {
                  const active = selectedPetIds.includes(pet._id);
                  return (
                    <button
                      key={pet._id}
                      onClick={() => togglePet(pet._id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                      }`}
                    >
                      <span>{SPECIES_EMOJI[pet.species]}</span>
                      {pet.name}
                      {active && (
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments Toggle */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Allow Comments</p>
              <p className="text-xs text-gray-400 mt-0.5">Let others comment on this post</p>
            </div>
            <button
              onClick={() => setCommentsEnabled((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                commentsEnabled ? "bg-gradient-to-r from-purple-600 to-violet-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                  commentsEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Share button (mobile) */}
          <button
            onClick={handleSubmit}
            disabled={loading || !files.length}
            className="lg:hidden w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3.5 rounded-2xl text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-purple-200"
          >
            {loading ? "Sharing…" : "Share Post 🐾"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPost;
