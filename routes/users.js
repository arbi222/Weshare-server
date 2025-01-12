const router = require("express").Router();
const User = require("../models/User")
const { verifyToken } = require("../token");

// Update a user
router.put("/:id", verifyToken, async (req,res)=> {
    if (req.body.userId === req.params.id || req.body.isAdmin){
        if (req.body.newPassword){
            if (req.body.newPassword === req.body.confirmPassword){
                try{
                    const user = await User.findById(req.params.id); 
    
                    await user.changePassword(req.body.oldPass, req.body.newPassword, function(err){
                        if(err){
                            return res.status(400).json("Old password is wrong!");
                        }
                        else{
                            return res.status(200).json("Password changed successfully!");
                        }
                    })
                }
                catch(err){
                    return res.status(500).json(err);
                }
            }
            else{
                return res.status(403).json("Password & Confirm Password do not match")
            }
        }
        else{
            try{
                await User.findByIdAndUpdate(req.params.id, {
                    $set: req.body,
                });
                res.status(200).json("Account has been updated!");
            }
            catch(err){
                return res.status(500).json(err);
            }
        }
    }
    else{
        return res.status(403).json("You can update only your account!")
    }
})


// Add photo/video to gallery
router.put("/:id/addToGallery", verifyToken, async (req,res)=> {
    if (req.body.userId === req.params.id){
        const fileType = req.body.fileType;
        try{
            const user = await User.findById(req.body.userId);

            if (fileType === "image"){
                if(!user.images.includes(req.body.file)){
                    await user.updateOne({$push:{images: req.body.file}})
                    res.status(200).json("Image has been added to your gallery.")
                }
                else{
                    res.status(403).json("You already have this image in your gallery.")
                }
            }
            else{
                if(!user.videos.includes(req.body.file)){
                    await user.updateOne({$push:{videos: req.body.file}})
                    res.status(200).json("Video has been added to your gallery.")
                }
                else{
                    res.status(403).json("You already have this image in your gallery.")
                }
            }
        }
        catch(err){
            res.status(500).json(err);
        }
    }
    else{
        res.status(403).json("You have no access to this gallery.")
    }
})

// delete photo/video from gallery
router.put("/:id/removeFromGallery", verifyToken, async (req,res)=> {
    if (req.body.userId === req.params.id){
        const fileType = req.body.fileType;
        try{
            const user = await User.findById(req.body.userId);
            if (fileType === "image"){
                if(user.images.includes(req.body.file)){
                    if (req.body.file === user.profilePicture){
                        await user.updateOne({$set: {profilePicture: ""}, $pull: {images: req.body.file}})
                    }
                    else if(req.body.file === user.coverPicture){
                        await user.updateOne({$set: {coverPicture: ""}, $pull: {images: req.body.file}})
                    }
                    else{
                        await user.updateOne({$pull: {images: req.body.file}})
                    }
                    res.status(200).json("Image has been removed from your gallery.")
                }
                else{
                    res.status(403).json("This image does not exist in your gallery.")
                }
            }
            else{
                if (user.videos.includes(req.body.file)){
                    await user.updateOne({$pull: {videos: req.body.file}})
                    res.status(200).json("Video has been removed from your gallery.")
                }
                else{
                    res.status(403).json("This image does not exist in your gallery.")
                }
            } 
        }
        catch(err){
            res.status(500).json(err);
        }
    }
    else{
        res.status(403).json("you have no access to this gallery.")
    }
})


// Delete a user
router.delete("/:id", verifyToken, async (req,res)=> {
    if (req.body.userId === req.params.id || req.body.isAdmin){
        try{
            const user = await User.findById(req.params.id)     
            if(req.body.password){
                user.authenticate(req.body.password, function(err,passMatch, passError){
                    if(passError){
                        return res.status(403).json("Password is incorrect!");
                    }
                    else if(passMatch){
                        const deleteAcc = async () => {
                            await User.findByIdAndDelete(req.params.id);
                        }
                        deleteAcc();
                        
                        res.status(200).json("Account has been deleted");
                    }
                })
            }
            else{
                return res.status(403).json("Enter your password!")
            }
        }
        catch(err){
            return res.status(500).json(err);
        }
    }
    else{
        return res.status(403).json("You can delete only your account!")
    }
})

// check BlockStatus
router.get("/blockStatus/:loggedInUser/:otherUser", verifyToken, async (req, res) => {
    const loggedInUser = await User.findById(req.params.loggedInUser);
    const theOtherUser = await User.findById(req.params.otherUser);

    if (loggedInUser.blockList.includes(req.params.otherUser)){
        res.status(200).json("blockedByYou");
    }
    else if (theOtherUser.blockList.includes(req.params.loggedInUser)){
        res.status(200).json("blockedByThem");
    }
    else{
        res.status(200).json("noBlocked");
    }
})

// Get a user                                   
router.get("/getUser/:id/:loggedInUser", verifyToken, async (req,res)=> {
    try{
        const loggedInUser = await User.findById(req.params.loggedInUser);
        const user = await User.findById(req.params.id);
        const searchQuery = req.query.getBlocked;
 
        if (req.params.loggedInUser === req.params.id){
            const {password, updatedAt, ...other} = loggedInUser._doc 
            res.status(200).json(other);
        }
        else{
            if (loggedInUser.blockList.includes(req.params.id)){
                if (searchQuery === "true"){
                    res.status(200).json({_id: user._id, state: "blockedByYou"});
                }
                else{
                    res.status(200).json("blockedByYou");
                }
            }
            else if (user.blockList.includes(req.params.loggedInUser)){
                res.status(200).json("blockedByThem");
            }
            else{
                const {password, updatedAt, ...other} = user._doc 
                res.status(200).json(other);
            }
        }
    }
    catch(err){
        res.status(500).json(err);
    }
})

// filter users in the search bar
router.get("/search/people", verifyToken, async (req,res) => {
    const searchQuery = req.query.q;
    if (!searchQuery){
        return res.json([]);
    }
    try{
        const loggedInUser = await User.findById(req.query.userId);

        const searchTerms = searchQuery.split(" ").filter(term => term.trim() !== "");

        const searchConditions = searchTerms.map(term => ({
            $or: [
                { firstName: { $regex: term, $options: "i" } },
                { middleName: { $regex: term, $options: "i" } },
                { lastName: { $regex: term, $options: "i" } }
            ]
        }));

        const users = await User.find({ $and: searchConditions }).limit(15);  

        let allUsers = [];
        users.filter((user) => (!user.blockList.includes(req.query.userId)) && (!loggedInUser.blockList.includes(user._id))).map((foundedUser) => {
            const {_id, firstName, middleName, lastName, profilePicture, gender} = foundedUser;
            allUsers.push({_id, firstName, middleName, lastName, profilePicture, gender});
        })
        
        res.status(200).json(allUsers);
    }
    catch(err){
        res.status(500).send('Server Error');
    }
})

// Get friends
router.get("/friends/:user_id", verifyToken, async (req, res) => {
    try{
        const user = await User.findById(req.params.user_id);
        const friends = await Promise.all(
            user.friends.map(friend_id => {
                return User.findById(friend_id)
            })
        )
        let friendList = [];
        friends.map(friend => {
            const {_id, firstName, middleName, lastName, profilePicture, friendRequests, gender, blockList} = friend;
            friendList.push({_id, firstName, middleName, lastName, profilePicture, friendRequests, gender, blockList})
        })
        res.status(200).json(friendList);
    }
    catch(err){
        res.status(500).json(err);
    }
})


// Send friend request to a user
router.put("/:id/friendRequest", verifyToken, async (req,res) => {
    if (req.body.userId !== req.params.id){ 
        try{
            const user = await User.findById(req.params.id);
            const currentuser = await User.findById(req.body.userId);

            if ((!currentuser.blockList.includes(req.params.id)) && (!user.blockList.includes(req.body.userId))){
                if (!user.friends.includes(req.body.userId)){ // checking if its not in our friend list then ...
                    if ((!user.friendRequests.includes(req.body.userId)) && (!currentuser.friendRequests.includes(req.params.id))){
                        // if we havent sent a friend request or if they didnt send us a friend request then we go on ...
                        await user.updateOne({$push: {friendRequests: req.body.userId}})
                        res.status(200).json("friend request sent sucessfully")
                    }
                    else{
                        res.status(403).json("You have already sent this user a friend request or they have sent you a friend request.")
                        // this needs to be sent as pop up its important
                    }
                }
                else{
                    res.status(403).json("This user is already in your friend list.")
                    // this needs to be sent as pop up its important
                }
            }
            else{
                res.status(403).json("You have blocked this user or they have blocked you.");
            }
        }
        catch(err){
            res.status(500).json(err);
        }
    }
    else{
        res.status(403).json("you cant send yourself a friend request")
    }
})


// Cancel friend request 
router.put("/:id/cancelFriendRequest", verifyToken, async (req,res) => {
    if (req.body.userId !== req.params.id){ 
        try{
            const user = await User.findById(req.params.id);

            if (user.friendRequests.includes(req.body.userId)){
                await user.updateOne({$pull: {friendRequests: req.body.userId}})
                res.status(200).json("friend request cancelled.")
            }
            else{
                res.status(403).json("You already have cancelled the friend request for this user or the other way around.")
            }
        }
        catch(err){
            res.status(500).json(err);
        }
    }
    else{
        res.status(403).json("you cant send yourself a friend request")
    }
})


// Add a user as friend
router.put("/:id/addfriend", verifyToken, async (req,res)=> {
    if (req.body.userId !== req.params.id){
        try{
            const user = await User.findById(req.params.id);
            const currentuser = await User.findById(req.body.userId);

            if ((!currentuser.blockList.includes(req.params.id)) && (!user.blockList.includes(req.body.userId))){
                if(!user.friends.includes(req.body.userId)){
                    await user.updateOne({$push:{friends: req.body.userId}});
                    await currentuser.updateOne({$push:{friends: req.params.id}});
                    res.status(200).json("user has been added to your friend list");
                }
                else{
                    res.status(403).json("You already have this user in your friend list.");
                }
            }
            else{
                res.status(403).json("You have blocked this user or they have blocked you.");
            }

        }
        catch(err){
            res.status(500).json(err);
        }
    }
    else{
        res.status(403).json("you can not add yourself as a friend");
    }
})


// Remove a user from friendlist
router.put("/:id/removefriend", verifyToken, async (req,res)=> {
    if (req.body.userId !== req.params.id){
        try{
            const user = await User.findById(req.params.id);
            const currentuser = await User.findById(req.body.userId);

            if(user.friends.includes(req.body.userId)){
                await user.updateOne({$pull:{friends: req.body.userId}})
                await currentuser.updateOne({$pull:{friends: req.params.id}})
                res.status(200).json("user has been removed from your friend list")
            }
            else{
                res.status(403).json("This person is not in your friend list.")
            }
        }
        catch(err){
            res.status(500).json(err);
        }
    }
    else{
        res.status(403).json("You can not remove yourself from your friend list");
    }
})

// block or unblock a user
router.put("/:id/blockUnblockUser", verifyToken, async (req,res) => {
    if (req.body.userId !== req.params.id){
        try{
            const currentUser = await User.findById(req.body.userId);
            const theOtherUser = await User.findById(req.params.id);
            
            if (currentUser.blockList.includes(req.params.id)){
                await currentUser.updateOne({$pull:{blockList: req.params.id}});
                res.status(200).json("User has been removed from your block list!");
            }
            else{
                if(currentUser.friends.includes(req.params.id)){
                    // first removing from our friend list then below blocking them  also need to check friend requests to delete them also          
                    await currentUser.updateOne({$pull:{friends: req.params.id}});
                    await theOtherUser.updateOne({$pull:{friends: req.body.userId}});

                    await currentUser.updateOne({$push:{blockList: req.params.id}});
                    res.status(200).json("User has been blocked!");
                }
                else{
                    await currentUser.updateOne({$push:{blockList: req.params.id}});
                    res.status(200).json("User has been blocked!");
                }
            }
        }
        catch(err){
            res.status(500).json(err);
        }
    }
    else{
        res.status(403).json("You can not block yourself!");
    }
})

module.exports = router