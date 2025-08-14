import { useEffect, useState } from "react";
import "./Homepage.css";
import { getUserListApi } from "../../shared/config/api";
import { useNavigate, Link } from "react-router-dom";

interface User {
  _id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

/** Inline CL brand badge*/
function CLBadge() {
  return (
    <svg
      className="cl-badge"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="clGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8d6e63" />
          <stop offset="100%" stopColor="#bcaaa4" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#clGrad)" />
      <circle cx="24" cy="24" r="22" fill="none" stroke="#e8e1db" strokeWidth="1.5" />
      <text
        x="24"
        y="28"
        textAnchor="middle"
        fontFamily="Segoe UI, system-ui, -apple-system, Roboto, Arial, sans-serif"
        fontWeight="900"
        fontSize="16"
        fill="#ffffff"
      >
        CL
      </text>
    </svg>
  );
}

export default function Homepage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Job hero fields
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");

  const navigate = useNavigate();

  // Remove any global overlays from other pages (keeps background uniform)
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "kill-global-overlays";
    style.textContent = `
      html::before, html::after,
      body::before, body::after {
        content: none !important;
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.getElementById("kill-global-overlays")?.remove();
  }, []);

  // Load users
  useEffect(() => {
    setLoading(true);
    setErr(null);
    getUserListApi()
      .then((res) => {
        const list = Array.isArray(res.data?.users) ? res.data.users : [];
        setUsers(list);
      })
      .catch((e) => {
        console.error("Users API ERROR:", e?.response?.status, e?.response?.data || e.message);
        setErr("Could not load users");
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Username-only filtering
  const filteredUsers = search.trim()
    ? users.filter((user) =>
        user.username?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const openProfile = (u: User) => {
    navigate(`/profile/${u._id}`, { state: { user: u } });
  };

  // Navigate to jobs listing with query params (called when pressing Enter)
  const submitJobSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = jobTitle.trim().replace(/\s+/g, " ");
    const loc = location.trim().replace(/\s+/g, " ");
    if (!title && !loc) return;

    const params = new URLSearchParams();
    if (title) params.set("title", title);
    if (loc) params.set("location", loc);

    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="homepage-container">
      <div className="cl-fixed-badge">
        <CLBadge />
      </div>

      {/* Top Bar */}
      <header className="top-bar" role="navigation" aria-label="Primary">
        <div className="nav-links">
          <Link to="/jobs">Job Listing</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/post-job">Post Job</Link>
          <Link to="/applications">My Applications</Link>
          <Link to="/saved-jobs">Saved Jobs</Link>
          <Link to="/profile-settings">Profile Settings</Link>
        </div>
        <button onClick={handleLogout} className="logout-button" aria-label="Logout">
          Logout
        </button>
      </header>

      {/* Welcome */}
      <section className="welcome-section" aria-label="Welcome">
        <div className="welcome-text">
          <h1 className="home-title">Welcome to CareerLink</h1>
          <p className="welcome-subtitle">Find your next career opportunity today.</p>
        </div>
      </section>

      {/* Job Search Hero */}
      <section className="job-hero" aria-label="Job search">
        <form className="job-form no-button" onSubmit={submitJobSearch}>
          <div className="field">
            <label htmlFor="jobTitle">Job Title</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-1.41 1.41l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
                  />
                </svg>
              </span>
              <input
                id="jobTitle"
                type="text"
                className="job-input with-icon"
                placeholder="e.g., Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                autoComplete="off"
                inputMode="search"
                enterKeyHint="search"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="loc">Location</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"
                  />
                </svg>
              </span>
              <input
                id="loc"
                type="text"
                className="job-input with-icon"
                placeholder="e.g., Kathmandu or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                autoComplete="off"
                enterKeyHint="search"
              />
            </div>
          </div>
        </form>
      </section>

      {/* User directory search */}
      <section className="search-section" aria-label="Search users">
        <input
          type="text"
          placeholder="Search users by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-bar"
          aria-label="Search users by name"
        />
        {!loading && !err && (
          <div className="result-count">{filteredUsers.length} users found</div>
        )}
      </section>

      
      <main>
        {loading && <p className="center-text">Loading users…</p>}
        {err && !loading && <p className="center-text error">{err}</p>}

        {!loading && !err && (
          <section className="user-cards" aria-live="polite">
            {filteredUsers.length === 0 ? (
              <p className="center-text muted">0 users found</p>
            ) : (
              filteredUsers.map((user) => (
                <article key={user._id} className="user-card">
                  <div className="card-head">
                    <div className="avatar-initial" aria-hidden="true">
                      {user.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 title={user.username}>{user.username}</h3>
                      <p>{user.email || "No email provided"}</p>
                    </div>
                  </div>
                  <button onClick={() => openProfile(user)}>View Profile</button>
                </article>
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}
