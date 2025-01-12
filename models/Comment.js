const mongoose = require("mongoose")

const CommentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    postId: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    edited: {
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

module.exports = mongoose.model("Comment", CommentSchema)