const mongoose = require("mongoose")

const ChatsSchema = new mongoose.Schema({
    messages: {
        type: Array,
    },
    haveSeen: {
        type: Boolean,
        default: false
    },
    deletionCutoff: {
        type: Array,
    }
},
{timestamps: true}
);

module.exports = mongoose.model("Chats", ChatsSchema)