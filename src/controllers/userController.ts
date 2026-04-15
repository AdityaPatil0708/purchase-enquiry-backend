import type { Request, Response } from "express";
import bcrypt, { hash } from "bcryptjs";
import User from "../models/userModel.js";

export async function signup(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashpass = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: name,
      email: email,
      password: hashpass,
    });
    await newUser.save();
    res.status(201).json({
      success: true,
      message: "User signed up successfully",
      user:{
        id : newUser._id,
        name : newUser.name,
        email : newUser.email
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function login(req: Request, res: Response) {}
