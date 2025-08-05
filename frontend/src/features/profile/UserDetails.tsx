import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getUserListApi } from "../../shared/config/api";

type AppUser = {
  _id?: string;
  username?: string;
  email?: string;
  // other fields may exist, but we won't render them
};

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // If Profile.tsx navigated with: navigate(`/users/${u._id}`, { state: { user: u } })
  const stateUser = (location.state as any)?.user as AppUser | undefined;

  const [user, setUser] = useState<AppUser | null>(stateUser ?? null);
  const [loading, setLoading] = useState(!stateUser);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (stateUser) return; // already have data

    let cancelled = false;
    (async () => {
      try {
        const res = await getUserListApi();
        const list: AppUser[] = res.data?.users || [];
        const found = list.find((u) => u._id === id);
        if (!cancelled) {
          if (found) setUser(found);
          else setErr("Could not load user.");
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setErr("Could not load user.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, stateUser]);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (err) return <div style={{ padding: 24 }}>{err}</div>;
  if (!user) return <div style={{ padding: 24 }}>No user found.</div>;

  const emailText = user.email && user.email.trim() ? user.email : "No email provided";

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
      <h2>User Profile</h2>
      <div style={{ marginTop: 16, padding: 20, border: "1px solid #e5e5e5", borderRadius: 12 }}>
        <p><b>Username:</b> {user.username || "—"}</p>
        <p><b>Email:</b> {emailText}</p>
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
}
