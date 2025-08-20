import User from "../models/user.model.js";
import { uploadBufferToCloudinary } from "../middleware/image-uploader.middleware.js";
import cloudinary from "../config/cloudinary.config.js";

export async function uploadProfilePic(req, res) {
    try {
        if (!req.file) throw new Error ('No file upload');
    
        const result = await uploadBufferToCloudinary(req.file.buffer, {
            folder: 'profilepic',
            public_id: `user_${req.user.id}`,
            transformation: [
                {width :1600, height: 1600, crop: 'fill', gravity: 'auto'},
                {quality: 'auto', fetch_fomat:'auto'} ,

            ],
        });

        // Save image details to MongoDB
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                profilePicture: {
                    url: result.secure_url,
                    public_id: result.public_id
                }
            },
            {new: true }
        );

        res.json({ success: true, image: user.profilePictute });
    } catch (e) {
        res.status(400).jscon({ success: false,message: e.message});
    }
}