import api from "./api";
import type { IPost } from "../types";

export interface CreatePostPayload {
  images: File[];
  caption?: string;
  location?: string;
  petTags: string[];          // pet _id strings
  commentsEnabled: boolean;
}

export const createPost = (payload: CreatePostPayload) => {
  const form = new FormData();
  payload.images.forEach((f) => form.append("images", f));
  if (payload.caption) form.append("caption", payload.caption);
  if (payload.location) form.append("location", payload.location);
  form.append("petTags", JSON.stringify(payload.petTags));
  form.append("commentsEnabled", String(payload.commentsEnabled));
  return api.post<IPost>("/posts", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getMyPosts = () => api.get<IPost[]>("/posts/my");
