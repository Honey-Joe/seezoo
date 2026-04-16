import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getFeed, toggleLike, addComment, deleteComment } from "../services/postService";
import type { IFeedPost } from "../services/postService";
import type { IComment } from "../types";
import { useAppSelector } from "../store";
import LostFoundSlider from "../components/LostFoundSlider";

/* ── helpers ── */
function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)   return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Post card ── */
const PostCard = ({
  post,
  onUpdate,
}: {
  post: IFeedPost;
  onUpdate: (updated: IFeedPost) => void;
}) => {
  const me = useAppSelector((s) => s.auth.user);
  const [imgIdx,       setImgIdx]       = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText,  setCommentText]  = useState("");
  const [likeLoading,  setLikeLoading]  = useState(false);
  const [commenting,   setCommenting]   = useState(false);
  const [copied,       setCopied]       = useState(false);

  const user = post.user;
  if (!user) return null;

  // Use the first tagged pet's image if available, otherwise fall back to user profile image
  const taggedPet = (post.petTags ?? []).length > 0
    ? user.pets?.find((p) => post.petTags.includes(p._id))
    : undefined;
  const avatarImage   = taggedPet?.profileImage ?? user.profileImage;
  const avatarFallback = taggedPet?.name?.charAt(0).toUpperCase() ?? user.name.charAt(0).toUpperCase();

  const liked       = me ? (post.likes ?? []).includes(me._id) : false;
  const likeCount   = (post.likes ?? []).length;
  const commentCount = (post.comments ?? []).length;

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      await toggleLike(post._id);
      const updatedLikes = liked
        ? (post.likes ?? []).filter((id) => id !== me!._id)
        : [...(post.likes ?? []), me!._id];
      onUpdate({ ...post, likes: updatedLikes });
    } finally { setLikeLoading(false); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commenting) return;
    setCommenting(true);
    try {
      const res = await addComment(post._id, commentText.trim());
      onUpdate(res.data);
      setCommentText("");
    } finally { setCommenting(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(post._id, commentId);
    onUpdate({ ...post, comments: (post.comments ?? []).filter((c) => c._id !== commentId) });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post._id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to={`/u/${user.username}`}>
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {avatarImage
              ? <img src={avatarImage} alt="" className="w-full h-full object-cover" />
              : avatarFallback}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/u/${user.username}`}>
            <p className="text-sm font-bold text-gray-900 hover:underline truncate">{user.name}</p>
          </Link>
          <p className="text-xs text-gray-400">@{user.username} · {timeAgo(post.createdAt)}</p>
        </div>
        {post.location && (
          <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {post.location}
          </span>
        )}
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div className="relative bg-gray-100 aspect-square overflow-hidden">
          <img src={post.images[imgIdx]} alt="" className="w-full h-full object-cover" />
          {post.images.length > 1 && (
            <>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {post.images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? "bg-white scale-125" : "bg-white/50"}`} />
                ))}
              </div>
              {imgIdx > 0 && (
                <button onClick={() => setImgIdx((i) => i - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all">‹</button>
              )}
              {imgIdx < post.images.length - 1 && (
                <button onClick={() => setImgIdx((i) => i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all">›</button>
              )}
            </>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-4">
        {/* Like */}
        <button onClick={handleLike} disabled={likeLoading}
          className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${liked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>{likeCount > 0 ? likeCount : ""}</span>
        </button>

        {/* Comment */}
        <button onClick={() => setShowComments((v) => !v)}
          className={`flex items-center gap-1.5 text-sm font-semibold transition-all ${showComments ? "text-purple-600" : "text-gray-400 hover:text-purple-500"}`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>{commentCount > 0 ? commentCount : ""}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-purple-500 transition-all ml-auto">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span className="text-xs">{copied ? "Copied!" : "Share"}</span>
        </button>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 py-2">
          <p className="text-sm text-gray-800 leading-relaxed">
            <Link to={`/u/${user.username}`} className="font-bold text-gray-900 mr-1 hover:underline">{user.username}</Link>
            {post.caption}
          </p>
        </div>
      )}

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-3 border-t border-gray-50 mt-2 pt-3 space-y-3">
          {(post.comments ?? []).length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No comments yet. Be the first!</p>
          )}
          {(post.comments ?? []).map((c: IComment) => (
            <div key={c._id} className="flex items-start gap-2">
              <Link to={`/u/${c.user.username}`}>
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-purple-300 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {c.user.profileImage
                    ? <img src={c.user.profileImage} alt="" className="w-full h-full object-cover" />
                    : c.user.name.charAt(0).toUpperCase()}
                </div>
              </Link>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs font-bold text-gray-800">
                  <Link to={`/u/${c.user.username}`} className="hover:underline">{c.user.username}</Link>
                </p>
                <p className="text-xs text-gray-700 mt-0.5">{c.text}</p>
              </div>
              {me && (me._id === c.user._id || me._id === post.user?._id) && (
                <button onClick={() => handleDeleteComment(c._id)}
                  className="text-gray-300 hover:text-red-400 transition-colors mt-1 shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Add comment */}
          {post.commentsEnabled && me && (
            <form onSubmit={handleComment} className="flex items-center gap-2 mt-2">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {me.profileImage
                  ? <img src={me.profileImage} alt="" className="w-full h-full object-cover" />
                  : me.name.charAt(0).toUpperCase()}
              </div>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button type="submit" disabled={!commentText.trim() || commenting}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 disabled:opacity-40 transition-colors px-1">
                Post
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
};

/* ── Skeleton ── */
const PostSkeleton = () => (
  <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden animate-pulse">
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-full bg-purple-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-2.5 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
    <div className="aspect-square bg-purple-50" />
    <div className="px-4 py-3 space-y-2">
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  </div>
);

const SLIDER_EVERY = 5;

const Feed = () => {
  const [posts,   setPosts]   = useState<IFeedPost[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef  = useRef(false);
  const pageRef     = useRef(1);

  const loadPage = useCallback(async (p: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await getFeed(p);
      setPosts((prev) => p === 1 ? res.data.posts : [...prev, ...res.data.posts]);
      setHasMore(res.data.hasMore);
      pageRef.current = p;
    } catch { /* silent */ }
    finally {
      loadingRef.current = false;
      setLoading(false);
      setInitial(false);
    }
  }, []);

  useEffect(() => { loadPage(1); }, []); // eslint-disable-line

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingRef.current) {
          loadPage(pageRef.current + 1);
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadPage]);

  const handleUpdate = (updated: IFeedPost) =>
    setPosts((prev) => prev.map((p) => p._id === updated._id ? updated : p));

  const items: Array<{ type: "post"; post: IFeedPost } | { type: "slider"; key: string }> = [];
  posts.forEach((post, i) => {
    items.push({ type: "post", post });
    if ((i + 1) % SLIDER_EVERY === 0) items.push({ type: "slider", key: `slider-${i}` });
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24 lg:pb-6 space-y-4">
      <Link to="/new-post"
        className="flex items-center gap-3 bg-white rounded-2xl border border-purple-100 shadow-sm px-4 py-3 hover:border-purple-300 transition-colors group">
        <div className="flex-1 text-sm text-gray-400 group-hover:text-gray-600 transition-colors">
          Share a moment with your pets... 🐾
        </div>
        <span className="bg-gradient-to-r from-purple-600 to-violet-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl">Post</span>
      </Link>

      {initial && [...Array(3)].map((_, i) => <PostSkeleton key={i} />)}

      {!initial && items.map((item) =>
        item.type === "slider"
          ? <LostFoundSlider key={item.key} />
          : <PostCard key={item.post._id} post={item.post} onUpdate={handleUpdate} />
      )}

      {!initial && posts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🐾</p>
          <p className="text-gray-500 font-semibold mb-2">No posts yet</p>
          <p className="text-gray-400 text-sm mb-6">Be the first to share a pet moment!</p>
          <Link to="/new-post"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-500 text-white text-sm font-bold px-6 py-3 rounded-xl hover:opacity-90 shadow-md">
            + Create Post
          </Link>
        </div>
      )}

      {loading && !initial && [...Array(2)].map((_, i) => <PostSkeleton key={`sk-${i}`} />)}
      <div ref={sentinelRef} className="h-4" />
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-xs text-gray-400 py-4">You're all caught up 🐾</p>
      )}
    </div>
  );
};

export default Feed;
