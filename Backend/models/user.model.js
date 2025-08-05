import { Schema, model } from "mongoose";

const userSchema = new Schema({
    username: String,
    email: String,
    password: String,
    CreatedAt: {
        type: Date,
        default: Date.now
    }
});

const User = model('User' ,userSchema)
export default User;



