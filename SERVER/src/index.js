import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js"
import { connectDB } from "./lib/db.js"; 
import cors from "cors";
import { app,server } from "./lib/socket.js";
import aiRoutes from "./routes/ai.route.js";


const PORT = process.env.PORT || 4001;
app.use(express.json({limit :'10mb'}));
app.use(cookieParser());
app.use(cors({
  origin:"http://localhost:5173",
  "https://ping-buzz.vercel.app",
  credentials:true}
));

app.use("/api/ai", aiRoutes);
app.use("/api/auth",authRoutes);
app.use("/api/messages",messageRoutes);
server.listen(PORT, () => {
  console.log(`Server is Running on port ${PORT}`);
  connectDB();
});
