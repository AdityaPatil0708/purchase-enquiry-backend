import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config();

const dbConnect = async()=> {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined in environment variables");
    }
    await mongoose.connect(process.env.MONGO_URI)
    console.log("MongoDB connected")
}

export default dbConnect;