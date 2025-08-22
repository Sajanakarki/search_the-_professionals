import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import type { AxiosError } from "axios";
import axiosInstance from "../../shared/config/axiosinstance";
import "./editprofile.css";

/* -------- Types -------- */
type Availability = string;
type JobType = string;

type EducationItem = {
  _id: string;
  degree: string;
  school: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
};

type UserProfile = {
  _id: string;
  username: string;
  email: string;

  phone?: string;
  locationText?: string;

  title?: string;
  summary?: string;

  avatarUrl?: string;

  hourlyRate?: number | null;
  availability?: Availability | "";
  jobType?: JobType | "";

  education?: string;
  experience?: string;

  skills?: string[];
  certificates?: string[];
  certifications?: string[];
  educationItems?: EducationItem[];
};

type ProfileOptions = { availability: Availability[]; jobTypes: JobType[] };

type FormValues = {
  username: string;
  email: string;

  phone: string;
  locationText: string;

  title: string;
  summary: string;

  avatarUrl: string;

  hourlyRate: string;
  availability: Availability | "";
  jobType: JobType | "";

  education: string;
  experience: string;

  skills: { value: string }[];
  certificates: { value: string }[];
};

/* -------- Constants / helpers -------- */
const FALLBACK_OPTIONS: ProfileOptions = {
  availability: ["open", "actively-looking", "not-looking", "unavailable"],
  jobTypes: ["full-time", "part-time", "contract", "internship", "freelance"],
};

const NAME_REGEX = /^(?! )[A-Za-z ]{3,50}(?<! )$/;
const PHONE_REGEX = /^\d{10}$/;
const RATE_MIN = 0;
const RATE_MAX = 100000;

const labelize = (s: string) =>
  s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const toMonthInput = (iso?: string | null) => (iso ? String(iso).slice(0, 7) : "");
const monthToDateISO = (m: string) => (m && m.length === 7 ? `${m}-01` : null);

/* ============================= */
/*           Component           */
/* ============================= */
export default function EditProfile() {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();

  const userId = useMemo(() => {
    if (paramId) return paramId;
    try {
      const raw = localStorage.getItem("currentUser");
      return raw ? JSON.parse(raw)?._id : undefined;
    } catch {
      return undefined;
    }
  }, [paramId]);

  const [opts, setOpts] = useState<ProfileOptions>(FALLBACK_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // camera modal
  const [showCam, setShowCam] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // education (structured)
  const [educationItems, setEducationItems] = useState<EducationItem[]>([]);
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [newEdu, setNewEdu] = useState<Omit<EducationItem, "_id">>({
    degree: "",
    school: "",
    location: "",
    startDate: null,
    endDate: null,
    description: "",
  });

  // originals for diffing arrays
  const origSkillsRef = useRef<string[]>([]);
  const origCertsRef = useRef<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      locationText: "",
      title: "",
      summary: "",
      avatarUrl: "",
      hourlyRate: "",
      availability: "",
      jobType: "",
      education: "",
      experience: "",
      skills: [],
      certificates: [],
    },
  });

  const skillsFA = useFieldArray({ control, name: "skills" });
  const certsFA = useFieldArray({ control, name: "certificates" });

  /* options (safe fallback if API fails) */
  useEffect(() => {
    let mounted = true;
    axiosInstance
      .get("/meta/profile-options")
      .then((res) => {
        if (!mounted) return;
        const data = res.data as Partial<ProfileOptions>;
        setOpts({
          availability:
            Array.isArray(data?.availability) && data!.availability!.length
              ? data!.availability!
              : FALLBACK_OPTIONS.availability,
          jobTypes:
            Array.isArray(data?.jobTypes) && data!.jobTypes!.length
              ? data!.jobTypes!
              : FALLBACK_OPTIONS.jobTypes,
        });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  /* load profile */
  useEffect(() => {
    if (!userId) {
      setBanner({ type: "err", text: "No user id. Open this page from a profile." });
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setBanner(null);

    axiosInstance
      .get(`/user/profile/${userId}`)
      .then((res) => {
        if (!mounted) return;
        const raw = res.data as UserProfile;

        const skills = Array.isArray(raw.skills) ? raw.skills : [];
        const certs =
          Array.isArray(raw.certificates)
            ? raw.certificates
            : Array.isArray(raw.certifications)
            ? raw.certifications
            : [];

        origSkillsRef.current = skills;
        origCertsRef.current = certs;

        setAvatarPreview(raw.avatarUrl || null);
        setEducationItems(Array.isArray(raw.educationItems) ? raw.educationItems : []);

        reset({
          username: raw.username || "",
          email: raw.email || "",
          phone: raw.phone || "",
          locationText: raw.locationText || "",
          title: raw.title || "",
          summary: raw.summary || "",
          avatarUrl: raw.avatarUrl || "",
          hourlyRate:
            raw.hourlyRate === null || typeof raw.hourlyRate === "undefined"
              ? ""
              : String(raw.hourlyRate),
          availability: raw.availability || "",
          jobType: raw.jobType || "",
          education: raw.education || "",
          experience: raw.experience || "",
          skills: skills.map((s) => ({ value: s })),
          certificates: certs.map((c) => ({ value: c })),
        });
      })
      .catch((e: AxiosError<any>) => {
        console.error("GET /user/profile/:id failed", e?.response?.status, e?.response?.data);
        setBanner({ type: "err", text: "Failed to fetch profile" });
      })
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, [userId, reset]);

  /* inputs for native pickers */
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const pickFromGallery = () => galleryInputRef.current?.click();
  const openNativeCamera = () => cameraInputRef.current?.click();

  function selectFileCommon(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBanner({ type: "err", text: "Please choose an image file." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBanner({ type: "err", text: "Please choose an image under 5 MB." });
      return;
    }
    setSelectedFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setShowMenu(false);
  }

  const onGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    selectFileCommon(e.target.files?.[0] || undefined);
    e.currentTarget.value = "";
  };
  const onNativeCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    selectFileCommon(e.target.files?.[0] || undefined);
    e.currentTarget.value = "";
  };

  /* camera */
  async function startCamera(facing: "user" | "environment" = "environment") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: false,
      });
      streamRef.current = stream;
      setShowCam(true);
      setShowMenu(false);
    } catch (err) {
      console.error("Camera error:", err);
      openNativeCamera();
    }
  }

  useEffect(() => {
    if (!showCam) return;
    const v = videoRef.current;
    const s = streamRef.current;
    if (!v || !s) return;

    v.setAttribute("playsinline", "true");
    v.muted = true;
    v.autoplay = true;
    v.srcObject = s;

    const tryPlay = async () => {
      try {
        await v.play();
      } catch {}
    };
    if (v.readyState >= 1) tryPlay();
    else {
      const onReady = () => {
        v.removeEventListener("loadedmetadata", onReady);
        tryPlay();
      };
      v.addEventListener("loadedmetadata", onReady);
    }

    return () => {
      try {
        v.pause();
      } catch {}
      v.srcObject = null;
    };
  }, [showCam]);

  function stopCamera() {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
      } catch {}
      v.srcObject = null;
    }
    setShowCam(false);
  }

  async function capturePhoto() {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth || 600, video.videoHeight || 600);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d")!;
    const sx = ((video.videoWidth || size) - size) / 2;
    const sy = ((video.videoHeight || size) - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.92)
    );

    const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
    setSelectedFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    stopCamera();
  }

  // === CHANGED: upload photo via backend route (not direct Cloudinary) ===
  async function saveSelectedPhoto() {
    if (!selectedFile || !userId) return;
    try {
      setUploading(true);
      setBanner(null);

      const fd = new FormData();
      fd.append("file", selectedFile); // key MUST be "file"
      const res = await axiosInstance.post(`/user/profile/${userId}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.avatarUrl as string;
      if (!url) throw new Error("Upload response missing avatarUrl");

      setValue("avatarUrl", url, { shouldDirty: true, shouldValidate: true });
      setAvatarPreview(url);
      setSelectedFile(null); // enables Save Changes
      setBanner({ type: "ok", text: "Photo uploaded successfully." });
    } catch (err: any) {
      console.error(err);
      setBanner({ type: "err", text: err?.response?.data?.message || err?.message || "Image upload failed" });
      setAvatarPreview(getValues("avatarUrl") || null);
    } finally {
      setUploading(false);
    }
  }

  function cancelSelectedPhoto() {
    setSelectedFile(null);
    setAvatarPreview(getValues("avatarUrl") || null);
  }

  const removeAvatar = () => {
    setSelectedFile(null);
    setAvatarPreview(null);
    setValue("avatarUrl", "", { shouldDirty: true, shouldValidate: true });
    setShowMenu(false);
  };

  /* save */
  const onSubmit = handleSubmit(async (v) => {
    if (!userId) return;
    setBanner(null);

    try {
      const hrRaw = (v.hourlyRate ?? "").toString().replace(/[^\d.]/g, "");
      const hr = hrRaw ? Number(hrRaw) : undefined;
      if (typeof hr !== "undefined" && (Number.isNaN(hr) || hr < RATE_MIN || hr > RATE_MAX)) {
        setBanner({ type: "err", text: "Hourly rate looks invalid." });
        return;
      }

      const payload = {
        phone: (v.phone || "").trim(),
        locationText: (v.locationText || "").trim(),
        title: (v.title || "").trim(),
        summary: (v.summary || "").trim(),
        avatarUrl: v.avatarUrl || "",
        hourlyRate: typeof hr === "undefined" ? undefined : hr,
        availability: v.availability || undefined,
        jobType: v.jobType || undefined,
        education: (v.education || "").trim(),
        experience: (v.experience || "").trim(),
      };

      await axiosInstance.patch(`/user/profile/${userId}`, payload);

      const formSkills = v.skills.map((s) => s.value.trim()).filter(Boolean);
      const formCerts = v.certificates.map((c) => c.value.trim()).filter(Boolean);

      const originalSkills = origSkillsRef.current;
      const originalCerts = origCertsRef.current;

      const addSkills = formSkills.filter((s) => !originalSkills.includes(s));
      const removeSkills = originalSkills.filter((s) => !formSkills.includes(s));
      const addCertificates = formCerts.filter((c) => !originalCerts.includes(c));
      const removeCertificates = originalCerts.filter((c) => !formCerts.includes(c));

      if (addSkills.length || removeSkills.length || addCertificates.length || removeCertificates.length) {
        await axiosInstance.patch(`/user/profile/${userId}/arrays`, {
          addSkills,
          removeSkills,
          addCertificates,
          removeCertificates,
        });
      }

      origSkillsRef.current = formSkills;
      origCertsRef.current = formCerts;

      setBanner({ type: "ok", text: "Profile updated successfully." });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update profile";
      console.error("Save failed", e?.response?.data || e);
      setBanner({ type: "err", text: String(msg) });
    }
  });

  const username = getValues("username") || "";
  const initial = username.trim().charAt(0)?.toUpperCase() || "U";

  const onBack = () => {
    const id =
      userId ||
      (() => {
        try { return JSON.parse(localStorage.getItem("currentUser") || "{}")._id; }
        catch { return undefined; }
      })();
    if (id) navigate(`/profile/${id}`, { replace: true });
    else navigate("/home", { replace: true });
  };

  if (loading) return <div className="edit-wrap"><div className="card">Loading…</div></div>;

  return (
    <div className="edit-wrap">
      <div className="topbar">
        <button type="button" className="back-link btn ghost" onClick={onBack}>Back to Profile</button>
        <h1>Edit Profile</h1>
      </div>

      <form className="card form" onSubmit={onSubmit} noValidate>
        {banner && (
          <div className={`alert ${banner.type === "ok" ? "alert-success" : "alert-error"}`} role="alert">
            {banner.text}
          </div>
        )}

        {/* Avatar */}
        <div className="avatar-row">
          <div className="avatar-box">
            {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" /> : <div className="avatar-fallback">{initial}</div>}

            {/* Pencil + menu */}
            <button
              type="button"
              className="avatar-pen"
              title="Change photo"
              onClick={() => setShowMenu(true)}
              aria-haspopup="menu"
              aria-expanded={showMenu}
            >
              ✎
            </button>

            {showMenu && (
              <>
                <button
                  type="button"
                  className="avatar-menu-backdrop"
                  aria-label="Close"
                  onClick={() => setShowMenu(false)}
                />
                <div className="avatar-menu" role="menu">
                  <button type="button" className="menu-item" onClick={pickFromGallery}>Choose from Gallery</button>
                  <button type="button" className="menu-item" onClick={() => startCamera("environment")}>Open Camera</button>
                  <button type="button" className="menu-item danger" onClick={removeAvatar}>Remove Photo</button>
                  <button type="button" className="menu-item ghost" onClick={() => setShowMenu(false)}>Close</button>
                </div>
              </>
            )}
          </div>

          {/* hidden pickers */}
          <input ref={galleryInputRef} type="file" accept="image/*" onChange={onGallerySelect} style={{ display: "none" }} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onNativeCameraCapture} style={{ display: "none" }} />

          {/* Save/Retake after selection */}
          {selectedFile && (
            <div className="preview-actions">
              <span className="muted">{selectedFile.name}</span>
              <button type="button" className="btn small" onClick={saveSelectedPhoto} disabled={uploading}>
                {uploading ? "Uploading…" : "Save Photo"}
              </button>
              <button type="button" className="btn ghost small" onClick={cancelSelectedPhoto}>Retake</button>
            </div>
          )}

          <input type="hidden" {...register("avatarUrl")} />
        </div>

        {/* Main fields */}
        <div className="grid two">
          <div className="field">
            <label>Username</label>
            <input {...register("username")} readOnly />
          </div>
          <div className="field">
            <label>Email</label>
            <input {...register("email")} readOnly />
          </div>

          <div className="field">
            <label>Phone</label>
            <input
              {...register("phone", {
                required: "Phone is required",
                pattern: { value: PHONE_REGEX, message: "Enter a 10-digit mobile number" },
                onChange: (e) => (e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10)),
              })}
              placeholder="9800000000"
            />
            {errors.phone && <small className="error">{errors.phone.message}</small>}
          </div>

          <div className="field">
            <label>Title</label>
            <input
              {...register("title", {
                required: "Title is required",
                pattern: { value: NAME_REGEX, message: "Only letters and spaces (3–50 chars)" },
                onChange: (e) => {
                  e.target.value = e.target.value
                    .replace(/[^A-Za-z ]/g, "")
                    .replace(/\s{2,}/g, " ")
                    .slice(0, 50);
                },
              })}
              placeholder="Software Developer"
            />
            {errors.title && <small className="error">{errors.title.message}</small>}
          </div>

          <div className="field">
            <label>Location</label>
            <input
              {...register("locationText", {
                required: "Location is required",
                minLength: { value: 2, message: "Location is too short" },
              })}
              placeholder="Kathmandu / Remote"
            />
            {errors.locationText && <small className="error">{errors.locationText.message}</small>}
          </div>

          <div className="field span2">
            <label>Summary</label>
            <textarea
              rows={3}
              {...register("summary", {
                required: "Summary is required",
                minLength: { value: 10, message: "Write at least 10 characters" },
                maxLength: { value: 500, message: "Max 500 characters" },
              })}
              placeholder="Short bio..."
            />
            {errors.summary && <small className="error">{errors.summary.message}</small>}
          </div>

          <div className="field">
            <label>Hourly Rate</label>
            <input
              inputMode="decimal"
              placeholder="e.g., 1000"
              {...register("hourlyRate", {
                validate: (v) => {
                  if (!v) return true;
                  const n = Number(v.replace(/[^\d.]/g, ""));
                  if (Number.isNaN(n)) return "Invalid number";
                  if (n < RATE_MIN || n > RATE_MAX) return `Must be between ${RATE_MIN} and ${RATE_MAX}`;
                  return true;
                },
              })}
              onBlur={(e) => {
                const clean = (e.target.value || "").replace(/[^\d.]/g, "");
                e.target.value = clean;
                setValue("hourlyRate", clean, { shouldDirty: true, shouldValidate: true });
              }}
            />
            {errors.hourlyRate && <small className="error">{errors.hourlyRate.message}</small>}
          </div>

          <div className="field">
            <label>Availability</label>
            <select {...register("availability", { required: "Select your availability" })}>
              <option value="">Select…</option>
              {opts.availability.map((v) => (
                <option key={v} value={v}>{labelize(v)}</option>
              ))}
            </select>
            {errors.availability && <small className="error">{errors.availability.message}</small>}
          </div>

          <div className="field">
            <label>Job Type</label>
            <select {...register("jobType", { required: "Select your job type" })}>
              <option value="">Select…</option>
              {opts.jobTypes.map((v) => (
                <option key={v} value={v}>{labelize(v)}</option>
              ))}
            </select>
            {errors.jobType && <small className="error">{errors.jobType.message}</small>}
          </div>

          <div className="field">
            <label>Education (summary)</label>
            <input
              {...register("education", {
                required: "Education summary is required",
                minLength: { value: 3, message: "Too short" },
              })}
              placeholder="BIT (Computing), Islington College"
            />
            {errors.education && <small className="error">{errors.education.message}</small>}
          </div>

          <div className="field span2">
            <label>Experience (summary)</label>
            <textarea
              rows={4}
              {...register("experience", {
                required: "Experience summary is required",
                minLength: { value: 3, message: "Too short" },
              })}
              placeholder="Summarize your experience…"
            />
            {errors.experience && <small className="error">{errors.experience.message}</small>}
          </div>
        </div>

        {/* Certificates */}
        <div className="section-row">
          <h2>Certificates</h2>
          <button type="button" className="btn small" onClick={() => certsFA.append({ value: "" })}>Add</button>
        </div>
        {certsFA.fields.map((f, i) => (
          <div className="grid two bordered" key={f.id}>
            <div className="field span2">
              <input
                {...register(`certificates.${i}.value` as const, {
                  required: "Certificate cannot be empty",
                  minLength: { value: 2, message: "Too short" },
                })}
                placeholder="e.g., AWS Cloud Practitioner (2024)"
              />
              {errors.certificates?.[i]?.value && (
                <small className="error">{errors.certificates[i]?.value?.message as string}</small>
              )}
            </div>
            <div className="span2 right">
              <button type="button" className="btn ghost small" onClick={() => certsFA.remove(i)}>Remove</button>
            </div>
          </div>
        ))}

        {/* Skills */}
        <div className="section-row">
          <h2>Skills</h2>
          <button type="button" className="btn small" onClick={() => skillsFA.append({ value: "" })}>Add</button>
        </div>
        {skillsFA.fields.map((f, i) => (
          <div className="grid two bordered" key={f.id}>
            <div className="field span2">
              <input
                {...register(`skills.${i}.value` as const, {
                  required: "Skill cannot be empty",
                  minLength: { value: 2, message: "Too short" },
                })}
                placeholder="e.g., React"
              />
              {errors.skills?.[i]?.value && (
                <small className="error">{errors.skills[i]?.value?.message as string}</small>
              )}
            </div>
            <div className="span2 right">
              <button type="button" className="btn ghost small" onClick={() => skillsFA.remove(i)}>Remove</button>
            </div>
          </div>
        ))}

        {/* Education list */}
        <div className="section-row">
          <h2>Education</h2>
          {!showAddEdu && <button type="button" className="btn small" onClick={() => setShowAddEdu(true)}>Add</button>}
        </div>

        <div className="edu-list">
          {educationItems.length === 0 && <p className="muted">No education added yet.</p>}

          {educationItems.map((ed) => (
            <div className="edu-card" key={ed._id}>
              <div className="edu-grid">
                <div className="field">
                  <label>Degree</label>
                  <input value={ed.degree} onChange={(e) =>
                    setEducationItems((p) => p.map((x) => (x._id === ed._id ? { ...x, degree: e.target.value } : x)))
                  } />
                </div>
                <div className="field">
                  <label>School</label>
                  <input value={ed.school} onChange={(e) =>
                    setEducationItems((p) => p.map((x) => (x._id === ed._id ? { ...x, school: e.target.value } : x)))
                  } />
                </div>
                <div className="field">
                  <label>Location</label>
                  <input value={ed.location || ""} onChange={(e) =>
                    setEducationItems((p) => p.map((x) => (x._id === ed._id ? { ...x, location: e.target.value } : x)))
                  } />
                </div>
                <div className="field">
                  <label>Start</label>
                  <input type="month" value={toMonthInput(ed.startDate)} onChange={(e) =>
                    setEducationItems((p) => p.map((x) => (x._id === ed._id ? { ...x, startDate: e.target.value || null } : x)))
                  } />
                </div>
                <div className="field">
                  <label>End</label>
                  <div className="end-month-row">
                    <input type="month" value={toMonthInput(ed.endDate)} onChange={(e) =>
                      setEducationItems((p) => p.map((x) => (x._id === ed._id ? { ...x, endDate: e.target.value || null } : x)))
                    } disabled={ed.endDate === null} />
                    <label className="present-check">
                      <input
                        type="checkbox"
                        checked={ed.endDate === null}
                        onChange={(e) =>
                          setEducationItems((p) => p.map((x) => (x._id === ed._id ? { ...x, endDate: e.target.checked ? null : "" } : x)))
                        }
                      />
                      Present
                    </label>
                  </div>
                </div>
                <div className="field span2">
                  <label>Description</label>
                  <textarea rows={3} value={ed.description || ""} onChange={(e) =>
                    setEducationItems((p) => p.map((x) => (x._id === ed._id ? { ...x, description: e.target.value } : x)))
                  } />
                </div>
              </div>

              <div className="mini-actions">
                <button type="button" className="btn small" onClick={async () => {
                  try {
                    const payload = {
                      degree: ed.degree.trim(),
                      school: ed.school.trim(),
                      location: (ed.location || "").trim(),
                      startDate: ed.startDate ? monthToDateISO(ed.startDate) : null,
                      endDate: ed.endDate ? monthToDateISO(ed.endDate) : null,
                      description: (ed.description || "").trim(),
                    };
                    const res = await axiosInstance.put(`/user/profile/${userId}/education/${ed._id}`, payload);
                    setEducationItems(Array.isArray(res.data?.educationItems) ? res.data.educationItems : []);
                    setBanner({ type: "ok", text: "Education saved." });
                  } catch {
                    setBanner({ type: "err", text: "Failed to save education." });
                  }
                }}>Save</button>
                <button type="button" className="btn ghost small danger" onClick={async () => {
                  if (!confirm("Delete this education item?")) return;
                  try {
                    const res = await axiosInstance.delete(`/user/profile/${userId}/education/${ed._id}`);
                    setEducationItems(Array.isArray(res.data?.educationItems) ? res.data.educationItems : []);
                    setBanner({ type: "ok", text: "Education deleted." });
                  } catch {
                    setBanner({ type: "err", text: "Failed to delete education." });
                  }
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Education */}
        {showAddEdu && (
          <div className="edu-card">
            <h3 className="edu-subtitle">Add Education</h3>
            <div className="edu-grid">
              <div className="field">
                <label>Degree *</label>
                <input value={newEdu.degree} onChange={(e) => setNewEdu((o) => ({ ...o, degree: e.target.value }))} />
              </div>
              <div className="field">
                <label>School *</label>
                <input value={newEdu.school} onChange={(e) => setNewEdu((o) => ({ ...o, school: e.target.value }))} />
              </div>
              <div className="field">
                <label>Location</label>
                <input value={newEdu.location} onChange={(e) => setNewEdu((o) => ({ ...o, location: e.target.value }))} />
              </div>
              <div className="field">
                <label>Start</label>
                <input type="month" value={newEdu.startDate || ""} onChange={(e) => setNewEdu((o) => ({ ...o, startDate: e.target.value || null }))} />
              </div>
              <div className="field">
                <label>End</label>
                <div className="end-month-row">
                  <input type="month" value={newEdu.endDate || ""} onChange={(e) => setNewEdu((o) => ({ ...o, endDate: e.target.value || null }))} disabled={newEdu.endDate === null} />
                  <label className="present-check">
                    <input type="checkbox" checked={newEdu.endDate === null} onChange={(e) => setNewEdu((o) => ({ ...o, endDate: e.target.checked ? null : "" }))} />
                    Present
                  </label>
                </div>
              </div>
              <div className="field span2">
                <label>Description</label>
                <textarea rows={3} value={newEdu.description} onChange={(e) => setNewEdu((o) => ({ ...o, description: e.target.value }))} />
              </div>
            </div>

            <div className="mini-actions">
              <button type="button" className="btn small" onClick={async () => {
                if (!userId) return;
                if (!newEdu.degree.trim() || !newEdu.school.trim()) {
                  setBanner({ type: "err", text: "Please enter both Degree and School." });
                  return;
                }
                try {
                  const payload = {
                    degree: newEdu.degree.trim(),
                    school: newEdu.school.trim(),
                    location: newEdu.location.trim(),
                    startDate: newEdu.startDate ? monthToDateISO(newEdu.startDate) : null,
                    endDate: newEdu.endDate ? monthToDateISO(newEdu.endDate) : null,
                    description: newEdu.description.trim(),
                  };
                  const res = await axiosInstance.post(`/user/profile/${userId}/education`, payload);
                  setEducationItems(Array.isArray(res.data?.educationItems) ? res.data.educationItems : []);
                  setShowAddEdu(false);
                  setNewEdu({ degree: "", school: "", location: "", startDate: null, endDate: null, description: "" });
                  setBanner({ type: "ok", text: "Education added." });
                } catch {
                  setBanner({ type: "err", text: "Failed to add education." });
                }
              }}>Add Education</button>
              <button type="button" className="btn ghost small" onClick={() => setShowAddEdu(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Camera modal */}
        {showCam && (
          <div className="cam-backdrop" role="dialog" aria-modal="true">
            <div className="cam-modal">
              <video ref={videoRef} className="cam-video" playsInline muted autoPlay />
              <div className="cam-actions">
                <button type="button" className="btn small" onClick={capturePhoto}>Capture</button>
                <button type="button" className="btn ghost small" onClick={stopCamera}>Close</button>
              </div>
              <div className="cam-switch">
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={async () => {
                    const track = streamRef.current?.getVideoTracks?.()[0];
                    const facing = (track && (track.getSettings?.().facingMode as "user" | "environment")) || "environment";
                    stopCamera();
                    await startCamera(facing === "user" ? "environment" : "user");
                  }}
                >
                  Switch Camera
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="actions">
          <Link to={`/profile/${userId ?? ""}`} className="btn ghost">Cancel</Link>
          <button
            type="submit"
            className="btn"
            disabled={!isValid || isSubmitting || uploading || !!selectedFile}
            title={selectedFile ? "Click Save Photo first" : undefined}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
