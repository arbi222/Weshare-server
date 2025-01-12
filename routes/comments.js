const router = require("express").Router();
const Comment = require("../models/Comment")
const Post = require("../models/Post")
const { verifyToken } = require("../token");

// Create a comment
router.post("/", verifyToken, async (req,res)=> {
    const newComment = new Comment(req.body)
    try{
        const savedComment = await newComment.save();
        res.status(200).json(savedComment);
    }
    catch(err){
        res.status(500).json(err);
    }
})

// Get one specific comment
router.get("/onecomment/:id", verifyToken, async (req,res) => {
    try{
        const comment = await Comment.findById(req.params.id);
        res.status(200).json(comment);
    }
    catch(err){
        res.status(500).json(err);
    }
})

// Get all comments of a post
router.get("/:id", verifyToken, async (req,res) => {
    try{
        const currentPost = await Post.findById(req.params.id);
        const comments = await Comment.find({postId: currentPost._id})
        res.status(200).json(comments)
    }
    catch(err){
        res.status(500).json(err);
    }
})


// Update a comment
router.put("/:id", verifyToken, async (req,res)=> {
    try{
        const comment = await Comment.findById(req.params.id);
        if (comment.userId === req.body.userId){
            await comment.updateOne({$set: req.body});
            res.status(200).json("The comment has been updated!");
        }
        else{
            res.status(403).json("You can edit only your comment!")
        }
    }
    catch(err){
        res.status(500).json(err);
    } 
})


// Delete a comment
router.delete("/:id", verifyToken, async (req,res)=> {
    try{
        const comment = await Comment.findById(req.params.id);
        if (req.body.userId === req.body.postOwnerId){
            await comment.deleteOne();
            res.status(200).json("The comment has been deleted!")
        }
        else{
            if (comment.userId === req.body.userId){
                await comment.deleteOne();
                res.status(200).json("The comment has been deleted!")
            }
            else{
                res.status(403).json("You can delete only your comment!")
            }
        }
    }
    catch(err){
        res.status(500).json(err);
    } 
})

module.exports = router;