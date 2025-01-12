const router = require("express").Router();
const Post = require("../models/Post")
const User = require("../models/User")
const Comment = require("../models/Comment")
const { verifyToken } = require("../token");
var fs = require('fs')

// Create a post
router.post("/", verifyToken, async (req,res)=> {
    const newPost = new Post(req.body)
    try{
        const savedPost = await newPost.save();
        res.status(200).json(savedPost);
    }
    catch(err){
        res.status(500).json(err);
    }
})

// Update a post
router.put("/:id", verifyToken, async (req,res)=> {
    try{
        const user = await User.findById(req.body.userId);
        const post = await Post.findById(req.params.id);
        if (post.userId === user.id){
            await post.updateOne({$set: req.body});
            res.status(200).json("The post has been updated!")
        }
        else{
            res.status(403).json("You can update only your post!")
        }
    }
    catch(err){
        res.status(500).json(err);
    } 
})

// Delete a post
router.delete("/:id/:userId", verifyToken, async (req,res)=> {
    try{
        const user = await User.findById(req.params.userId);
        const post = await Post.findById(req.params.id);
        if (post.userId === user.id){
            await Comment.deleteMany({postId: post._id});
            await post.deleteOne();
            res.status(200).json("The post has been deleted along with its comments!")
        }
        else{
            res.status(403).json("You can delete only your post!")
        }
    }
    catch(err){
        res.status(500).json(err);
    } 
})

// Like / Unlike a post
router.put("/:id/like", verifyToken, async (req,res)=> {
    try{
        const post = await Post.findById(req.params.id);
        if (!post.likes.includes(req.body.userId)){
            await post.updateOne({$push: {likes: req.body.userId}})
            res.status(200).json("The post has been liked!")
        }
        else{
            await post.updateOne({$pull: {likes: req.body.userId}});
            res.status(200).json("The post has been unliked")
        }
    }
    catch(err){
        res.status(500).json(err);
    }
})


// Get a post
router.get("/post/:postId/:userId", verifyToken, async (req,res) => {
    try{
        const currentUser = req.params.userId;
        const post = await Post.findById(req.params.postId);

        if (currentUser === post.userId || post.privacy !== "Onlyme"){
            res.status(200).json(post);
        }
        else{
            res.status(401).json("You are not authorized to view this post!");
        }
        
    }
    catch(err){
        res.status(500).json(err);
    }
})

// Get timeline posts
router.get("/timeline/:userId", verifyToken, async (req,res) => {
    try{
        const currentUser = await User.findById(req.params.userId);
        const userPosts = await Post.find({userId: currentUser._id});
        const friendPosts = await Promise.all(
            currentUser.friends.map((friendId) => {
                return Post.find({userId: friendId , privacy: {$ne: "Onlyme"}})
            })
        );
        res.status(200).json(userPosts.concat(...friendPosts));
    }
    catch(err){
        res.status(500).json(err);
    }
})

// Get users's all posts
router.get("/profile/:id", verifyToken, async (req,res) => {
    try{
        const currentUser = await User.findById(req.params.id);
        const posts = await Post.find({userId : currentUser._id})
        res.status(200).json(posts)
    }
    catch(err){
        res.status(500).json(err);
    }
})

module.exports = router;