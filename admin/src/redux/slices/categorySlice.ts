import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Category } from "../../types";
import api from "../../services/api";

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = { categories: [], loading: false, error: null };

export const fetchCategories = createAsyncThunk("categories/fetchAll", async () => {
  const res = await api.get<Category[]>("/admin/categories");
  return res.data;
});

export const createCategory = createAsyncThunk(
  "categories/create",
  async (data: { name: string; description?: string; icon?: string }) => {
    const res = await api.post<Category>("/admin/categories", data);
    return res.data;
  }
);

export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ id, data }: { id: string; data: { name: string; description?: string; icon?: string } }) => {
    const res = await api.put<Category>(`/admin/categories/${id}`, data);
    return res.data;
  }
);

export const deleteCategory = createAsyncThunk("categories/delete", async (id: string) => {
  await api.delete(`/admin/categories/${id}`);
  return id;
});

const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending,   (s) => { s.loading = true; })
      .addCase(fetchCategories.fulfilled, (s, a) => { s.loading = false; s.categories = a.payload; })
      .addCase(fetchCategories.rejected,  (s) => { s.loading = false; s.error = "Failed to fetch categories"; })
      .addCase(createCategory.fulfilled,  (s, a) => { s.categories.push(a.payload); })
      .addCase(updateCategory.fulfilled,  (s, a) => {
        const i = s.categories.findIndex((c) => c._id === a.payload._id);
        if (i !== -1) s.categories[i] = a.payload;
      })
      .addCase(deleteCategory.fulfilled,  (s, a) => {
        s.categories = s.categories.filter((c) => c._id !== a.payload);
      });
  },
});

export default categorySlice.reducer;
