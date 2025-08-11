// src/home/Homepage.tsx
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

export default function Homepage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const filteredUsers = search.trim()
    ? users.filter((u) =>
        (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const openProfile = (u: User) => {
    // go to /profile/:id and also pass the user via state (handy for instant render)
    navigate(`/profile/${u._id}`, { state: { user: u } });
  };

  return (
    <div className="homepage-container">
      <header className="top-bar">
        <div className="nav-links">
          <Link to="/jobs" className="job-listing">Job Listing</Link>
          <Link to="/about" className="about-us">About Us</Link>
          <Link to="/contact" className="contact-us">Contact Us</Link>
          <Link to="/post-job" className="post-job">Post Job</Link>
          <Link to="/applications" className="my-applications">My Applications</Link>
          <Link to="/saved-jobs" className="saved-jobs">Saved Jobs</Link>
          <Link to="/profile-settings" className="profile-settings">Profile Settings</Link>
        </div>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>

      <h1 className="home-title">Welcome back Sajana</h1>

      <main>
        <section className="search-section">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-bar"
          />
          {!loading && !err && (
            <div className="result-count">{filteredUsers.length} users found</div>
          )}
        </section>

        {loading && <p style={{ textAlign: "center" }}>Loading users…</p>}
        {err && !loading && <p style={{ textAlign: "center" }}>{err}</p>}

        {!loading && !err && (
          <section className="user-cards">
            {filteredUsers.length === 0 ? (
              <p style={{ textAlign: "center" }}>0 users found</p>
            ) : (
              filteredUsers.map((user) => (
                <div key={user._id} className="user-card">
                  <div>
                    <h3>{user.username}</h3>
                    <p>{user.email || "No email provided"}</p>
                  </div>
                  <button onClick={() => openProfile(user)}>View Profile</button>
                </div>
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}
