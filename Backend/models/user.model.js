import { Schema, model } from "mongoose";

const experienceSchema = new Schema(
  {
    title: { type: String, required: true },
    company: { type: String, default: "" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    location: { type: String, default: "" },
    workMode: { type: String, enum: ["remote", "on site", "hybrid", ""], default: "" },
    description: { type: String, default: "" },
  },
  { _id: true, timestamps: true }
);

const educationSchema = new Schema(
  {
    degree: { type: String, default: "" },
    school: { type: String, default: "" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    location: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: true, timestamps: true }
);

const userSchema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    password: { type: String, required: true },

    // basic profile
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    locationText: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    avatarId:  { type: String, default: "" }, // for replace/delete
    title: { type: String, default: "" },
    summary: { type: String, default: "" },

    hourlyRate: { type: Number, default: null },
    availability: { type: String, default: "" },
    jobType: { type: String, default: "" },

    skills: { type: [String], default: [] },
    certifications: { type: [String], default: [], alias: "certificates" },

    experienceItems: { type: [experienceSchema], default: [] },
    educationItems: { type: [educationSchema], default: [] },

    education: { type: String, default: "", select: false },
    experience: { type: String, default: "", select: false },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});
userSchema.set("toObject", { virtuals: true });

const User = model("User", userSchema);
export default User;
