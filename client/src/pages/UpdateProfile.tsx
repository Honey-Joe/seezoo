import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { setUser } from "../store/authSlice";
import { updateProfile, addPet, updatePet, deletePet } from "../services/userService";
import type { IPet, ApiError } from "../types";
import type { AxiosError } from "axios";

const SPECIES = ["dog", "cat", "bird", "rabbit", "fish", "reptile", "other"] as const;
const SPECIES_EMOJI: Record<IPet["species"], string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", fish: "🐠", reptile: "🦎", other: "🐾",
};

const inputCls = "w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:bg-white transition-all";
const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

/* ── Reusable image picker with preview ── */
interface ImagePickerProps {
  current?: string;
  preview: string | null;
  onFile: (file: File, preview: string) => void;
  onClear: () => void;
  shape?: "rounded-2xl" | "rounded-xl";
  size?: string;
  placeholder?: string;
}

const ImagePicker = ({
  current, preview, onFile, onClear,
  shape = "rounded-2xl", size = "w-24 h-24", placeholder = "📷",
}: ImagePickerProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const displayed = preview ?? current;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`${size} ${shape} border-2 border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 transition-colors overflow-hidden flex items-center justify-center text-3xl relative group`}
      >
        {displayed ? (
          <>
            <img src={displayed} alt="preview" className={`w-full h-full object-cover ${shape}`} />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-semibold">
              Change
            </div>
          </>
        ) : (
          <span className="text-purple-400">{placeholder}</span>
        )}
      </button>
      {(preview || current) && (
        <button type="button" onClick={onClear} className="text-xs text-red-400 hover:text-red-600">
          Remove
        </button>
      )}
      <input
        ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file, URL.createObjectURL(file));
          e.target.value = "";
        }}
      />
    </div>
  );
};

/* ── Empty pet form state ── */
const emptyPet = () => ({
  name: "", species: "dog" as IPet["species"],
  breed: "", age: "" as number | "",
  bio: "", imageFile: null as File | null, imagePreview: null as string | null,
});

const UpdateProfile = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  /* profile form */
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    username: user?.username ?? "",
    bio: user?.bio ?? "",
    isPrivate: user?.isPrivate ?? false,
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  /* add-pet form */
  const [newPet, setNewPet] = useState(emptyPet());
  const [petMsg, setPetMsg] = useState("");
  const [petErr, setPetErr] = useState("");
  const [petLoading, setPetLoading] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);

  /* edit-pet form */
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [editPet, setEditPet] = useState<{
    name: string; species: IPet["species"]; breed: string;
    age: number | ""; bio: string;
    imageFile: File | null; imagePreview: string | null;
  } | null>(null);

  /* ── handlers ── */
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setProfile((p) => ({ ...p, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(""); setProfileErr(""); setProfileLoading(true);
    try {
      const res = await updateProfile({ ...profile, imageFile: profileImageFile });
      dispatch(setUser(res.data));
      setProfileImageFile(null); setProfileImagePreview(null);
      setProfileMsg("Profile updated!");
    } catch (err) {
      setProfileErr((err as AxiosError<ApiError>).response?.data?.message || "Update failed");
    } finally { setProfileLoading(false); }
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setPetMsg(""); setPetErr(""); setPetLoading(true);
    try {
      const res = await addPet({
        name: newPet.name, species: newPet.species,
        breed: newPet.breed, age: newPet.age === "" ? undefined : newPet.age,
        bio: newPet.bio, imageFile: newPet.imageFile,
      });
      dispatch(setUser(res.data));
      setNewPet(emptyPet()); setPetMsg("Pet added!"); setShowAddPet(false);
    } catch (err) {
      setPetErr((err as AxiosError<ApiError>).response?.data?.message || "Failed to add pet");
    } finally { setPetLoading(false); }
  };

  const handleUpdatePet = async (petId: string) => {
    if (!editPet) return;
    try {
      const res = await updatePet(petId, {
        name: editPet.name, species: editPet.species,
        breed: editPet.breed, age: editPet.age === "" ? undefined : editPet.age,
        bio: editPet.bio, imageFile: editPet.imageFile,
      });
      dispatch(setUser(res.data));
      setEditingPetId(null); setEditPet(null);
    } catch (err) {
      alert((err as AxiosError<ApiError>).response?.data?.message || "Failed to update pet");
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!confirm("Remove this pet?")) return;
    try {
      const res = await deletePet(petId);
      dispatch(setUser(res.data));
    } catch (err) {
      alert((err as AxiosError<ApiError>).response?.data?.message || "Failed to delete pet");
    }
  };

  const startEditPet = (pet: IPet) => {
    setEditingPetId(pet._id);
    setEditPet({
      name: pet.name, species: pet.species,
      breed: pet.breed ?? "", age: pet.age ?? "",
      bio: pet.bio ?? "", imageFile: null, imagePreview: null,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-16">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 h-36 relative">
        <Link
          to="/profile"
          className="absolute top-4 left-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-white/30"
        >
          ← Back to Profile
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {/* Avatar row */}
        <div className="flex items-end gap-4 -mt-14 mb-6">
          {/* Clickable avatar with preview */}
          <div className="shrink-0">
            <ImagePicker
              current={user?.profileImage}
              preview={profileImagePreview}
              onFile={(f, p) => { setProfileImageFile(f); setProfileImagePreview(p); }}
              onClear={() => { setProfileImageFile(null); setProfileImagePreview(null); }}
              size="w-24 h-24"
              shape="rounded-2xl"
              placeholder={user?.name.charAt(0).toUpperCase() ?? "🐾"}
            />
            {profileImagePreview && (
              <p className="text-xs text-purple-500 text-center mt-1">New photo selected</p>
            )}
          </div>
          <div className="pb-6">
            <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-sm text-purple-600 font-medium">@{user?.username}</p>
          </div>
          <div className="ml-auto pb-6 flex gap-4 text-center">
            {[["Pets", user?.pets.length], ["Followers", user?.followers.length], ["Following", user?.following.length]].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-lg font-bold text-gray-900">{val ?? 0}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Edit Profile ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">✏️ Edit Profile</h2>

              {profileMsg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-3 py-2.5 mb-4">✅ {profileMsg}</div>}
              {profileErr && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2.5 mb-4">⚠️ {profileErr}</div>}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input name="name" value={profile.name} onChange={handleProfileChange} placeholder="Your name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                    <input name="username" value={profile.username} onChange={handleProfileChange} placeholder="username" className={`${inputCls} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Bio</label>
                  <textarea name="bio" value={profile.bio} onChange={handleProfileChange}
                    placeholder="Tell the world about you and your pets..." maxLength={300} rows={3}
                    className={`${inputCls} resize-none`} />
                  <p className="text-xs text-gray-400 mt-1 text-right">{profile.bio.length}/300</p>
                </div>

                {/* Profile image picker */}
                <div>
                  <label className={labelCls}>Profile Photo</label>
                  <div className="flex items-center gap-4 mt-1">
                    <ImagePicker
                      current={user?.profileImage}
                      preview={profileImagePreview}
                      onFile={(f, p) => { setProfileImageFile(f); setProfileImagePreview(p); }}
                      onClear={() => { setProfileImageFile(null); setProfileImagePreview(null); }}
                      size="w-16 h-16" shape="rounded-xl"
                    />
                    <p className="text-xs text-gray-400">
                      {profileImagePreview ? "✅ New photo ready to save" : "Click to upload a photo (max 5 MB)"}
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${profile.isPrivate ? "bg-purple-500" : "bg-gray-200"}`}>
                    <input type="checkbox" name="isPrivate" checked={profile.isPrivate} onChange={handleProfileChange} className="sr-only" />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${profile.isPrivate ? "translate-x-5" : ""}`} />
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">Private account</span>
                </label>

                <button type="submit" disabled={profileLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-purple-100">
                  {profileLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Saving...
                    </span>
                  ) : "Save Changes"}
                </button>
              </form>
            </div>
          </div>

          {/* ── Pets ── */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                🐾 My Pets
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">{user?.pets.length ?? 0}</span>
              </h2>
              <button onClick={() => { setShowAddPet((v) => !v); setPetMsg(""); setPetErr(""); }}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-500 px-4 py-2 rounded-xl hover:opacity-90 transition-all shadow-sm">
                {showAddPet ? "✕ Cancel" : "+ Add Pet"}
              </button>
            </div>

            {/* Add pet form */}
            {showAddPet && (
              <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4">New Pet Details</h3>
                {petMsg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-3 py-2 mb-3">✅ {petMsg}</div>}
                {petErr && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-3 py-2 mb-3">⚠️ {petErr}</div>}
                <form onSubmit={handleAddPet} className="space-y-3">
                  {/* Pet image picker */}
                  <div className="flex items-center gap-4">
                    <ImagePicker
                      current={undefined}
                      preview={newPet.imagePreview}
                      onFile={(f, p) => setNewPet((prev) => ({ ...prev, imageFile: f, imagePreview: p }))}
                      onClear={() => setNewPet((prev) => ({ ...prev, imageFile: null, imagePreview: null }))}
                      size="w-20 h-20" shape="rounded-xl"
                      placeholder={SPECIES_EMOJI[newPet.species]}
                    />
                    <p className="text-xs text-gray-400">
                      {newPet.imagePreview ? "✅ Photo selected" : "Upload a pet photo (optional)"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Pet Name *</label>
                      <input value={newPet.name} onChange={(e) => setNewPet((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Buddy" required className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Species *</label>
                      <select value={newPet.species} onChange={(e) => setNewPet((p) => ({ ...p, species: e.target.value as IPet["species"] }))}
                        className={inputCls}>
                        {SPECIES.map((s) => <option key={s} value={s}>{SPECIES_EMOJI[s]} {s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Breed</label>
                      <input value={newPet.breed} onChange={(e) => setNewPet((p) => ({ ...p, breed: e.target.value }))}
                        placeholder="Golden Retriever" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Age (years)</label>
                      <input type="number" value={newPet.age} min={0}
                        onChange={(e) => setNewPet((p) => ({ ...p, age: e.target.value === "" ? "" : Number(e.target.value) }))}
                        placeholder="3" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Pet Bio</label>
                    <textarea value={newPet.bio} onChange={(e) => setNewPet((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="Tell us about your pet..." maxLength={300} rows={2}
                      className={`${inputCls} resize-none`} />
                  </div>
                  <button type="submit" disabled={petLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-sm">
                    {petLoading ? "Uploading..." : "Add Pet 🐾"}
                  </button>
                </form>
              </div>
            )}

            {/* Empty state */}
            {user?.pets.length === 0 && !showAddPet && (
              <div className="bg-white rounded-2xl border border-dashed border-purple-200 p-10 text-center">
                <p className="text-4xl mb-3">🐾</p>
                <p className="text-gray-500 text-sm">No pets yet. Add your first pet!</p>
              </div>
            )}

            {/* Pet cards */}
            {user?.pets.map((pet) => (
              <div key={pet._id} className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
                {editingPetId === pet._id && editPet ? (
                  <div className="p-5 space-y-3">
                    <h4 className="text-sm font-bold text-gray-800 mb-2">Editing {pet.name}</h4>

                    {/* Edit pet image picker */}
                    <div className="flex items-center gap-4">
                      <ImagePicker
                        current={pet.profileImage}
                        preview={editPet.imagePreview}
                        onFile={(f, p) => setEditPet((prev) => prev ? { ...prev, imageFile: f, imagePreview: p } : prev)}
                        onClear={() => setEditPet((prev) => prev ? { ...prev, imageFile: null, imagePreview: null } : prev)}
                        size="w-20 h-20" shape="rounded-xl"
                        placeholder={SPECIES_EMOJI[editPet.species]}
                      />
                      <p className="text-xs text-gray-400">
                        {editPet.imagePreview ? "✅ New photo selected" : "Click to change photo"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Name</label>
                        <input value={editPet.name} onChange={(e) => setEditPet((p) => p ? { ...p, name: e.target.value } : p)}
                          className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Species</label>
                        <select value={editPet.species} onChange={(e) => setEditPet((p) => p ? { ...p, species: e.target.value as IPet["species"] } : p)}
                          className={inputCls}>
                          {SPECIES.map((s) => <option key={s} value={s}>{SPECIES_EMOJI[s]} {s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Breed</label>
                        <input value={editPet.breed} onChange={(e) => setEditPet((p) => p ? { ...p, breed: e.target.value } : p)}
                          className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Age</label>
                        <input type="number" value={editPet.age} min={0}
                          onChange={(e) => setEditPet((p) => p ? { ...p, age: e.target.value === "" ? "" : Number(e.target.value) } : p)}
                          className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Bio</label>
                      <textarea value={editPet.bio} onChange={(e) => setEditPet((p) => p ? { ...p, bio: e.target.value } : p)}
                        maxLength={300} rows={2} className={`${inputCls} resize-none`} />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleUpdatePet(pet._id)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-violet-500 text-white py-2 rounded-xl text-sm font-semibold hover:opacity-90">
                        Save Changes
                      </button>
                      <button onClick={() => { setEditingPetId(null); setEditPet(null); }}
                        className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 p-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                      {pet.profileImage
                        ? <img src={pet.profileImage} alt={pet.name} className="w-full h-full object-cover" />
                        : SPECIES_EMOJI[pet.species]
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900">{pet.name}</p>
                        <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full capitalize">
                          {SPECIES_EMOJI[pet.species]} {pet.species}
                        </span>
                        {pet.age !== undefined && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{pet.age}y</span>
                        )}
                      </div>
                      {pet.breed && <p className="text-sm text-gray-500 mt-0.5">{pet.breed}</p>}
                      {pet.bio && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{pet.bio}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button onClick={() => startEditPet(pet)}
                        className="text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDeletePet(pet._id)}
                        className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;
