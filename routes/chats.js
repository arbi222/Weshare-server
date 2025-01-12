const router = require("express").Router();
const Chats = require("../models/Chats")
const User = require("../models/User");
const { verifyToken } = require("../token");

// create a chat
router.post("/", verifyToken, async (req,res) => {
    const newChat = new Chats(req.body);

    try{
        const savedChat = await newChat.save();
        res.status(200).json(savedChat);
    }
    catch(err){
        res.status(500).json(err);
    }
})

// get the messages of a chat
router.get("/:chatId", verifyToken, async (req,res) => {
    try{
        const chat = await Chats.findById(req.params.chatId);
        res.status(200).json(chat);
    }
    catch(err){
        res.status(500).json(err);
    }
})

// sending messages
router.put("/sendMessage/:chatId", verifyToken, async (req, res) => {
    try{
        const chat = await Chats.findById(req.params.chatId);
        await chat.updateOne({$push: {messages: req.body}});
        res.status(200).json("The conversation has been updated!");
    }
    catch(err){
        res.status(500).json(err);
    }
})

// update a chat  maybe make it patch
router.put("/:chatId", verifyToken, async (req, res) => {
    try{
        const chat = await Chats.findByIdAndUpdate(req.params.chatId, {haveSeen: req.body.haveSeen});
        res.status(200).json(chat);
    }
    catch(err){
        res.status(500).json(err);
    }
})

// update a chat when gets deleted by any user
router.put("/", verifyToken, async (req, res) => {
    
    const { userId, timestamp, chatId } = req.body;

    try{
        const chat = await Chats.findById(chatId);

        const existingCutoff = chat.deletionCutoff.find(cutoff => cutoff.user === userId);
        if (existingCutoff) {
            chat.deletionCutoff.pull(existingCutoff);
            chat.deletionCutoff.push({ user: userId, timestamp: timestamp });
        } 
        else {
            chat.deletionCutoff.push({ user: userId, timestamp: timestamp });
        }

        await chat.save();
        res.status(200).json(chat);
    }
    catch(err){
        console.log(err);
        res.status(500).json(err);
    }
})

// delete the chat
router.delete("/:chatId", verifyToken, async (req,res) => {
    try{
        await Chats.findByIdAndDelete(req.params.chatId);
        res.status(200).json("The chat has been deleted!");
    }
    catch(err){
        res.status(500).json(err);
    }
})

module.exports = router;