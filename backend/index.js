//external packages
import express from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { z } from "zod";
import jwt from "jsonwebtoken";
import cors from "cors";
//internal packages
import userModel from "./models/user.js";
import questModel from "./models/quest.js";
//middleware
import verifyToken from "./middleware/verifyToken.js";
//utilities
import initializeQuestStats from "./utils/initializeQuestStats.js";
import updateQuestStats from "./utils/updateQuestStats.js";
import multer from 'multer';
import uploadToS3 from "./utils/AWSUpload.js";

const upload = multer({ storage: multer.memoryStorage() });
//general setup
const app = express();
app.use(express.json());
app.listen("5555", () => {
  console.log("Server is running on port 5555");
});
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/your-database")
  .then(() => console.log("Connected to database"))
  .catch((err) => console.error("Database connection failed:", err));

app.get("/", (req, res) => {
  res.send("API is running...");
});
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

app.post("/api/v1/signup", async (req, res) => {
  const { username, email, password } = signupSchema.parse(req.body);
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new userModel({ username, email, password: hashedPassword });
  try {
    await user.save();
    res.send("User Registered Successfully");
  } catch (err) {
    console.log(err.message);
    res.status(500).send(err);
  }
});
app.post("/api/v1/login", async (req, res) => {
  console.log(req.body);
  const { emailOrUsername, password, type } = req.body;

  if (type === "email") {
    const email = emailOrUsername;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
    res.status(200).json({
      message: "Login successful",
      token: token,
    });
  } else {
    console.log("From username section");
    const username = emailOrUsername;
    const user = await userModel.findOne({ username });
    console.log(username);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(200).json({
      message: "Login successful",
      token: token,
    });
  }
});
app.get("/api/v1/protected", verifyToken, (req, res) => {
  console.log(req.user);
  res.send("protected route working");
});

//upload file
app.post("/api/v1/upload",upload.single('file'),async (req,res)=>{
  console.log(req.file);
  res.send(`File uploaded successfully: ${req.file.filename}`);
  const fileUrl = await uploadToS3(req.file);
  console.log(fileUrl);
  

});


//quest routes
app.post("/api/v1/quests/create", verifyToken, async (req, res) => {
  const { title, description, questions, bounty, status } = req.body;
  const createdBy = req.user.username;
  const user = await userModel.findOne({ username: createdBy });
  if (!user) {
    res.status(400).json({ message: "User not found" });
  }
  const quest = new questModel({
    title,
    description,
    questions,
    bounty,
    createdBy: user,
    status,
  });
  const createdQuest = await quest.save();
  await initializeQuestStats(createdQuest._id);

  res.status(200).json({ message: "Quest created successfully" });
});
app.get("/api/v1/quests", async (req, res) => {
  const quests = await questModel
    .find({ status: "open" })
    .populate("createdBy", "username");
  res.status(200).json(quests);
});
app.get("/api/v1/quests/:id", async (req, res) => {
  const questId = req.params.id;
  const quest = await questModel
    .findById(questId)
    .populate("createdBy", "username");
  if (quest) {
    res.status(200).json(quest);
  } else {
    res.status(404).json({ message: "Quest not found" });
  }
});
//questStats
app.post(
  "/api/v1/questStats/:questId/answers",
  verifyToken,
  async (req, res) => {
    const { questId } = req.params;
    const username = req.user.username;
    const answers = req.body;
    try {
      await updateQuestStats(questId, username, answers);
      
      res.status(200).json({ message: "Answers submitted successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Failed to submit answers", error: error.message });
    }
  }
);
app.get("/api/v1/questStats/:questId", verifyToken, async (req, res) => {
  try {
    const questStats = await questStatsModel.findOne({
      questId: req.params.questId,
    });
    res.status(200).json(questStats);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Failed to fetch quest stats" });
  }
});
