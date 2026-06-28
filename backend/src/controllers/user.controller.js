import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "../middlewares/asyncHandler.js";
import ApiError from "../utils/apiError.js";

const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User Not Found");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new ApiError(
            httpStatus.UNAUTHORIZED,
            "Invalid Username or Password"
        );
    }

    const token = jwt.sign(
        {
            id: user._id,
            username: user.username,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );

    return res.status(httpStatus.OK).json({ token });
});

const register = asyncHandler(async (req, res) => {
    const { name, username, password } = req.body;

    const existingUser = await User.findOne({ username });

    if (existingUser) {
        throw new ApiError(httpStatus.CONFLICT, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        name,
        username,
        password: hashedPassword,
    });

    await newUser.save();

    console.log("User Registered");

    res.status(httpStatus.CREATED).json({
        message: "User Registered!",
    });
});

const getUserHistory = asyncHandler(async (req, res) => {
    const meetings = await Meeting.find({
        user_id: req.user.username,
    }).sort({ date: -1 });

    res.status(httpStatus.OK).json(meetings);
});

const addToHistory = asyncHandler(async (req, res) => {
    const { meetingCode } = req.body;
    const user = req.user;

    if (!meetingCode) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Meeting code is required"
        );
    }

    const existingMeeting = await Meeting.findOne({
        user_id: user.username,
        meetingCode,
        leftAt: null,
    });

    if (existingMeeting) {
        return res.status(httpStatus.OK).json({
            message: "Meeting already exists",
            meetingId: existingMeeting._id,
        });
    }

    const newMeeting = new Meeting({
        user_id: user.username,
        meetingCode,
        joinedAt: new Date(),
        leftAt: null,
        duration: 0,
    });

    await newMeeting.save();

    res.status(httpStatus.CREATED).json({
        message: "Added code to history",
        meetingId: newMeeting._id.toString(),
    });
});

const endMeeting = asyncHandler(async (req, res) => {
    const { meetingId } = req.body;

    if (!meetingId) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Meeting ID is required"
        );
    }

    const meeting = await Meeting.findOne({
        _id: meetingId,
        user_id: req.user.username,
    });

    if (!meeting) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            "Meeting not found"
        );
    }

    if (meeting.leftAt) {
        return res.status(httpStatus.OK).json({
            message: "Meeting already ended",
            duration: meeting.duration,
        });
    }

    meeting.leftAt = new Date();
    meeting.duration = Math.floor(
        (meeting.leftAt - meeting.joinedAt) / 1000
    );

    await meeting.save();

    res.status(httpStatus.OK).json({
        message: "Meeting ended successfully",
        duration: meeting.duration,
    });
});

export { login, register, getUserHistory, addToHistory, endMeeting };