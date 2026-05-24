import express from "express";
import cors from "cors";
import ChatRouter from "./routes/chat";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.get("/", (req, res) => {
  res.send("Backend is running");
});
app.use(express.json());
console.log("app.ts loaded");
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
console.log(process.env.FRONTEND_URL);

app.use("/chatRoutes", ChatRouter);

export default app;