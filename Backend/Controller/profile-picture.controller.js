import User from "../models/user.model.js";
import { uploadBufferToCloudinary } from "../middleware/image-uploader.middleware.js";

export async function uploadProfilePic(req, res) {
  try {
    const userId = req.params.id || (req.user && req.user.id);
    if (!userId) return res.status(400).json({ success: false, message: "Missing user id" });
    if (!req.file?.buffer) return res.status(400).json({ success: false, message: "No file uploaded" });

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "profilepic",
      public_id: `user_${userId}_${Date.now()}`,
      transformation: [
        { width: 1600, height: 1600, crop: "fill", gravity: "auto" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatarUrl: result.secure_url, avatarId: result.public_id } },
      { new: true, select: "-password" }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, avatarUrl: user.avatarUrl, user });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
}
