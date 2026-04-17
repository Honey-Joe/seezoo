import { useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { fetchDashboardStats } from "../../redux/slices/dashboardSlice";
import StatCard from "../components/StatCard";

const COLORS = ["#7c3aed", "#a78bfa", "#f59e0b", "#ef4444"];

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { stats, loading } = useAppSelector((s) => s.dashboard);

  useEffect(() => { dispatch(fetchDashboardStats()); }, [dispatch]);

  const barData = stats ? [
    { name: "Users",   value: stats.totalUsers },
    { name: "Pets",    value: stats.totalPets },
    { name: "Posts",   value: stats.totalPosts },
    { name: "Reports", value: stats.totalReports },
  ] : [];

  const pieData = stats ? [
    { name: "Users",   value: stats.totalUsers },
    { name: "Posts",   value: stats.totalPosts },
    { name: "Reports", value: stats.totalReports },
  ] : [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Dashboard Overview</h2>
        <p className="text-sm text-gray-500">Welcome back! Here's what's happening on Seezoo.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Users"   value={stats?.totalUsers   ?? 0} icon="👥" color="bg-purple-100" sub={`+${stats?.newUsersThisWeek ?? 0} this week`} />
        <StatCard label="Total Pets"    value={stats?.totalPets    ?? 0} icon="🐾" color="bg-violet-100" />
        <StatCard label="Total Posts"   value={stats?.totalPosts   ?? 0} icon="📸" color="bg-amber-100"  sub={`+${stats?.newPostsThisWeek ?? 0} this week`} />
        <StatCard label="Total Reports" value={stats?.totalReports ?? 0} icon="🚨" color="bg-red-100" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Platform Overview</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
              <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Content Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
