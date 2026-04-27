import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

/**
 * POST /api/auth/signup
 * Create a new user with name, email, and password.
 * Role defaults to "user". To create an admin, pass role: "admin" in body.
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
      return;
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists.",
      });
      return;
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      // Only allow "admin" if explicitly passed; otherwise default to "user"
      role: role === "admin" ? "admin" : "user",
    });

    res.status(201).json({
      success: true,
      message: "User signed up successfully.",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

/**
 * POST /api/auth/login
 * Authenticate user with email + password. Returns JWT token with role.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    const isMatch = password === user.password;
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined");

    // role is embedded in the token so middleware can gate routes without a DB hit
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      secret,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

/**
 * GET /api/auth/me
 * Return the authenticated user's profile.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Not authenticated.",
      });
      return;
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}