import api from "./api";
import type { IUser, IPublicUser, IPet, IFollowRequester } from "../types";

export const updateProfile = (data: {
  name?: string; username?: string; bio?: string;
  isPrivate?: boolean; imageFile?: File | null;
}) => {
  const form = new FormData();
  if (data.name)              form.append("name", data.name);
  if (data.username)          form.append("username", data.username);
  if (data.bio !== undefined) form.append("bio", data.bio);
  if (data.isPrivate !== undefined) form.append("isPrivate", String(data.isPrivate));
  if (data.imageFile)         form.append("profileImage", data.imageFile);
  return api.put<IUser>("/user/profile", form, { headers: { "Content-Type": "multipart/form-data" } });
};

export const addPet = (data: Omit<IPet, "_id"> & { imageFile?: File | null }) => {
  const form = new FormData();
  form.append("name", data.name);
  form.append("species", data.species);
  if (data.breed)             form.append("breed", data.breed);
  if (data.age !== undefined) form.append("age", String(data.age));
  if (data.bio)               form.append("bio", data.bio);
  if (data.imageFile)         form.append("petImage", data.imageFile);
  return api.post<IUser>("/user/pets", form, { headers: { "Content-Type": "multipart/form-data" } });
};

export const updatePet = (petId: string, data: Partial<Omit<IPet, "_id">> & { imageFile?: File | null }) => {
  const form = new FormData();
  if (data.name)                form.append("name", data.name);
  if (data.species)             form.append("species", data.species);
  if (data.breed !== undefined) form.append("breed", data.breed);
  if (data.age !== undefined)   form.append("age", String(data.age));
  if (data.bio !== undefined)   form.append("bio", data.bio);
  if (data.imageFile)           form.append("petImage", data.imageFile);
  return api.put<IUser>(`/user/pets/${petId}`, form, { headers: { "Content-Type": "multipart/form-data" } });
};

export const deletePet              = (petId: string)      => api.delete<IUser>(`/user/pets/${petId}`);
export const followUser             = (userId: string)     => api.post(`/user/${userId}/follow`);
export const unfollowUser           = (userId: string)     => api.post(`/user/${userId}/unfollow`);
export const removeFollower         = (userId: string)     => api.post(`/user/${userId}/remove-follower`);
export const acceptFollowRequest    = (userId: string)     => api.post(`/user/${userId}/follow-requests/accept`);
export const declineFollowRequest   = (userId: string)     => api.post(`/user/${userId}/follow-requests/decline`);
export const getFollowers           = (userId: string)     => api.get<IFollowRequester[]>(`/user/${userId}/followers`);
export const getFollowing           = (userId: string)     => api.get<IFollowRequester[]>(`/user/${userId}/following`);
export const getUserProfile         = (usernameOrId: string) => api.get<IPublicUser>(`/user/${usernameOrId}`);
export const searchUsers            = (q: string)          => api.get<IPublicUser[]>(`/user/search?q=${encodeURIComponent(q)}`);
export const getUserById            = (userId: string)     => api.get<{ _id: string; name: string; username: string; profileImage?: string }>(`/user/id/${userId}`);
