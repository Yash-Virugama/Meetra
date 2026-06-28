const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
                errors: error.details.map(err => err.message)
            });
        }

        next();
    };
};

export default validate;