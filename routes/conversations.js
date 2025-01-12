const router = require("express").Router();
const Conversation = require("../models/Conversation")
const { verifyToken } = require("../token");

// find or create a specific conversation 
router.post("/find_or_create", verifyToken, async (req,res) => {
    const { conversationOwner, receiverId } = req.body;
    const searchQuery = req.query.find;

    try{
        if (searchQuery === "true"){
            const oldConversation = await Conversation.findOne({
                 conversationOwner: conversationOwner,
                 receiverId: receiverId
            })

            if (oldConversation) {
                res.status(200).json({ state: "exists", conversation: oldConversation });
            } else {
                res.status(200).json({ state: "dontExist" });
            }
        }
        else{
            const conversation = await Conversation.findOneAndUpdate(
                {conversationOwner, receiverId},
                {$setOnInsert: req.body},
                {new: true, upsert: true}
            )
            
            res.status(200).json(conversation);
        }
    }
    catch(err){
        res.status(500).json(err);
    }
})

// get a conversation by its id
router.get('/getConv/:convId', verifyToken, async (req,res) => {
    try{
        const conversation = await Conversation.findById(req.params.convId);
        res.status(200).json(conversation);
    }
    catch(err){
        res.status(500).json(err);
    }
})

// get all conversations of the user
router.get('/:userId', verifyToken, async (req,res) => {
    try{
        const conversations = await Conversation.find({
            conversationOwner: req.params.userId
        });
        res.status(200).json(conversations);
    }
    catch(err){
        res.status(500).json(err);
    }
})

// update a conversation by convId
router.put("/:id", verifyToken, async (req,res)=> {
    try{
        const conversation = await Conversation.findById(req.params.id);
        await conversation.updateOne({$set: req.body});
        res.status(200).json("The conversation has been updated!");
    }
    catch(err){
        res.status(500).json(err);
    } 
})

// delete a conversation by convId
router.delete("/:id", verifyToken, async (req,res)=> {
    try{
        await Conversation.findByIdAndDelete(req.params.id);
        res.status(200).json("The conversation has been deleted!");
    }
    catch(err){
        res.status(500).json(err);
    } 
})

// find a conversation and update it by its chatId and conversation owner id
router.put('/updateConv/:chatId/:userId', verifyToken, async (req,res) => {
    try{
        await Conversation.findOneAndUpdate(
            {chatId: req.params.chatId, conversationOwner: req.params.userId},
            {$set: req.body}
        );
        res.status(200).json("Conversation updated!");
    }
    catch(err){
        res.status(500).json(err);
    }
})

module.exports = router;