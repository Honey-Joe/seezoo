import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { fetchPosts, deletePost } from "../../redux/slices/postSlice";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import type { Post } from "../../types";
import toast from "react-hot-toast";

const Posts = () => {
  const dispatch = useAppDispatch();
  const { posts, loading, totalPages } = useAppSelector((s) => s.posts);
  const [page,    setPage]    = useState(1);
  const [date,    setDate]    = useState("");
  const [preview, setPreview] = useState<Post | null>(null);
  const [confirm, setConfirm] = useState<Post | null>(null);

  useEffect(() => { dispatch(fetchPosts({ page, date: date || undefined })); }, [page, date, dispatch]);

  const handleDelete = async () => {
    if (!confirm) return;
    await dispatch(deletePost(confirm._id));
    toast.success("Post deleted");
    setConfirm(null);
    setPreview(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Post Management</h2>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {posts.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400 text-sm">No posts found</div>
          )}
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
              <div className="relative aspect-square bg-gray-100 cursor-pointer" onClick={() => setPreview(post)}>
                {post.images[0]
                  ? <img src={post.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-4xl">📸</div>
                }
                {post.images.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    +{post.images.length - 1}
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {post.user?.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 truncate">{post.user?.username ?? "deleted"}</p>
                </div>
                {post.caption && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{post.caption}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>❤️ {post.likes?.length ?? 0}</span>
                    <span>💬 {post.comments?.length ?? 0}</span>
                  </div>
                  <button onClick={() => setConfirm(post)}
                    className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Post detail modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Post Details" size="lg">
        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {preview.images.map((img, i) => (
                <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-xl" />
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-gray-700">User:</span> @{preview.user?.username ?? "deleted"}</p>
              {preview.caption && <p><span className="font-semibold text-gray-700">Caption:</span> {preview.caption}</p>}
              {preview.location && <p><span className="font-semibold text-gray-700">Location:</span> {preview.location}</p>}
              <p><span className="font-semibold text-gray-700">Likes:</span> {preview.likes?.length ?? 0}</p>
              <p><span className="font-semibold text-gray-700">Comments:</span> {preview.comments?.length ?? 0}</p>
              <p><span className="font-semibold text-gray-700">Posted:</span> {new Date(preview.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={() => { setConfirm(preview); setPreview(null); }}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
              Delete This Post
            </button>
          </div>
        )}
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete Post" size="sm">
        <p className="text-sm text-gray-600 mb-5">Are you sure you want to permanently delete this post?</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirm(null)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-semibold">Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default Posts;
