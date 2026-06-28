import { Router } from "express";
import { addToHistory, endMeeting, getUserHistory, login, register } from "../controllers/user.controller.js";
import validate from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../validations/user.validation.js";
import { meetingSchema } from "../validations/meeting.validation.js";
import isLogin from "../middlewares/isLogin.js";

const router = Router();

router.route("/login").post(validate(loginSchema), login);

router.route("/register").post(validate(registerSchema), register);

router.route("/add_to_activity").post(isLogin, validate(meetingSchema), addToHistory);

router.route("/get_all_activity").get(isLogin, getUserHistory);

router.post("/end_meeting", isLogin, endMeeting);

export default router;
