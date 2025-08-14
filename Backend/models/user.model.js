import { Schema, model } from "mongoose";
const experienceSchema = new Schema(
  {
    title: { type: String, required: true },        // e.g. "Fullstack Developer"
    company: { type: String, default: "" },         // e.g. "ING Tech"
    startDate: { type: Date, default: null },       // null => unknown
    endDate: { type: Date, default: null },         // null => Present
    location: { type: String, default: "" },        // e.g. "Kathmandu"
    workMode: {
      type: String,
      enum: ["remote", "on site", "hybrid", ""],
      default: ""
    },
    description: { type: String, default: "" }
  },
  { _id: true, timestamps: true }
);

const educationSchema = new Schema(
  {
    degree: { type: String, default: "" },          // e.g. "BSc CSIT"
    school: { type: String, default: "" },          // e.g. "Islington College"
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    location: { type: String, default: "" },
    description: { type: String, default: "" }
  },
  { _id: true, timestamps: true }
);

/* --- User schema --- */
const userSchema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    password: { type: String, required: true },

    // Basic profile
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    locationText: { type: String, default: "" },    
    avatarUrl: { type: String, default: "" },
    title: { type: String, default: "" },      
    summary: { type: String, default: "" },

    // Monetization / availability
    hourlyRate: { type: Number, default: null },
    availability: { type: String, default: "" },

    // Tags
    skills: { type: [String], default: [] },
    certifications: { type: [String], default: [], alias: "certificates" },

    // New structured lists (edit-friendly)
    experienceItems: { type: [experienceSchema], default: [] },
    educationItems: { type: [educationSchema], default: [] },

    education: { type: String, default: "", select: false },
    experience: { type: String, default: "", select: false }
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});
userSchema.set("toObject", { virtuals: true });

const User = model("User", userSchema);
export default User;
