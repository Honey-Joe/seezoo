import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "../../redux/slices/categorySlice";
import Modal from "../components/Modal";
import type { Category } from "../../types";
import toast from "react-hot-toast";

interface CategoryForm { name: string; description?: string; icon?: string; }

const Categories = () => {
  const dispatch = useAppDispatch();
  const { categories, loading } = useAppSelector((s) => s.categories);
  const [modal,   setModal]   = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirm, setConfirm] = useState<Category | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryForm>();

  useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

  const openEdit = (c: Category) => {
    setEditing(c);
    setValue("name", c.name);
    setValue("description", c.description ?? "");
    setValue("icon", c.icon ?? "");
    setModal("edit");
  };

  const openAdd = () => { reset(); setEditing(null); setModal("add"); };

  const onSubmit = async (data: CategoryForm) => {
    if (editing) {
      await dispatch(updateCategory({ id: editing._id, data }));
      toast.success("Category updated");
    } else {
      await dispatch(createCategory(data));
      toast.success("Category created");
    }
    setModal(null);
    reset();
  };

  const handleDelete = async () => {
    if (!confirm) return;
    await dispatch(deleteCategory(confirm._id));
    toast.success("Category deleted");
    setConfirm(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Category Management</h2>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 shadow-sm transition-all">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
              No categories yet. Add one!
            </div>
          )}
          {categories.map((c) => (
            <div key={c._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl">
                  {c.icon ?? "🏷️"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                  {c.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.description}</p>}
                  <p className="text-[10px] text-gray-300 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => openEdit(c)}
                  className="text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
                  Edit
                </button>
                <button onClick={() => setConfirm(c)}
                  className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal open={!!modal} onClose={() => { setModal(null); reset(); }} title={modal === "edit" ? "Edit Category" : "Add Category"} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name *</label>
            <input {...register("name", { required: "Name is required" })} placeholder="e.g. Dogs"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea {...register("description")} placeholder="Optional description" rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Icon (emoji)</label>
            <input {...register("icon")} placeholder="🐶"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setModal(null); reset(); }}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90">
              {modal === "edit" ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete Category" size="sm">
        <p className="text-sm text-gray-600 mb-5">Delete <strong>{confirm?.name}</strong>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirm(null)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-semibold">Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default Categories;
