const mongoose = require("mongoose")

const PostSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    image: {
        type: String,
    },
    fileType:{
        type: String,
    },
    privacy: {
        type: String,
    },
    edited: {
        type: Boolean,
        default: false,
    },
    updateProfile: {
        type: Boolean,
        default: false,
    },
    updateCover: {
        type: Boolean,
        default: false,
    },
    likes: {
        type: Array,
        default: []
    },
},
{timestamps: true}
);

module.exports = mongoose.model("Post", PostSchema)