import api from "./api";
import type { IUser, IPet } from "../types";

export const updateProfile = (data: {
  name?: string;
  username?: string;
  bio?: string;
  isPrivate?: boolean;
  imageFile?: File | null;
}) => {
  const form = new FormData();
  if (data.name)              form.append("name", data.name);
  if (data.username)          form.append("username", data.username);
  if (data.bio !== undefined) form.append("bio", data.bio);
  if (data.isPrivate !== undefined) form.append("isPrivate", String(data.isPrivate));
  if (data.imageFile)         form.append("profileImage", data.imageFile);
  return api.put<IUser>("/user/profile", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const addPet = (data: Omit<IPet, "_id"> & { imageFile?: File | null }) => {
  const form = new FormData();
  form.append("name", data.name);
  form.append("species", data.species);
  if (data.breed)             form.append("breed", data.breed);
  if (data.age !== undefined) form.append("age", String(data.age));
  if (data.bio)               form.append("bio", data.bio);
  if (data.imageFile)         form.append("petImage", data.imageFile);
  return api.post<IUser>("/user/pets", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updatePet = (
  petId: string,
  data: Partial<Omit<IPet, "_id">> & { imageFile?: File | null }
) => {
  const form = new FormData();
  if (data.name)              form.append("name", data.name);
  if (data.species)           form.append("species", data.species);
  if (data.breed !== undefined) form.append("breed", data.breed);
  if (data.age !== undefined) form.append("age", String(data.age));
  if (data.bio !== undefined) form.append("bio", data.bio);
  if (data.imageFile)         form.append("petImage", data.imageFile);
  return api.put<IUser>(`/user/pets/${petId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deletePet = (petId: string) =>
  api.delete<IUser>(`/user/pets/${petId}`);
