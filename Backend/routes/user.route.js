import { Router } from "express";
import {
  getUserList,
  searchUsers,
  getUserProfile,
  updateUserProfile,
  updateUserArrays,
  addExperienceItem,
  updateExperienceItem,
  deleteExperienceItem,
  addEducationItem,
  updateEducationItem,
  deleteEducationItem,
  getProfileOptions,
} from "../Controller/user.controller.js";

import { upload } from "../middleware/image-uploader.middleware.js";
import { uploadProfilePic } from "../Controller/profile-picture.controller.js";

const router = Router();

/* Public */
router.get("/userslist", getUserList);
router.get("/search", searchUsers);
router.get("/profile/:id", getUserProfile);
router.get("/options", getProfileOptions);

/* Profile updates */
router.patch("/profile/:id", updateUserProfile);
router.patch("/profile/:id/arrays", updateUserArrays);

/* Profile photo upload */
router.post("/profile/:id/photo", upload.single("file"), uploadProfilePic);

/* Experience items */
router.post("/profile/:id/experience", addExperienceItem);
router.put("/profile/:id/experience/:expId", updateExperienceItem);
router.delete("/profile/:id/experience/:expId", deleteExperienceItem);

/* Education items */
router.post("/profile/:id/education", addEducationItem);
router.put("/profile/:id/education/:eduId", updateEducationItem);
router.delete("/profile/:id/education/:eduId", deleteEducationItem);

export default router;
