import express from "express"
import dotenv from "dotenv"
import dbConnect from "./db/dbConnect.js"
import userRoutes from "./routes/userRoute.js"
dotenv.config();

const app = express();

app.use(express.json());

app.use("/api/auth", userRoutes)

const PORT = process.env.PORT || 5000;
dbConnect();

app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`))
