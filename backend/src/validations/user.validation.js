import Joi from "joi";

export const registerSchema = Joi.object({
    name: Joi.string()
        .trim()
        .pattern(/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/)
        .min(3)
        .max(50)
        .required()
        .messages({
            "string.pattern.base":
                "Name can only contain letters, spaces, apostrophes (') and hyphens (-)."
        }),

    username: Joi.string()
        .trim()
        .pattern(/^[a-zA-Z0-9._]+$/)
        .min(3)
        .max(20)
        .required(),

    password: Joi.string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=[\]{};':"\\|,.<>/?]).{6,64}$/)
        .min(6)
        .max(20)
        .required()
});

export const loginSchema = Joi.object({
    username: Joi.string().required(),

    password: Joi.string().required()
});