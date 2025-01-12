const mongoose = require("mongoose")

const ConversationSchema = new mongoose.Schema({
    conversationOwner: {
        type: String,
        required: true 
    },
    receiverId: {
        type: String,
    },
    chatId: {
        type: String,
    },
    lastMessage:{
        type: String,
        default: ""
    },
    isSeen: {
        type: Boolean,
    } 
},
{timestamps: true}
);

module.exports = mongoose.model("Conversation", ConversationSchema)