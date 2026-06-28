import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

import ApiError from "./utils/apiError.js";

if (!process.env.JWT_SECRET) {
    throw new ApiError("JWT_SECRET is not defined");
}

if (!process.env.MONGO_URL) {
    throw new ApiError("MONGO_URL is not defined");
}

if (!process.env.PORT) {
    throw new ApiError("PORT is not defined");
}

if (!process.env.CLIENT_URL) {
    throw new ApiError("CLIENT_URL is not defined");
}

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js"
import { errorHandler } from "./middlewares/errorHandler.js";



const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit: "40kb", extended: true}));

app.use("/api/v1/users", userRoutes);

app.use((req, res, next) => {
    next(new ApiError(404, "Page not found"));
});

app.use(errorHandler);

const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MONGODB CONNECTED");
        server.listen(app.get("port"), () => {
            console.log(`LISTENING ON PORT ${process.env.PORT}`)
        })
    } catch (err) {
        console.error("MongoDB Error:", err);
    }
}

start();
