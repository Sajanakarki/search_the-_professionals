import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getUserProfile } from "../../shared/config/api";
import "./profile.css";

type UserProfile = {
  _id: string;
  username: string;
  email?: string;
  phone?: string;
  address?: string;
  education?: string;
  certificates?: string[];
  experience?: string;
  skills?: string[];
  avatarUrl?: string;
  title?: string;
  summary?: string;
  hourlyRate?: number | null;
  availability?: string;
  locationText?: string;
};

export default function Profile() {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation() as { state?: { user?: Partial<UserProfile> } };
  const stateUser = (location.state?.user as UserProfile) || null;

  const [data, setData] = useState<UserProfile | null>(stateUser);
  const [loading, setLoading] = useState<boolean>(!stateUser);
  const [error, setError] = useState<string | null>(null);

  const userId = useMemo(() => {
    if (stateUser?._id) return stateUser._id;
    if (paramId) return paramId;
    try {
      const raw = localStorage.getItem("currentUser");
      return raw ? JSON.parse(raw)?._id : undefined;
    } catch {
      return undefined;
    }
  }, [stateUser?._id, paramId]);

  useEffect(() => {
    if (!userId) {
      setError("No user id provided.");
      setLoading(false);
      return;
    }
    if (stateUser) return;

    setLoading(true);
    getUserProfile(userId)
      .then((r) => setData(r.data as UserProfile))
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [userId, stateUser]);

  const goHome = () => navigate("/home");
  const goEdit = () => data && navigate(`/profile/${data._id}/edit`, { state: { user: data } });

  if (loading) return <main className="p-page"><div className="card"><p>Loading…</p></div></main>;
  if (error || !data) return <main className="p-page"><div className="card"><p>{error || "No profile found."}</p></div></main>;

  
  const initials = useMemo(() => {
    const name = data?.username?.trim() || "";
    if (!name) return "";
    return name
      .split(/\s+/)        
      .map((n) => n[0])    
      .slice(0, 2)        
      .join("")
      .toUpperCase();
  }, [data?.username]);

  return (
    <main className="p-page">
      <div className="top-actions">
        <button className="btn ghost" onClick={goHome}>Back to Home</button>
        <button className="btn pill" onClick={goEdit}>Edit Profile</button>
      </div>

      
      <section className="card header-card row">
        <div className="avatar-big name-in" aria-hidden>
          <span className="avatar-name">{initials}</span> 
        </div>

        <div className="header-main">
          <h1 className="name">{data.username}</h1>
          <div className="subtitle">{data.title || "—"}</div>
          <div className="meta-line">
            <span>📍 {data.locationText || data.address || "Location not set"}</span>
            <span className="dot">•</span>
            <span>✉️ {data.email || "No email"}</span>
            <span className="dot">•</span>
            <span>📞 {data.phone || "No phone"}</span>
          </div>
          <p className="summary">
            {data.summary || "Add a short bio from Edit Profile so people know you."}
          </p>
        </div>
      </section>

      
      <div className="grid">
        <div className="col">
          {/* Skills */}
          <section className="card">
            <div className="card-title">Skills &amp; Expertise</div>
            <div className="chips">
              {(data.skills?.length ? data.skills : ["No skills yet"]).map((s, i) => (
                <span key={i} className="chip">{s}</span>
              ))}
            </div>
          </section>

          {/* Experience */}
          <section className="card">
            <div className="card-title">Experience</div>
            {data.experience ? (
              <div className="exp-item">
                <div className="exp-role">{data.experience}</div>
                <div className="exp-note muted">Add detailed roles in Edit Profile.</div>
              </div>
            ) : (
              <p className="muted">No experience added yet.</p>
            )}
          </section>
        </div>

        <aside className="col side">
          <section className="card">
            <div className="card-title">Quick Stats</div>
            <ul className="stats">
              <li><span>Hourly Rate</span><strong>{data.hourlyRate ? `$${data.hourlyRate}/hr` : "—"}</strong></li>
              <li><span>Experience</span><strong>{data.experience || "—"}</strong></li>
              <li><span>Availability</span><strong>{data.availability || "—"}</strong></li>
            </ul>
          </section>

          <section className="card">
            <div className="card-title">Education and Certifications</div>
            <div className="certs">
              {data.education ? <div className="edu">{data.education}</div> : <div className="muted">Education not added.</div>}
              <div className="cert-list">
                {(data.certificates?.length ? data.certificates : ["—"]).map((c, i) => (
                  <div key={i} className={`cert ${c === "—" ? "muted" : ""}`}>{c}</div>
                ))}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
