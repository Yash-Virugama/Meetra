import mongoose, { Schema } from "mongoose";

const usearSchema = new Schema(
    {
        name: {type: String, required: true},
        username: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        token: {type: String}
    },
     {
        timestamps: true // Adds createdAt and updatedAt
    }
)

const User = mongoose.model("User", usearSchema);

export {User};