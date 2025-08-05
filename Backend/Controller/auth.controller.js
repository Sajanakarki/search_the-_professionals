//let users =[]; //In-memory user storagev(temporary)
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from"../models/user.model.js";


export async function register(req, res){
    try{

    const{username, email, password } = req.body;

    const existing = await User.findOne({ username});
    if (existing) return res.status(400).send({message: "User exists"});

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username,email, password: hashedPassword});
    await user.save();
    }catch(e){
    return res.status(500).json(e);
    }finally{
    res.status(201).json({ message: "User registered successfully"});
    }
}


export async function login(req, res){
    try{

    const{username, password } = req.body;

    const user = await User.findOne({ username});
    if (!user) return res.status(400).send({message: "User not found"});

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(402).send("Invalid Credentials");

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,{expiresIn: "1h"});
    res.json({ message: "Login successful", user, token})
    }catch(e){
        console.log(e);
        
    return res.status(500).json(e);
    }
}

export async function allUsers(req, res) {
  try {
    // Find all users, exclude password field
    const users = await User.find({}, '-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
}

//Search bar functionality
export async function searchUsers(req, res) {
  try {
    const { searchTerm } = req.query;
   
    if (!searchTerm || searchTerm.trim() === '') {
      // If no search term, return all users
      const users = await User.find({}, '-password');
      return res.status(200).json(users);
    }

    // Search for users whose username contains the search term (case sensitive is implied init)
    const users = await User.find(
      { username: { $regex: searchTerm.trim(), $options: 'i' } },
      '-password'
    );
   
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
}
