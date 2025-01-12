const router = require("express").Router();
const Notification = require("../models/Notification")
const User = require("../models/User")
const { verifyToken } = require("../token");


// Create a notification
router.post("/", verifyToken, async (req,res)=> {
    const newNotification = new Notification(req.body)
    try{
        const savedNotification = await newNotification.save();
        res.status(200).json(savedNotification);
    }
    catch(err){
        res.status(500).json(err);
    }
})

// Get all notifications of a user
router.get("/:id", verifyToken, async (req,res) => {
    try{
        const currentUser = await User.findById(req.params.id);
        const notifications = await Notification.find({receiverId: currentUser._id})
        res.status(200).json(notifications)
    }
    catch(err){
        res.status(500).json(err);
    }
})


// Update a notification
router.put("/:id", verifyToken, async (req,res)=> {
    try{
        const notification = await Notification.findById(req.params.id);
        if (notification.receiverId === req.body.receiverId){
            await notification.updateOne({$set: req.body});
            res.status(200).json("The notification has been updated!");
        }
    }
    catch(err){
        res.status(500).json(err);
    } 
})

// Update all notifications
router.put("/updateall/:id", verifyToken, async (req,res)=> {
    try{
        if (req.params.id === req.body.receiverId){
            await Notification.updateMany({receiverId: req.params.id}, {$set: {read: true}});
            res.status(200).json("The notifications have been updated!")
        }
    }
    catch(err){
        res.status(500).json(err);
    } 
})


// Delete a notification
router.delete("/:id", verifyToken, async (req,res)=> {
    try{
        const notification = await Notification.findById(req.params.id);
        if (notification.receiverId === req.body.userId){
            await notification.deleteOne();
            res.status(200).json("The notification has been deleted!")
        }
        else{
            res.status(403).json("You can delete only your notification!")
        }
    }
    catch(err){
        res.status(500).json(err);
    } 
})

// cancel notification, if postId is true it means its a friend request notification , if its actually an id is a like for post notification
router.delete("/:postId/unlike/:userId", verifyToken, async (req, res) => {
    try {
        const { postId, userId } = req.params;

        if (postId !== "true"){
            const notification = await Notification.findOneAndDelete({
                postId: postId,
                forLikePurpose: true,
                authorId: userId, 
                receiverId: { $ne: userId }  
            });

            if (!notification) {
                return res.status(200).json({ message: "Notification not found." });
            }
        }
        else{
            const notification = await Notification.findOneAndDelete({
                friendRequest: true,
                authorId: userId, 
                receiverId: { $ne: userId }  
            });

            if (!notification) {
                return res.status(200).json({ message: "Notification not found." });
            }
        }

        res.status(200).json("Notification deleted.");
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
});

// Delete all notifications
router.delete("/deleteall/:id", verifyToken, async (req,res)=> {
    try{
        if (req.params.id === req.body.userId){
            await Notification.deleteMany({receiverId: req.params.id});
            res.status(200).json("The notifications have been deleted!")
        }
        else{
            res.status(403).json("You can delete only your notifications!")
        }
    }
    catch(err){
        res.status(500).json(err);
    } 
})

module.exports = router;