const router = require("express").Router();
const User = require("../models/User")
const crypto = require('crypto');
const formData = require("form-data");
const Mailgun = require("mailgun.js");
const { verifyToken } = require("../token");
const { generateAccessToken } = require("../token");

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_SENDER_API_KEY,
  url: "https://api.eu.mailgun.net"
});

router.post("/sendEmailLoginCode", async (req,res) => {
    const email = req.body.email;

    try{
        const user = await User.findOne({username: email});
    
        if (!user) {
            return res.status(400).json("User with this email does not exist!")
        }
    
        const authCode = crypto.randomBytes(4).toString("hex");
        
        user.twoFactorAuthCode = authCode;
        await user.save();
    
        await mg.messages.create(process.env.MAILGUN_DOMAIN, {
            from: `"Weshare Support" <noreply@${process.env.MAILGUN_DOMAIN}>`,
            to: [user.username],
            subject: "Two-Factor-Authentication Code",
            text: `The Authentication code to login into your Weshare account is:\n\n 
                                       ${authCode}`
        });
        
        return res.status(200).json("Authentication code sent to your email!"); 
    }
    catch(err){ 
        res.status(500).json(err);
    }
})

router.post("/verifyLoginAuthCode/:authCode", async (req,res) => {

    const user = await User.findOne({
        twoFactorAuthCode: req.params.authCode,
        username: req.body.email   
    });

    if (!user) {
        return res.status(400).json("Auth code is invalid!");
    }
    else{
        user.twoFactorAuthCode = undefined;
        await user.save();
        const accessToken = generateAccessToken(user);
        res.status(200).json(accessToken);
    }                                  
})


router.post("/sendEmailCode", verifyToken, async (req,res) => {
    const email = req.body.email;

    try{
        const user = await User.findOne({username: email});
    
        if (!user) {
            return res.status(400).json("User with this email does not exist!")
        }
    
        const authCode = crypto.randomBytes(4).toString("hex");
        
        user.twoFactorAuthCode = authCode;
        await user.save();
    
        if (user.isTwoFactorAuthOn) {
            await mg.messages.create(process.env.MAILGUN_DOMAIN, {
                from: `"Weshare Support" <noreply@${process.env.MAILGUN_DOMAIN}>`,
                to: [user.username],
                subject: "Two-Factor-Authentication Deactivator",
                text: `The Authentication code to deactivate the Two-Factor-Authentication for your Weshare account is:\n\n 
                                           ${authCode}`
            });
        }
        else{
            await mg.messages.create(process.env.MAILGUN_DOMAIN, {
                from: `"Weshare Support" <noreply@${process.env.MAILGUN_DOMAIN}>`,
                to: [user.username],
                subject: "Two-Factor-Authentication Activator",
                text: `The Authentication code to activate the Two-Factor-Authentication for your Weshare app is:\n\n 
                                           ${authCode}`
            });
        }
    
        return res.status(200).json("Authentication code sent to your email!"); 
    }
    catch(err){
        res.status(500).json(err);
    }
})

router.post("/verifyAuthCode/:authCode", verifyToken, async (req,res) => {

    const user = await User.findOne({
        twoFactorAuthCode: req.params.authCode,
        username: req.body.email   
    });

    var responseString = "";

    if (!user) {
        return res.status(400).json("Auth code is invalid!")
    }
    else{
        if (user.isTwoFactorAuthOn){
            user.isTwoFactorAuthOn = false;
            responseString = "Two Factor Authentication is now deactivated!";
        }
        else{
            user.isTwoFactorAuthOn = true;
            responseString = "Two Factor Authentication is now activated!";
        }

        user.twoFactorAuthCode = undefined;
        await user.save();

        res.status(200).json(responseString);
    }                                  
})

module.exports = router;