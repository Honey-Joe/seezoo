import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { fetchUsers, blockUser, unblockUser, deleteUser } from "../../redux/slices/userSlice";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import type { User } from "../../types";
import toast from "react-hot-toast";

const Users = () => {
  const dispatch = useAppDispatch();
  const { users, loading, totalPages } = useAppSelector((s) => s.users);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");
  const [confirm, setConfirm] = useState<{ type: "block" | "delete"; user: User } | null>(null);

  const load = (p = page) => dispatch(fetchUsers({ page: p, search: search || undefined, status: status || undefined }));

  useEffect(() => { load(1); setPage(1); }, [search, status]); // eslint-disable-line
  useEffect(() => { load(); }, [page]); // eslint-disable-line

  const handleBlock = async (u: User) => {
    const action = u.isBlocked ? unblockUser : blockUser;
    await dispatch(action(u._id));
    toast.success(u.isBlocked ? "User unblocked" : "User blocked");
    setConfirm(null);
  };

  const handleDelete = async (u: User) => {
    await dispatch(deleteUser(u._id));
    toast.success("User deleted");
    setConfirm(null);
  };

  const columns = [
    {
      key: "user", label: "User",
      render: (u: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {u.profileImage ? <img src={u.profileImage} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
            <p className="text-xs text-gray-400">@{u.username}</p>
          </div>
        </div>
      ),
    },
    { key: "email", label: "Email", render: (u: User) => <span className="text-sm text-gray-600">{u.email}</span> },
    {
      key: "status", label: "Status",
      render: (u: User) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          u.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        }`}>
          {u.isBlocked ? "Blocked" : "Active"}
        </span>
      ),
    },
    { key: "pets",      label: "Pets",      render: (u: User) => <span className="text-sm">{u.pets?.length ?? 0}</span> },
    { key: "followers", label: "Followers",  render: (u: User) => <span className="text-sm">{u.followers?.length ?? 0}</span> },
    {
      key: "createdAt", label: "Joined",
      render: (u: User) => <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: "actions", label: "Actions",
      render: (u: User) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setConfirm({ type: "block", user: u })}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              u.isBlocked
                ? "bg-green-50 text-green-600 hover:bg-green-100"
                : "bg-amber-50 text-amber-600 hover:bg-amber-100"
            }`}>
            {u.isBlocked ? "Unblock" : "Block"}
          </button>
          <button onClick={() => setConfirm({ type: "delete", user: u })}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">User Management</h2>
        <div className="flex items-center gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 w-64" />
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <Table columns={columns as never} data={users as never} loading={loading} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Confirm modal */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.type === "delete" ? "Delete User" : confirm?.user?.isBlocked ? "Unblock User" : "Block User"} size="sm">
        <p className="text-sm text-gray-600 mb-5">
          {confirm?.type === "delete"
            ? `Are you sure you want to permanently delete ${confirm.user.name}?`
            : confirm?.user?.isBlocked
              ? `Unblock ${confirm?.user?.name}? They will regain access.`
              : `Block ${confirm?.user?.name}? They won't be able to log in.`
          }
        </p>
        <div className="flex gap-3">
          <button onClick={() => setConfirm(null)}
            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => confirm?.type === "delete" ? handleDelete(confirm.user) : handleBlock(confirm!.user)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all ${
              confirm?.type === "delete" ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"
            }`}>
            Confirm
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
