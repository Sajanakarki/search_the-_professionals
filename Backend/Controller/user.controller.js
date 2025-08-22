import User from "../models/user.model.js";

const toNumberOrUnset = (val) => {
  if (val === "" || val === null || typeof val === "undefined") return { unset: true };
  const n = Number(val);
  return Number.isNaN(n) ? { unset: true } : { value: n };
};
const cleanStr = (v, max = 1000) => (typeof v === "string" ? v.trim().slice(0, max) : v);
const parseMaybeDate = (v) => {
  if (v === "" || v === null || typeof v === "undefined") return null;
  const s = String(v);
  const iso = s.length === 7 ? `${s}-01` : s;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export async function getUserList(_req, res) {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ message: "User list fetched successfully", users });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

export async function searchUsers(req, res) {
  const { query } = req.query;
  if (!query || query.trim() === "") {
    return res.status(400).json({ message: "Search query is required" });
  }
  try {
    const regex = new RegExp(query, "i");
    const users = await User.find({ $or: [{ username: regex }, { email: regex }] }).select("-password");
    res.status(200).json({ message: `Found ${users.length} users matching "${query}"`, users });
  } catch (error) {
    res.status(500).json({ message: "Server error during user search", error: error.message });
  }
}

export async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-password -__v").lean({ virtuals: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load profile" });
  }
}

export async function updateUserProfile(req, res) {
  try {
    const allowed = new Set([
      "username",
      "phone",
      "address",
      "avatarUrl",
      "title",
      "summary",
      "hourlyRate",
      "availability",
      "jobType",
      "locationText",
      "education",
      "experience",
      "skills",
      "certifications",
      "certificates",
      // if you want to allow arrays too, add:
      "experienceItems",
      "educationItems",
    ]);

    const $set = {};
    const $unset = {};

    for (const [key, rawVal] of Object.entries(req.body || {})) {
      if (!allowed.has(key)) continue;

      if (key === "hourlyRate") {
        const parsed = toNumberOrUnset(rawVal);
        if (parsed.unset) $unset[key] = "";
        else $set[key] = parsed.value;
        continue;
      }

      if (key === "skills" || key === "certifications" || key === "certificates") {
        const arr = Array.isArray(rawVal) ? rawVal.map((s) => cleanStr(s, 120)).filter(Boolean) : [];
        if (key === "certificates") {
          if (arr.length) $set["certifications"] = arr;
          else $unset["certifications"] = "";
        } else {
          if (arr.length) $set[key] = arr;
          else $unset[key] = "";
        }
        continue;
      }

      if (key === "experienceItems" || key === "educationItems") {
        const arr = Array.isArray(rawVal) ? rawVal : [];
        const norm = arr.map((x) => ({
          ...x,
          startDate: x.startDate ? parseMaybeDate(x.startDate) : null,
          endDate: x.endDate ? parseMaybeDate(x.endDate) : null,
        }));
        $set[key] = norm;
        continue;
      }

      const v = cleanStr(rawVal);
      if (v === "" || v === null || typeof v === "undefined") $unset[key] = "";
      else $set[key] = v;
    }

    const updateDoc = {};
    if (Object.keys($set).length) updateDoc.$set = $set;
    if (Object.keys($unset).length) updateDoc.$unset = $unset;
    if (!Object.keys(updateDoc).length) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateDoc, {
      new: true,
      runValidators: true,
    })
      .select("-password -__v")
      .lean({ virtuals: true });

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update profile" });
  }
}

/* Arrays diff endpoint (skills/certifications) stays as you had */
export async function updateUserArrays(req, res) {
  try {
    const {
      addCertificates,
      removeCertificates,
      addSkills,
      removeSkills,
      certificatesAdd,
      certificatesRemove,
      skillsAdd,
      skillsRemove,
    } = req.body || {};

    const clean = (arr) => (arr || []).map(String).map((s) => cleanStr(s, 120)).filter(Boolean);
    const addCerts = clean(addCertificates || certificatesAdd);
    const remCerts = clean(removeCertificates || certificatesRemove);
    const addSk = clean(addSkills || skillsAdd);
    const remSk = clean(removeSkills || skillsRemove);

    const updateDoc = {};
    if (addCerts.length) updateDoc.$addToSet = { ...(updateDoc.$addToSet || {}), certifications: { $each: addCerts } };
    if (remCerts.length) updateDoc.$pull = { ...(updateDoc.$pull || {}), certifications: { $in: remCerts } };
    if (addSk.length) updateDoc.$addToSet = { ...(updateDoc.$addToSet || {}), skills: { $each: addSk } };
    if (remSk.length) updateDoc.$pull = { ...(updateDoc.$pull || {}), skills: { $in: remSk } };

    if (!Object.keys(updateDoc).length) return res.status(400).json({ message: "No array changes provided" });

    const user = await User.findByIdAndUpdate(req.params.id, updateDoc, {
      new: true,
      runValidators: true,
    })
      .select("-password -__v")
      .lean({ virtuals: true });

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update arrays" });
  }
}

/* Experience CRUD (unchanged from yours) */
export async function addExperienceItem(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.experienceItems.push({
      title: cleanStr(req.body?.title, 140) || "",
      company: cleanStr(req.body?.company, 140) || "",
      startDate: parseMaybeDate(req.body?.startDate),
      endDate: typeof req.body?.endDate === "undefined" ? null : parseMaybeDate(req.body?.endDate),
      location: cleanStr(req.body?.location, 140) || "",
      workMode: cleanStr(req.body?.workMode, 40) || "",
      description: cleanStr(req.body?.description, 2000) || "",
    });

    await user.save();
    const fresh = await User.findById(req.params.id).select("-password -__v").lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to add experience" });
  }
}
export async function updateExperienceItem(req, res) {
  try {
    const { id, expId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.experienceItems.id(expId);
    if (!item) return res.status(404).json({ message: "Experience not found" });

    const body = req.body || {};
    const map = {
      title: (v) => (item.title = cleanStr(v, 140)),
      company: (v) => (item.company = cleanStr(v, 140)),
      startDate: (v) => (item.startDate = parseMaybeDate(v)),
      endDate: (v) => (item.endDate = parseMaybeDate(v)),
      location: (v) => (item.location = cleanStr(v, 140)),
      workMode: (v) => (item.workMode = cleanStr(v, 40)),
      description: (v) => (item.description = cleanStr(v, 2000)),
    };
    Object.keys(map).forEach((k) => {
      if (k in body) map[k](body[k]);
    });

    await user.save();
    const fresh = await User.findById(id).select("-password -__v").lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update experience" });
  }
}
export async function deleteExperienceItem(req, res) {
  try {
    const { id, expId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.experienceItems.id(expId);
    if (!item) return res.status(404).json({ message: "Experience not found" });

    item.deleteOne();
    await user.save();
    const fresh = await User.findById(id).select("-password -__v").lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete experience" });
  }
}

/* Education CRUD (unchanged from yours) */
export async function addEducationItem(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.educationItems.push({
      degree: cleanStr(req.body?.degree, 140) || "",
      school: cleanStr(req.body?.school, 140) || "",
      startDate: parseMaybeDate(req.body?.startDate),
      endDate: typeof req.body?.endDate === "undefined" ? null : parseMaybeDate(req.body?.endDate),
      location: cleanStr(req.body?.location, 140) || "",
      description: cleanStr(req.body?.description, 2000) || "",
    });

    await user.save();
    const fresh = await User.findById(req.params.id).select("-password -__v").lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to add education" });
  }
}
export async function updateEducationItem(req, res) {
  try {
    const { id, eduId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.educationItems.id(eduId);
    if (!item) return res.status(404).json({ message: "Education not found" });

    const body = req.body || {};
    const map = {
      degree: (v) => (item.degree = cleanStr(v, 140)),
      school: (v) => (item.school = cleanStr(v, 140)),
      startDate: (v) => (item.startDate = parseMaybeDate(v)),
      endDate: (v) => (item.endDate = parseMaybeDate(v)),
      location: (v) => (item.location = cleanStr(v, 140)),
      description: (v) => (item.description = cleanStr(v, 2000)),
    };
    Object.keys(map).forEach((k) => {
      if (k in body) map[k](body[k]);
    });

    await user.save();
    const fresh = await User.findById(id).select("-password -__v").lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update education" });
  }
}
export async function deleteEducationItem(req, res) {
  try {
    const { id, eduId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.educationItems.id(eduId);
    if (!item) return res.status(404).json({ message: "Education not found" });

    item.deleteOne();
    await user.save();
    const fresh = await User.findById(id).select("-password -__v").lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete education" });
  }
}

export async function getProfileOptions(_req, res) {
  res.json({
    availability: ["open", "actively-looking", "not-looking", "unavailable"],
    jobTypes: ["full-time", "part-time", "contract", "internship", "freelance"],
  });
}
