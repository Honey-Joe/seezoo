import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { sendNotification, resetNotification } from "../../redux/slices/notificationSlice";
import toast from "react-hot-toast";

interface NotifForm { title: string; message: string; type: string; }

const Notifications = () => {
  const dispatch = useAppDispatch();
  const { sending, success, error } = useAppSelector((s) => s.notifications);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<NotifForm>({
    defaultValues: { type: "announcement" },
  });

  useEffect(() => {
    if (success) { toast.success("Notification sent to all users!"); reset(); dispatch(resetNotification()); }
    if (error)   { toast.error(error); dispatch(resetNotification()); }
  }, [success, error, dispatch, reset]);

  const onSubmit = (data: NotifForm) => dispatch(sendNotification(data));

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Send Notification</h2>
        <p className="text-sm text-gray-500">Broadcast an announcement to all Seezoo users.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
            <select {...register("type")}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
              <option value="announcement">📢 Announcement</option>
              <option value="update">🆕 Platform Update</option>
              <option value="maintenance">🔧 Maintenance</option>
              <option value="promotion">🎉 Promotion</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title *</label>
            <input {...register("title", { required: "Title is required" })}
              placeholder="e.g. New Feature Available!"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message *</label>
            <textarea {...register("message", { required: "Message is required", minLength: { value: 10, message: "Min 10 characters" } })}
              placeholder="Write your announcement here..."
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
            {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
          </div>

          {/* Preview */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="text-xs font-semibold text-purple-600 mb-2">📱 Preview</p>
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xs font-bold text-gray-800">🐾 Seezoo</p>
              <p className="text-xs text-gray-600 mt-0.5">Your notification will appear here</p>
            </div>
          </div>

          <button type="submit" disabled={sending}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-purple-100">
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending...
              </span>
            ) : "Send to All Users 🔔"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Notifications;
