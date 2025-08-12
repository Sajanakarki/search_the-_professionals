import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export async function register(req, res) {
  try {
    const { username, email, password, phone, location, locationText } = req.body;
    const uname = String(username || "").trim();
    const mail = String(email || "").trim().toLowerCase();
    const pass = String(password || "");
    const ph = String(phone || "").trim();
    const loc = String(typeof locationText === "string" ? locationText : location || "").trim();

    // Required field validation
    if (!uname || !mail || !pass) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }
    if (!ph) {
      return res.status(400).json({ message: "Phone is required" });
    }
    if (!loc) {
      return res.status(400).json({ message: "Location is required" });
    }

    if (pass.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }
    const phoneOk = /^[0-9+\-\s()]{7,20}$/.test(ph);
    if (!phoneOk) {
      return res.status(400).json({ message: "Enter a valid phone number" });
    }

    
    if (await User.findOne({ email: mail })) {
      return res.status(409).json({ message: "Email already in use" });
    }
    if (await User.findOne({ username: uname })) {
      return res.status(409).json({ message: "Username already in use" });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(pass, 10);

    const user = await User.create({
      username: uname,
      email: mail,
      password: hashedPassword,
      phone: ph,
      locationText: loc
    });

    const safeUser = user.toJSON(); // password removed via schema

    return res.status(201).json({
      message: "User registered successfully",
      user: safeUser
    });
  } catch (e) {
    console.error("Register error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const userObj = user.toObject();
    delete userObj.password;

    return res.json({ message: "Login successful", user: userObj, token });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function allUsers(req, res) {
  try {
    const users = await User.find({}, "-password").lean();
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
}

export async function searchUsers(req, res) {
  try {
    const { searchTerm } = req.query;

    if (!searchTerm || String(searchTerm).trim() === "") {
      const users = await User.find({}, "-password").lean();
      return res.status(200).json(users);
    }

    const users = await User.find(
      { username: { $regex: String(searchTerm).trim(), $options: "i" } },
      "-password"
    ).lean();

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ message: "Failed to search users" });
  }
}
