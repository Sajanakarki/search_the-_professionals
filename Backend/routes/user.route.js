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
} from "../Controller/user.controller.js";

const router = Router();

/* ========== Public ========== */
router.get("/userslist", getUserList);
router.get("/search", searchUsers);
router.get("/user/profile/:id", getUserProfile);

/* ========== Owner-only edits (add guard when ready) ========== */
router.patch("/user/profile/:id", /* ...guard, */ updateUserProfile);
router.patch("/user/profile/:id/arrays", /* ...guard, */ updateUserArrays);

/* Experience */
router.post("/user/profile/:id/experience", /* ...guard, */ addExperienceItem);
router.put(
  "/user/profile/:id/experience/:expId",
  /* ...guard, */ updateExperienceItem
);
router.delete(
  "/user/profile/:id/experience/:expId",
  /* ...guard, */ deleteExperienceItem
);

/* Education */
router.post("/user/profile/:id/education", addEducationItem);
router.put(
  "/user/profile/:id/education/:eduId",
   updateEducationItem
);
router.delete(
  "/user/profile/:id/education/:eduId",
  /* ...guard, */ deleteEducationItem
);


export default router;



// user.route.js
//import {Router} from 'express';
//const router = Router();
//import User from"../models/user.model.js";
//import { getUserList, searchUsers } from '../Controller/user.controller.js';


//router.get('/userslist', getUserList);
//router.get('/search', searchUsers);

// GET all users
//router.get('/userslist', async (req, res) => {
  //try {
    //const users = await User.find(); // Fetch all users from DB
    //res.json(users);
  //} catch (err) {
    //res.status(500).json({ message: err.message });
  //}
//});

//export default router;

