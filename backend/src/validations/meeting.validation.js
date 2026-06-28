import Joi from "joi";

export const meetingSchema = Joi.object({
    user_id: Joi.string().optional(),

    meetingCode: Joi.string()
        .trim()
        .min(3)
        .max(20)
        .required(),

    joinedAt: Joi.date().optional(),

    leftAt: Joi.date().optional(),

    duration: Joi.number()
        .min(0)
        .optional()
});