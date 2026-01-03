import connectDB from "./config/mongodb.js";
import express from "express";
const app = express();
import 'dotenv/config';
import cors from 'cors';

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

connectDB();