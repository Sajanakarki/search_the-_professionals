import { useEffect, useMemo, useState } from "react";
import "./Homepage.css";
import { getUserListApi } from "../../shared/config/api";
import { useNavigate, Link } from "react-router-dom";

interface User {
  _id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

export default function Homepage() {
  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Hero search
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");

  const navigate = useNavigate();

  // clean any global overlays
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "kill-global-overlays";
    style.textContent = `
      html::before, html::after,
      body::before, body::after { content: none !important; display: none !important; }
    `;
    document.head.appendChild(style);
    return () => document.getElementById("kill-global-overlays")?.remove();
  }, []);

  // load users
  useEffect(() => {
    setLoading(true);
    setErr(null);
    getUserListApi()
      .then((res) => {
        const list = Array.isArray(res.data?.users) ? res.data.users : [];
        setUsers(list);
      })
      .catch(() => {
        setErr("Could not load users");
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.username || "").toLowerCase().includes(q));
  }, [users, search]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const openProfile = (u: User) => {
    navigate(`/profile/${u._id}`, { state: { user: u } });
  };

  // /jobs?q=...&location=...
  const submitJobSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = jobTitle.trim().replace(/\s+/g, " ");
    const loc = location.trim().replace(/\s+/g, " ");
    const params = new URLSearchParams();
    if (title) params.set("q", title);
    if (loc) params.set("location", loc);
    navigate(params.toString() ? `/jobs?${params}` : "/jobs");
  };

  return (
    <div className="homepage-container">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="nav-links">
          <Link to="/jobs">Job Listing</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/post-job">Post Job</Link>
          <Link to="/applications">My Applications</Link>
          <Link to="/saved-jobs">Saved Jobs</Link>
          <Link to="/profile-settings">Profile Settings</Link>
        </div>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>

      {/* Welcome */}
      <section className="welcome-section">
        <div className="welcome-text">
          <h1 className="home-title">Welcome to CareerLink</h1>
          <p className="welcome-subtitle">Find your next career opportunity today.</p>
        </div>
      </section>

      {/* Hero: search jobs */}
      <section className="hero" aria-label="Job search hero">
        <div className="hero-content">
          <h1>Find your next role</h1>
          <p className="muted">Search thousands of opportunities across Nepal & Remote.</p>

          <form className="hero-form" onSubmit={submitJobSearch}>
            <div className="hero-input">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-1.41 1.41l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/>
                </svg>
              </span>
              <input
                id="jobTitle"
                className="job-input with-icon"
                type="text"
                placeholder="Job title or keywords (e.g., React, .NET)"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="hero-input">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"/>
                </svg>
              </span>
              <input
                id="loc"
                className="job-input with-icon"
                type="text"
                placeholder="Location (e.g., Kathmandu or Remote)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                autoComplete="off"
              />
            </div>

            <button type="submit" className="btn">Search</button>
          </form>

          {/* quick chips */}
          <div className="quick-filters">
            <span className="muted">Popular:</span>
            <Link to="/jobs?q=Frontend">Frontend</Link>
            <Link to="/jobs?q=Backend">Backend</Link>
            <Link to="/jobs?q=QA">QA</Link>
            <Link to="/jobs?type=internship">Internships</Link>
            <Link to="/jobs?location=Remote">Remote</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories">
        <div className="section-head">
          <h2>Browse by category</h2>
        </div>
        <div className="cat-grid">
          <Link className="cat" to="/jobs?q=Software">IT & Software</Link>
          <Link className="cat" to="/jobs?q=Accounting">Finance & Accounting</Link>
          <Link className="cat" to="/jobs?q=Marketing">Marketing</Link>
          <Link className="cat" to="/jobs?q=Design">Design & Creative</Link>
          <Link className="cat" to="/jobs?q=Operations">Operations</Link>
          <Link className="cat" to="/jobs?q=Customer">Customer Support</Link>
        </div>
      </section>

      {/* Featured jobs (static examples) */}
      <section className="featured">
        <div className="section-head">
          <h2>Featured jobs</h2>
          <Link className="see-all" to="/jobs">See all</Link>
        </div>

        <div className="job-grid">
          <article className="job-card">
            <header>
              <h3><Link to="/jobs?q=React">React Frontend Developer</Link></h3>
              <p className="muted">Orva Tech • Kathmandu • Full-time</p>
            </header>
            <ul className="tag-row">
              <li className="tag">React</li><li className="tag">TypeScript</li><li className="tag">Vite</li>
            </ul>
            <footer className="job-actions">
              <Link className="btn" to="/jobs?q=React">View</Link>
              <Link className="btn ghost" to="/saved-jobs">Save</Link>
            </footer>
          </article>

          <article className="job-card">
            <header>
              <h3><Link to="/jobs?q=Node">Node.js Backend Engineer</Link></h3>
              <p className="muted">Himalaya Labs • Lalitpur • Contract</p>
            </header>
            <ul className="tag-row">
              <li className="tag">Node</li><li className="tag">MongoDB</li><li className="tag">REST</li>
            </ul>
            <footer className="job-actions">
              <Link className="btn" to="/jobs?q=Node">View</Link>
              <Link className="btn ghost" to="/saved-jobs">Save</Link>
            </footer>
          </article>

          <article className="job-card">
            <header>
              <h3><Link to="/jobs?q=QA">QA Engineer</Link></h3>
              <p className="muted">CloudNine • Remote • Full-time</p>
            </header>
            <ul className="tag-row">
              <li className="tag">Cypress</li><li className="tag">Playwright</li><li className="tag">API</li>
            </ul>
            <footer className="job-actions">
              <Link className="btn" to="/jobs?q=QA">View</Link>
              <Link className="btn ghost" to="/saved-jobs">Save</Link>
            </footer>
          </article>
        </div>
      </section>

      {/* Users */}
      <section className="people" aria-label="People directory">
        <div className="section-head">
          <h2>People</h2>
          {!loading && !err && <span className="pill-count">{filteredUsers.length}</span>}
        </div>

        {/* search bar for users */}
        <div className="search-row">
          <div className="search-wrap">
            <span className="search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-1.41 1.41l.27.28v.79l5 4.99L20.49 19zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/>
              </svg>
            </span>
            <input
              className="search-bar with-icon"
              placeholder="Search users by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {loading && <p className="center-text muted-text">Loading users…</p>}
        {err && <p className="center-text error">{err}</p>}

        {!loading && !err && (
          <div className="user-cards" aria-live="polite">
            {filteredUsers.length === 0 ? (
              <p className="center-text muted-text">0 users found</p>
            ) : (
              filteredUsers.map((u) => (
                <article key={u._id} className="user-card">
                  <div className="card-head">
                    <div className="avatar-initial">{u.username?.[0]?.toUpperCase() || "U"}</div>
                    <div>
                      <h3 title={u.username}>{u.username}</h3>
                      <p>{u.email || "No email provided"}</p>
                    </div>
                  </div>
                  <button className="btn" onClick={() => openProfile(u)}>View Profile</button>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
