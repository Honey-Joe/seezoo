import api from "./api";
import type { IPost, IComment } from "../types";

export interface CreatePostPayload {
  images: File[];
  caption?: string;
  location?: string;
  petTags: string[];
  commentsEnabled: boolean;
}

export interface IFeedPost extends Omit<IPost, "user"> {
  user: { _id: string; name: string; username: string; profileImage?: string; pets?: { _id: string; profileImage?: string; name: string }[] } | null;
}

export const createPost = (payload: CreatePostPayload) => {
  const form = new FormData();
  payload.images.forEach((f) => form.append("images", f));
  if (payload.caption)  form.append("caption", payload.caption);
  if (payload.location) form.append("location", payload.location);
  form.append("petTags", JSON.stringify(payload.petTags));
  form.append("commentsEnabled", String(payload.commentsEnabled));
  return api.post<IPost>("/posts", form, { headers: { "Content-Type": "multipart/form-data" } });
};

export const getMyPosts    = ()                          => api.get<IFeedPost[]>("/posts/my");
export const getUserPosts  = (userId: string)            => api.get<IFeedPost[]>(`/posts/user/${userId}`);
export const getFeed       = (page: number, limit = 10)  =>
  api.get<{ posts: IFeedPost[]; page: number; totalPages: number; hasMore: boolean }>(
    `/posts/feed?page=${page}&limit=${limit}`
  );

export const toggleLike    = (postId: string)            => api.post<{ liked: boolean; likeCount: number }>(`/posts/${postId}/like`);
export const addComment    = (postId: string, text: string) => api.post<IFeedPost>(`/posts/${postId}/comments`, { text });
export const deleteComment = (postId: string, commentId: string) => api.delete(`/posts/${postId}/comments/${commentId}`);
