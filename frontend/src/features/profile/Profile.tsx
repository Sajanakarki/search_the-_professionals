import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserListApi } from "../../shared/config/api";

type AppUser = {
  _id: string;
  username: string;
};

export default function Profile() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    getUserListApi()
      .then((res) => setUsers(res.data.users || []))
      .catch(() => setErr("Could not load users."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const openUser = (user: AppUser) => {
    navigate(`/users/${user._id}`, { state: { user } });
  };

  if (loading) return <div style={styles.wrap}><p>Loading...</p></div>;
  if (err) return <div style={styles.wrap}><p>{err}</p></div>;

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <h2>All Users</h2>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>Back</button>
      </div>

      <div style={{ marginBottom: 12, opacity: 0.75 }}>
        {users.length} users found
      </div>

      {users.length === 0 ? (
        <div>No users to show.</div>
      ) : (
        <ul style={styles.list}>
          {users.map((u) => (
            <li key={u._id} style={styles.item}>
              <span style={styles.username}>{u.username}</span>
              <button
                style={styles.viewBtn}
                onClick={() => openUser(u)}
                title={`View ${u.username}'s profile`}
              >
                View Profile
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 720, margin: "32px auto", padding: "0 16px" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtn: { padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", cursor: "pointer" },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 10,
    padding: "12px 14px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
  },
  username: { fontWeight: 600 },
  viewBtn: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
    cursor: "pointer",
    background: "#f7f7f7",
  },
};
 