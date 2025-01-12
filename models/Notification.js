const mongoose = require("mongoose")

const NotificationSchema = new mongoose.Schema({
    authorId: {
        type: String,
        required: true
    },
    receiverId: {
        type: String,
        required: true
    },
    postId:{
        type: String,
    },
    forLikePurpose: {
        type: Boolean,
        default: false
    },
    friendRequest:{
        type: Boolean,
        default: false
    },
    content: {
        type: String,
    },
    read:{
        type: Boolean,
        default: false
    }
},
{timestamps: true}
);

module.exports = mongoose.model("Notification", NotificationSchema)