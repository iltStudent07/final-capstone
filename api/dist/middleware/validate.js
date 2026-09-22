export const validate = (validator) => {
    return (req, res, next) => {
        const errors = validator(req.body);
        if (errors?.length) {
            res.status(400).json({ message: 'Validation failed', errors });
            return;
        }
        next();
    };
};
export default validate;
