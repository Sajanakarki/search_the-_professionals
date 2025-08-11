import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../shared/config/axiosinstance"; // baseURL = http://localhost:3000/api
import "./editprofile.css";

type UserProfile = {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  education?: string;
  certificates?: string[];
  experience?: string;
  skills?: string[];
  title?: string;
  summary?: string;
};

const emptyProfile: UserProfile = {
  _id: "",
  username: "",
  email: "",
  phone: "",
  address: "",
  education: "",
  experience: "",
  certificates: [],
  skills: [],
  title: "",
  summary: "",
};

export default function EditProfile() {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();

  const [form, setForm] = useState<UserProfile>(emptyProfile);
  const [originalSkills, setOriginalSkills] = useState<string[]>([]);
  const [originalCerts, setOriginalCerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  // pick an id to use
  const userId = useMemo(() => {
    if (paramId) return paramId;
    try {
      const raw = localStorage.getItem("currentUser");
      return raw ? JSON.parse(raw)?._id : undefined;
    } catch {
      return undefined;
    }
  }, [paramId]);

  // load profile
  useEffect(() => {
    if (!userId) {
      setError("No user id. Open this page from a profile.");
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError("");

    // IMPORTANT: axiosInstance already has /api in baseURL → don't prefix /api here
    axiosInstance
      .get(`/user/profile/${userId}`)
      .then((res) => {
        if (!mounted) return;
        const data = res.data as UserProfile;
        const normalized: UserProfile = {
          ...emptyProfile,
          ...data,
          certificates: Array.isArray(data.certificates) ? data.certificates : [],
          skills: Array.isArray(data.skills) ? data.skills : [],
        };
        setForm(normalized);
        setOriginalSkills(normalized.skills || []);
        setOriginalCerts(normalized.certificates || []);
      })
      .catch(() => mounted && setError("Failed to fetch profile"))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleArrayChange = (
    field: "certificates" | "skills",
    index: number,
    value: string
  ) => {
    setForm((f) => {
      const arr = [...(f[field] || [])];
      arr[index] = value;
      return { ...f, [field]: arr };
    });
  };

  const addArrayItem = (field: "certificates" | "skills") => {
    setForm((f) => ({ ...f, [field]: [...(f[field] || []), ""] }));
  };

  const removeArrayItem = (field: "certificates" | "skills", index: number) => {
    setForm((f) => {
      const arr = [...(f[field] || [])];
      arr.splice(index, 1);
      return { ...f, [field]: arr };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form._id) return;

    // basic validation
    if (!form.username || !form.email) {
      alert("Username and email are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // 1) PATCH basic fields (your backend expects PATCH on this endpoint)
      const basicPayload = {
        phone: form.phone?.trim() || "",
        address: form.address?.trim() || "",
        education: form.education?.trim() || "",
        experience: form.experience?.trim() || "",
        title: form.title?.trim() || "",
        summary: form.summary?.trim() || "",
      };
      await axiosInstance.patch(`/user/profile/${form._id}`, basicPayload);

      // 2) PATCH arrays on the dedicated /arrays endpoint (backend expects *Add / *Remove)
      const cleanedSkills = (form.skills || []).map((s) => s.trim()).filter(Boolean);
      const cleanedCerts  = (form.certificates || []).map((c) => c.trim()).filter(Boolean);

      const skillsAdd = cleanedSkills.filter((s) => !originalSkills.includes(s));
      const skillsRemove = originalSkills.filter((s) => !cleanedSkills.includes(s));
      const certificatesAdd = cleanedCerts.filter((c) => !originalCerts.includes(c));
      const certificatesRemove = originalCerts.filter((c) => !cleanedCerts.includes(c));

      if (skillsAdd.length || skillsRemove.length || certificatesAdd.length || certificatesRemove.length) {
        await axiosInstance.patch(`/user/profile/${form._id}/arrays`, {
          skillsAdd,
          skillsRemove,
          certificatesAdd,
          certificatesRemove,
        });
      }

      alert("Profile updated successfully");
      navigate(`/profile/${form._id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Delete endpoint is not implemented on your backend; hide the button to avoid errors.
  const handleDelete = async () => {
    alert("Delete is not available on this backend.");
  };

  if (loading) return <div className="edit-wrap"><div className="card">Loading...</div></div>;
  if (error)   return <div className="edit-wrap"><div className="card error">{error}</div></div>;

  return (
    <div className="edit-wrap">
      <div className="topbar">
        <Link to={`/profile/${form._id}`} className="back-link">Back to Profile</Link>
        <h1>Edit Profile</h1>
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="grid two">
          <div className="field">
            <label>Username</label>
            <input name="username" value={form.username} readOnly />
          </div>
          <div className="field">
            <label>Email</label>
            <input name="email" value={form.email} readOnly />
          </div>
          <div className="field">
            <label>Phone</label>
            <input name="phone" value={form.phone || ""} onChange={handleChange} placeholder="9800000000" />
          </div>
          <div className="field">
            <label>Address</label>
            <input name="address" value={form.address || ""} onChange={handleChange} placeholder="Kathmandu, Nepal" />
          </div>
          <div className="field">
            <label>Title</label>
            <input name="title" value={form.title || ""} onChange={handleChange} placeholder="Full Stack Student" />
          </div>
          <div className="field span2">
            <label>Summary</label>
            <textarea name="summary" rows={3} value={form.summary || ""} onChange={handleChange} placeholder="Short bio..." />
          </div>
          <div className="field">
            <label>Education</label>
            <input name="education" value={form.education || ""} onChange={handleChange} placeholder="BIT (Computing), Islington College" />
          </div>
          <div className="field span2">
            <label>Experience</label>
            <textarea name="experience" rows={4} value={form.experience || ""} onChange={handleChange} placeholder="Summarize your experience here..." />
          </div>
        </div>

        <div className="section-row">
          <h2>Certificates</h2>
          <button type="button" className="btn small" onClick={() => addArrayItem("certificates")}>Add</button>
        </div>
        {(form.certificates || []).map((c, i) => (
          <div className="grid two bordered" key={`cert-${i}`}>
            <div className="field span2">
              <input
                value={c}
                onChange={(e) => handleArrayChange("certificates", i, e.target.value)}
                placeholder="e.g., AWS Cloud Practitioner (2024)"
              />
            </div>
            <div className="span2 right">
              <button type="button" className="btn ghost small" onClick={() => removeArrayItem("certificates", i)}>Remove</button>
            </div>
          </div>
        ))}

        <div className="section-row">
          <h2>Skills</h2>
          <button type="button" className="btn small" onClick={() => addArrayItem("skills")}>Add</button>
        </div>
        {(form.skills || []).map((s, i) => (
          <div className="grid two bordered" key={`skill-${i}`}>
            <div className="field span2">
              <input
                value={s}
                onChange={(e) => handleArrayChange("skills", i, e.target.value)}
                placeholder="e.g., React"
              />
            </div>
            <div className="span2 right">
              <button type="button" className="btn ghost small" onClick={() => removeArrayItem("skills", i)}>Remove</button>
            </div>
          </div>
        ))}

        <div className="actions">
          <Link to={`/profile/${form._id}`} className="btn ghost">Cancel</Link>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" className="btn danger" onClick={handleDelete}>Delete Profile</button>
        </div>
      </form>
    </div>
  );
}
