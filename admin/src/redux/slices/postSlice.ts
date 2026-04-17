import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Post, PaginatedResponse } from "../../types";
import api from "../../services/api";

interface PostState {
  posts: Post[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: PostState = { posts: [], total: 0, totalPages: 1, loading: false, error: null };

export const fetchPosts = createAsyncThunk(
  "posts/fetchAll",
  async (params: { page?: number; date?: string }) => {
    const res = await api.get<PaginatedResponse<Post>>("/admin/posts", { params });
    return res.data;
  }
);

export const deletePost = createAsyncThunk("posts/delete", async (postId: string) => {
  await api.delete(`/admin/posts/${postId}`);
  return postId;
});

const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchPosts.fulfilled, (s, a) => {
        s.loading = false;
        s.posts = a.payload.data;
        s.total = a.payload.total;
        s.totalPages = a.payload.totalPages;
      })
      .addCase(fetchPosts.rejected,  (s) => { s.loading = false; s.error = "Failed to fetch posts"; })
      .addCase(deletePost.fulfilled, (s, a) => {
        s.posts = s.posts.filter((p) => p._id !== a.payload);
      });
  },
});

export default postSlice.reducer;
