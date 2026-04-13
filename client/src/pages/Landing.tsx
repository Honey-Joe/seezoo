import { Link } from "react-router-dom";
import { useAppSelector } from "../store";

/* ─── data ───────────────────────────────────── */
const FLOATING_PETS = [
  { emoji: "🐶", size: "text-6xl", top: "12%",  left: "6%",  delay: "float-delay-1" },
  { emoji: "🐱", size: "text-5xl", top: "20%",  left: "88%", delay: "float-delay-2" },
  { emoji: "🐰", size: "text-4xl", top: "65%",  left: "4%",  delay: "float-delay-3" },
  { emoji: "🐦", size: "text-5xl", top: "75%",  left: "92%", delay: "float-delay-4" },
  { emoji: "🐠", size: "text-4xl", top: "40%",  left: "3%",  delay: "float-delay-5" },
  { emoji: "🦎", size: "text-4xl", top: "50%",  left: "94%", delay: "float-delay-6" },
  { emoji: "🐹", size: "text-3xl", top: "82%",  left: "14%", delay: "float-delay-7" },
  { emoji: "🦜", size: "text-3xl", top: "30%",  left: "91%", delay: "float-delay-8" },
  { emoji: "🐾", size: "text-4xl", top: "88%",  left: "80%", delay: "float-delay-2" },
  { emoji: "🐢", size: "text-3xl", top: "8%",   left: "78%", delay: "float-delay-5" },
  { emoji: "🐇", size: "text-3xl", top: "58%",  left: "89%", delay: "float-delay-1" },
  { emoji: "🦩", size: "text-4xl", top: "15%",  left: "18%", delay: "float-delay-6" },
];

const FEATURES = [
  {
    emoji: "📸",
    title: "Share Pet Moments",
    desc: "Post unlimited photos of your pets. Add captions, location tags, and pet profiles. Every snap deserves the spotlight.",
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    textColor: "text-purple-600",
  },
  {
    emoji: "❤️",
    title: "Like & Comment",
    desc: "React to adorable posts from pet owners worldwide. Share the love, leave comments, and make new furry friends.",
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50",
    border: "border-pink-100",
    textColor: "text-pink-600",
  },
  {
    emoji: "🔍",
    title: "Lost & Found",
    desc: "Lost your pet? Report it instantly. Found a stray? Help reunite them. Our community-powered board saves lives.",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
    textColor: "text-amber-600",
  },
  {
    emoji: "🐾",
    title: "Every Pet Welcome",
    desc: "Dogs, cats, birds, rabbits, fish, reptiles — if it has paws, wings, fins, or scales, it belongs here.",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    textColor: "text-emerald-600",
  },
  {
    emoji: "🏅",
    title: "Pet Profiles",
    desc: "Give each of your pets their own profile — name, breed, age, bio, and a growing gallery of memories.",
    color: "from-indigo-500 to-blue-500",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    textColor: "text-indigo-600",
  },
  {
    emoji: "🌍",
    title: "Global Community",
    desc: "Connect with millions of pet lovers across the world. Follow, be followed, and grow your pet's fanbase.",
    color: "from-fuchsia-500 to-purple-600",
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-100",
    textColor: "text-fuchsia-600",
  },
];

const PET_TYPES = [
  { emoji: "🐶", name: "Dogs",     count: "2.4M+" },
  { emoji: "🐱", name: "Cats",     count: "1.9M+" },
  { emoji: "🐦", name: "Birds",    count: "380K+" },
  { emoji: "🐰", name: "Rabbits",  count: "210K+" },
  { emoji: "🐠", name: "Fish",     count: "140K+" },
  { emoji: "🦎", name: "Reptiles", count: "95K+"  },
  { emoji: "🐹", name: "Hamsters", count: "160K+" },
  { emoji: "🦜", name: "Parrots",  count: "75K+"  },
];

const STATS = [
  { num: "5M+",  label: "Pet Owners",    emoji: "👥" },
  { num: "12M+", label: "Photos Shared", emoji: "📸" },
  { num: "800+", label: "Pets Reunited", emoji: "🎉" },
  { num: "50+",  label: "Pet Species",   emoji: "🌍" },
];

const STEPS = [
  { num: "1", emoji: "✍️", title: "Create Your Account", desc: "Sign up in seconds — no credit card, no hassle. Just you and your pet." },
  { num: "2", emoji: "🐾", title: "Build Pet Profiles",  desc: "Add your pets with photos, breed info, and a fun bio. Multiple pets welcome!" },
  { num: "3", emoji: "📸", title: "Share & Connect",     desc: "Post moments, follow other pets, comment, like, and grow your community." },
];

const MARQUEE_ITEMS = [
  "🐶 Buddy · 2K followers",
  "🐱 Luna · 18K followers",
  "🐰 Coco · 4.5K followers",
  "🦜 Kiwi · 890 followers",
  "🐠 Nemo · 1.2K followers",
  "🐶 Max · 34K followers",
  "🐱 Mittens · 9K followers",
  "🦎 Spike · 3.1K followers",
  "🐹 Peanut · 2.4K followers",
  "🐦 Tweety · 5.6K followers",
  "🐰 Floppy · 7K followers",
  "🐶 Charlie · 11K followers",
];

const FAKE_POSTS = [
  { emoji: "🐶", name: "Max",    owner: "@maxthegolden",  caption: "Golden hour with my golden boy 🌅",   likes: 847,  comments: 34 },
  { emoji: "🐱", name: "Luna",   owner: "@lunathecat",    caption: "Monday mood 😒",                       likes: 2341, comments: 89 },
  { emoji: "🐰", name: "Coco",   owner: "@cocovibes",     caption: "Binkying into the weekend! 🐰💕",      likes: 612,  comments: 41 },
  { emoji: "🦜", name: "Kiwi",   owner: "@kiwisays",      caption: "I said what I said. Good morning! 🦜", likes: 1208, comments: 67 },
];

/* ─── notification bubbles ───────────────────── */
const NOTIFS = [
  { text: "Luna just posted 📸", delay: "delay-700",  pos: "top-[22%] left-[8%]"  },
  { text: "Max got 500 likes ❤️", delay: "delay-1200", pos: "top-[35%] right-[6%]" },
  { text: "Kiwi is trending 🔥",  delay: "delay-1500", pos: "top-[62%] left-[6%]"  },
  { text: "Pet reunited! 🎉",     delay: "delay-2000", pos: "top-[70%] right-[5%]" },
];

/* ─── component ──────────────────────────────── */
const Landing = () => {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="overflow-x-hidden">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 25%, #6d28d9 50%, #7c3aed 75%, #4f46e5 100%)",
          backgroundSize: "300% 300%",
          animation: "gradient-shift 8s ease infinite",
        }}>

        {/* Mesh grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "40px 40px" }} />

        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-400 rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-300 rounded-full opacity-15 blur-3xl" />

        {/* Floating pet emojis */}
        {FLOATING_PETS.map((p, i) => (
          <span
            key={i}
            className={`absolute select-none pointer-events-none ${p.size} animate-float ${p.delay} opacity-70`}
            style={{ top: p.top, left: p.left }}
          >
            {p.emoji}
          </span>
        ))}

        {/* Notification bubbles */}
        {NOTIFS.map((n, i) => (
          <div
            key={i}
            className={`hidden lg:flex absolute items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg animate-fade-in ${n.delay} ${n.pos}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
            {n.text}
          </div>
        ))}

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white/90 text-xs font-bold px-4 py-1.5 rounded-full mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            The #1 Social Network for Pets
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-extrabold text-white leading-[1.05] mb-6 animate-fade-in-up">
            Your Pet Deserves{" "}
            <span className="relative inline-block">
              <span style={{
                background: "linear-gradient(90deg, #f9a8d4, #c084fc, #60a5fa, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundSize: "200%",
                animation: "gradient-shift 3s ease infinite",
              }}>
                The Spotlight
              </span>
            </span>
          </h1>

          {/* Sub */}
          <p className="text-lg sm:text-xl text-violet-200 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200">
            Share adorable moments, connect with pet lovers worldwide, tag your pets, and help reunite lost animals —
            all in one beautiful community built for every paw, claw, fin & feather.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-400">
            {user ? (
              <Link
                to="/profile"
                className="animate-pulse-glow bg-white text-purple-700 font-extrabold px-8 py-4 rounded-2xl text-base shadow-2xl hover:scale-105 transition-transform"
              >
                🐾 Go to My Profile
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="animate-pulse-glow bg-white text-purple-700 font-extrabold px-8 py-4 rounded-2xl text-base shadow-2xl hover:scale-105 transition-transform"
                >
                  🐾 Join Free — It's Paw-some!
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-white/40 text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-white/10 backdrop-blur transition-all hover:scale-105"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Trust chips */}
          <div className="flex flex-wrap justify-center gap-3 mt-8 animate-fade-in delay-800">
            {["No ads 🚫", "Free forever 🎁", "All pets welcome 🐾", "Safe community 🛡️"].map((t) => (
              <span key={t} className="text-xs text-violet-200 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle flex flex-col items-center gap-1">
          <span className="text-white/50 text-xs">Scroll to explore</span>
          <svg className="w-5 h-5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MARQUEE STRIP
      ══════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 py-3 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap gap-12">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="text-white/90 text-sm font-semibold shrink-0 flex items-center gap-2">
              {item}
              <span className="text-white/30 mx-2">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          STATS
      ══════════════════════════════════════════ */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div key={i} className={`text-center animate-count-up delay-${(i + 1) * 200}`}>
              <div className="text-4xl mb-2">{s.emoji}</div>
              <div className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
                {s.num}
              </div>
              <div className="text-sm text-gray-500 font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-purple-50 to-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-purple-100 text-purple-600 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
              Everything You Need
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Built for Every Pet Owner
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              A full-featured platform purpose-built for the pet community — from daily photo sharing to emergency lost pet alerts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`group relative ${f.bg} border ${f.border} rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
              >
                {/* gradient accent line */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {f.emoji}
                </div>
                <h3 className="font-extrabold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAKE POSTS SHOWCASE
      ══════════════════════════════════════════ */}
      <section className="bg-gray-950 py-20 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-white mb-3">
              See What's Trending 🔥
            </h2>
            <p className="text-gray-400">Real moments from pet owners just like you</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FAKE_POSTS.map((p, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-900/20 transition-all duration-300 group">
                {/* Fake image area */}
                <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-7xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                  {p.emoji}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {p.emoji}
                    </div>
                    <span className="text-xs text-gray-400 font-semibold">{p.owner}</span>
                  </div>
                  <p className="text-white text-xs line-clamp-2 mb-3">{p.caption}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">❤️ {p.likes.toLocaleString()}</span>
                    <span className="flex items-center gap-1">💬 {p.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PET TYPES
      ══════════════════════════════════════════ */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-emerald-100 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
              All Are Welcome
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Every Pet Has a Home Here 🏡
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              We've built a space that celebrates the astounding diversity of the animal companions we share our lives with.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PET_TYPES.map((p, i) => (
              <div key={i}
                className="group bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-2xl p-6 text-center hover:bg-gradient-to-br hover:from-purple-100 hover:to-violet-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">
                  {p.emoji}
                </div>
                <p className="font-extrabold text-gray-900 mb-1">{p.name}</p>
                <p className="text-xs text-purple-500 font-semibold">{p.count} posts</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
              Start in 3 Simple Steps
            </h2>
            <p className="text-gray-500">Get your pet's social profile live in under 2 minutes.</p>
          </div>

          <div className="relative">
            {/* connecting line */}
            <div className="hidden lg:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-purple-200 via-violet-300 to-indigo-200" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {STEPS.map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="relative mb-5">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex flex-col items-center justify-center shadow-xl shadow-purple-200">
                      <span className="text-3xl">{s.emoji}</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-purple-200 flex items-center justify-center text-xs font-extrabold text-purple-600 shadow-sm">
                      {s.num}
                    </div>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LOST & FOUND CALLOUT
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 py-16 px-4">
        {/* Background emojis */}
        <div className="absolute inset-0 opacity-10 flex flex-wrap gap-12 p-12 text-5xl pointer-events-none overflow-hidden">
          {["🔍","🐶","🐱","🏅","🙏","📍"].map((e, i) => (
            <span key={i}>{e}</span>
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider border border-white/30">
              🚨 Critical Feature
            </span>
            <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
              Lost & Found —<br />Because Every Pet Matters
            </h2>
            <p className="text-orange-100 text-base leading-relaxed mb-6">
              Our community-powered Lost & Found board lets you instantly report a missing pet with photos, location, and contact info.
              Found a stray? Post it and help reunite them. We've helped over <strong className="text-white">800 pets</strong> get home safely.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/lost-found"
                className="flex items-center gap-2 bg-white text-orange-600 font-bold px-6 py-3 rounded-xl hover:scale-105 shadow-lg transition-all">
                🔍 View Lost Pets
              </Link>
              <Link to="/lost-found-seeall"
                className="flex items-center gap-2 border-2 border-white/40 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-all">
                📋 See All Listings
              </Link>
            </div>
          </div>

          {/* Fake listing card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-float-alt">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 flex items-center gap-3 border-b border-orange-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-xl font-bold text-white shadow">
                🔍
              </div>
              <div>
                <p className="font-extrabold text-gray-900 text-sm">Missing Pet Alert</p>
                <p className="text-xs text-red-500 font-semibold animate-pulse">🚨 Posted 2 hours ago</p>
              </div>
              <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">LOST</span>
            </div>
            <div className="p-4 flex gap-3">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-4xl shrink-0">🐶</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-gray-900 text-lg">Buddy</h4>
                <p className="text-xs text-gray-500 mb-2">Golden Retriever · 3 years · Male · Golden fur</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                  <span>📍</span> Last seen near Central Park
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-600 text-[11px] font-bold px-2 py-0.5 rounded-full">🏅 $200 Reward</span>
                  <span className="bg-blue-50 text-blue-600 text-[11px] font-bold px-2 py-0.5 rounded-full">📞 Call Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24 px-4"
        style={{
          background: "linear-gradient(135deg, #1e1b4b, #4c1d95, #7c3aed, #6d28d9)",
          backgroundSize: "300% 300%",
          animation: "gradient-shift 10s ease infinite",
        }}>

        {/* Spinning ring decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5 animate-spin-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/8 animate-spin-slow pointer-events-none" style={{ animationDirection: "reverse", animationDuration: "14s" }} />

        {/* Floating pets */}
        <span className="absolute top-8 left-12 text-5xl animate-float float-delay-1 opacity-40 select-none">🐶</span>
        <span className="absolute top-16 right-16 text-4xl animate-float float-delay-3 opacity-40 select-none">🐱</span>
        <span className="absolute bottom-12 left-20 text-4xl animate-float-alt float-delay-5 opacity-30 select-none">🐾</span>
        <span className="absolute bottom-8 right-12 text-5xl animate-float float-delay-2 opacity-40 select-none">🐰</span>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-4 animate-bounce-subtle">🐾</div>
          <h2 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-6">
            Your Pet's
            <span style={{
              background: "linear-gradient(90deg, #f9a8d4, #c084fc, #93c5fd)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}> Social Journey </span>
            Starts Now
          </h2>
          <p className="text-violet-200 text-lg mb-10 max-w-xl mx-auto">
            Join millions of pet owners who are already sharing, connecting, and making memories. It's free, it's fun, and it's all about the animals we love.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link to="/profile"
                className="animate-pulse-glow bg-white text-purple-700 font-extrabold px-10 py-4 rounded-2xl text-lg shadow-2xl hover:scale-105 transition-transform">
                🐾 Go to My Profile
              </Link>
            ) : (
              <>
                <Link to="/register"
                  className="animate-pulse-glow bg-white text-purple-700 font-extrabold px-10 py-4 rounded-2xl text-lg shadow-2xl hover:scale-105 transition-transform">
                  🐾 Create Free Account
                </Link>
                <Link to="/login"
                  className="border-2 border-white/40 text-white font-bold px-10 py-4 rounded-2xl text-lg hover:bg-white/10 transition-all hover:scale-105">
                  Already have an account? Sign in →
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="bg-gray-950 text-gray-500 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="text-white font-extrabold text-lg">Seezoo</span>
            <span className="text-gray-600 text-sm">— The Pet Social Network</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/lost-found" className="hover:text-white transition-colors">Lost & Found</Link>
            <Link to="/register"   className="hover:text-white transition-colors">Join Free</Link>
            <Link to="/login"      className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <p className="text-xs text-gray-700">© {new Date().getFullYear()} Seezoo · Made with 🐾</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
