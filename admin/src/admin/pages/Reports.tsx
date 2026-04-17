import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { fetchReports, resolveReport, ignoreReport, deleteReportedPost } from "../../redux/slices/reportSlice";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import type { Report } from "../../types";
import toast from "react-hot-toast";

const statusColor: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  ignored:  "bg-gray-100 text-gray-500",
};

const Reports = () => {
  const dispatch = useAppDispatch();
  const { reports, loading, totalPages } = useAppSelector((s) => s.reports);
  const [page,    setPage]    = useState(1);
  const [status,  setStatus]  = useState("");
  const [preview, setPreview] = useState<Report | null>(null);

  useEffect(() => { dispatch(fetchReports({ page, status: status || undefined })); }, [page, status, dispatch]);

  const handle = async (action: "resolve" | "ignore" | "delete", r: Report) => {
    if (action === "resolve") { await dispatch(resolveReport(r._id)); toast.success("Report resolved"); }
    if (action === "ignore")  { await dispatch(ignoreReport(r._id));  toast.success("Report ignored"); }
    if (action === "delete" && r.post) {
      await dispatch(deleteReportedPost({ reportId: r._id, postId: r.post._id }));
      toast.success("Post deleted and report resolved");
    }
    setPreview(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Report Management</h2>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="ignored">Ignored</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {reports.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">No reports found</div>
          )}
          {reports.map((r) => (
            <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4">
              {/* Post thumbnail */}
              <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                {r.post?.images?.[0]
                  ? <img src={r.post.images[0]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">📸</div>
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[r.status]}`}>
                    {r.status}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-0.5">
                  Reported by: <span className="text-purple-600">@{r.reportedBy?.username}</span>
                </p>
                <p className="text-sm text-gray-600 line-clamp-1">Reason: {r.reason}</p>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => setPreview(r)}
                  className="text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
                  View
                </button>
                {r.status === "pending" && (
                  <>
                    <button onClick={() => handle("ignore", r)}
                      className="text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
                      Ignore
                    </button>
                    <button onClick={() => handle("delete", r)}
                      className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                      Delete Post
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Detail modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Report Details" size="md">
        {preview && (
          <div className="space-y-4">
            {preview.post?.images?.[0] && (
              <img src={preview.post.images[0]} alt="" className="w-full aspect-video object-cover rounded-xl" />
            )}
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Reported by:</span> @{preview.reportedBy?.username}</p>
              <p><span className="font-semibold">Reason:</span> {preview.reason}</p>
              <p><span className="font-semibold">Post by:</span> @{preview.post?.user?.username ?? "deleted"}</p>
              {preview.post?.caption && <p><span className="font-semibold">Caption:</span> {preview.post.caption}</p>}
              <p><span className="font-semibold">Status:</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[preview.status]}`}>{preview.status}</span>
              </p>
            </div>
            {preview.status === "pending" && (
              <div className="flex gap-2 pt-2">
                <button onClick={() => handle("ignore", preview)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
                  Ignore
                </button>
                <button onClick={() => handle("resolve", preview)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-semibold">
                  Resolve
                </button>
                <button onClick={() => handle("delete", preview)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-semibold">
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
