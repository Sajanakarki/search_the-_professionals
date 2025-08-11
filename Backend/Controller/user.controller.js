import User from "../models/user.model.js";

/* ---------- helpers ---------- */
const toNumberOrUnset = (val) => {
  if (val === "" || val === null || typeof val === "undefined") return { unset: true };
  const n = Number(val);
  return Number.isNaN(n) ? { unset: true } : { value: n };
};

/* =========================
   LIST + SEARCH (unchanged)
========================= */
export async function getUserList(req, res) {
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
    const users = await User.find({
      $or: [{ username: regex }, { email: regex }],
    }).select("-password");

    res.status(200).json({ message: `Found ${users.length} users matching "${query}"`, users });
  } catch (error) {
    res.status(500).json({ message: "Server error during user search", error: error.message });
  }
}

/* =========================
   PROFILE VIEW
========================= */
// GET /user/profile/:id
export async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -__v")
      .lean({ virtuals: true }); // includes alias 'certificates'

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load profile" });
  }
}

/* =========================
   PROFILE UPDATE (SCALARS)
========================= */
// PATCH /user/profile/:id
// editable: title, summary, phone, address, locationText, avatarUrl, hourlyRate, availability
export async function updateUserProfile(req, res) {
  try {
    const allowed = new Set([
      "phone",
      "address",
      "avatarUrl",
      "title",
      "summary",
      "hourlyRate",
      "availability",
      "locationText",
      // keep these for backward-compat only (string fields). New UI should use *Items* CRUD.
      "education",
      "experience",
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

      if (rawVal === "" || rawVal === null || typeof rawVal === "undefined") {
        $unset[key] = "";
      } else {
        $set[key] = rawVal;
      }
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

/* =========================
   ARRAYS: SKILLS & CERTIFICATES
========================= */
// PATCH /user/profile/:id/arrays
// body: { addCertificates:[], removeCertificates:[], addSkills:[], removeSkills:[] }
export async function updateUserArrays(req, res) {
  try {
    const {
      addCertificates = [],
      removeCertificates = [],
      addSkills = [],
      removeSkills = [],
    } = req.body || {};

    const updateDoc = {};

    if (addCertificates.length) {
      updateDoc.$addToSet = {
        ...(updateDoc.$addToSet || {}),
        certifications: { $each: addCertificates },
      };
    }
    if (removeCertificates.length) {
      updateDoc.$pull = {
        ...(updateDoc.$pull || {}),
        certifications: { $in: removeCertificates },
      };
    }
    if (addSkills.length) {
      updateDoc.$addToSet = {
        ...(updateDoc.$addToSet || {}),
        skills: { $each: addSkills },
      };
    }
    if (removeSkills.length) {
      updateDoc.$pull = {
        ...(updateDoc.$pull || {}),
        skills: { $in: removeSkills },
      };
    }

    if (!Object.keys(updateDoc).length) {
      return res.status(400).json({ message: "No array changes provided" });
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
    res.status(500).json({ message: err.message || "Failed to update arrays" });
  }
}

/* =========================
   EXPERIENCE ITEMS CRUD
   (experienceItems: array of objects)
========================= */
// POST /user/profile/:id/experience
export async function addExperienceItem(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.experienceItems.push({
      title: req.body?.title || "",
      company: req.body?.company || "",
      startDate: req.body?.startDate || null,
      endDate: typeof req.body?.endDate === "undefined" ? null : req.body?.endDate,
      location: req.body?.location || "",
      workMode: req.body?.workMode || "",
      description: req.body?.description || "",
    });

    await user.save();

    const fresh = await User.findById(req.params.id)
      .select("-password -__v")
      .lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to add experience" });
  }
}

// PUT /user/profile/:id/experience/:expId
export async function updateExperienceItem(req, res) {
  try {
    const { id, expId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.experienceItems.id(expId);
    if (!item) return res.status(404).json({ message: "Experience not found" });

    // update only provided fields
    const keys = ["title", "company", "startDate", "endDate", "location", "workMode", "description"];
    for (const k of keys) if (k in (req.body || {})) item[k] = req.body[k];

    await user.save();

    const fresh = await User.findById(id)
      .select("-password -__v")
      .lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update experience" });
  }
}

// DELETE /user/profile/:id/experience/:expId
export async function deleteExperienceItem(req, res) {
  try {
    const { id, expId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.experienceItems.id(expId);
    if (!item) return res.status(404).json({ message: "Experience not found" });

    item.deleteOne();
    await user.save();

    const fresh = await User.findById(id)
      .select("-password -__v")
      .lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete experience" });
  }
}

/* =========================
   EDUCATION ITEMS CRUD
   (educationItems: array of objects)
========================= */
// POST /user/profile/:id/education
export async function addEducationItem(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.educationItems.push({
      degree: req.body?.degree || "",
      school: req.body?.school || "",
      startDate: req.body?.startDate || null,
      endDate: typeof req.body?.endDate === "undefined" ? null : req.body?.endDate,
      location: req.body?.location || "",
      description: req.body?.description || "",
    });

    await user.save();

    const fresh = await User.findById(req.params.id)
      .select("-password -__v")
      .lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to add education" });
  }
}

// PUT /user/profile/:id/education/:eduId
export async function updateEducationItem(req, res) {
  try {
    const { id, eduId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.educationItems.id(eduId);
    if (!item) return res.status(404).json({ message: "Education not found" });

    const keys = ["degree", "school", "startDate", "endDate", "location", "description"];
    for (const k of keys) if (k in (req.body || {})) item[k] = req.body[k];

    await user.save();

    const fresh = await User.findById(id)
      .select("-password -__v")
      .lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update education" });
  }
}

// DELETE /user/profile/:id/education/:eduId
export async function deleteEducationItem(req, res) {
  try {
    const { id, eduId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.educationItems.id(eduId);
    if (!item) return res.status(404).json({ message: "Education not found" });

    item.deleteOne();
    await user.save();

    const fresh = await User.findById(id)
      .select("-password -__v")
      .lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete education" });
  }
}
