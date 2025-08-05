// user.route.js
import { Router } from 'express';
import { getUserList, searchUsers } from '../Controller/user.controller.js';

const router = Router();

// Route to get all users (uses controller)
router.get('/userslist', getUserList);

// Route to search users by name or email
router.get('/search', searchUsers);

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

