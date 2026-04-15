import express from "express"
import dotenv from "dotenv"
dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT;

app.listen(()=>console.log(`Server listening on ${PORT}`))
