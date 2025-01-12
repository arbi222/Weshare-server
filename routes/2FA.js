const router = require("express").Router();
const User = require("../models/User")
const nodeMailer = require("nodemailer");
const crypto = require('crypto');
const { verifyToken } = require("../token");
const { generateAccessToken } = require("../token");


const transporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.WESHARE_EMAIL,
        pass: process.env.WESHARE_PASS_CODE
    }
})


router.post("/sendEmailLoginCode", async (req,res) => {
    const email = req.body.email;

    const user = await User.findOne({username: email});

    if (!user) {
        return res.status(400).json("User with this email does not exist!")
    }

    const authCode = crypto.randomBytes(4).toString("hex");
    
    user.twoFactorAuthCode = authCode;
    await user.save();

    const mailOptions = {
        from: process.env.WESHARE_EMAIL,
        to: user.username,
        subject: 'Two-Factor-Authentication Code',
        text: `The Authentication code to login into your Weshare account is:\n\n 
                                   ${authCode}`
    };
    
    transporter.sendMail(mailOptions, (err, response) => {
        if (err){
            res.status(500).json('Error sending email!');
        }
        else{
            res.status(200).json("Authentication code sent to your email!");
        }
    })
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

    const user = await User.findOne({username: email});

    if (!user) {
        return res.status(400).json("User with this email does not exist!")
    }

    const authCode = crypto.randomBytes(4).toString("hex");
    
    user.twoFactorAuthCode = authCode;
    await user.save();

    if (user.isTwoFactorAuthOn) {
        var mailOptions = {
            from: process.env.WESHARE_EMAIL,
            to: user.username,
            subject: 'Two-Factor-Authentication Deactivator',
            text: `The Authentication code to deactivate the Two-Factor-Authentication for your Weshare app is:\n\n 
                                       ${authCode}`
        };
    }
    else{
        var mailOptions = {
            from: process.env.WESHARE_EMAIL,
            to: user.username,
            subject: 'Two-Factor-Authentication Activator',
            text: `The Authentication code to activate the Two-Factor-Authentication for your Weshare app is:\n\n 
                                       ${authCode}`
        };
    }
    
    transporter.sendMail(mailOptions, (err, response) => {
        if (err){
            res.status(500).json('Error sending email!');
        }
        else{
            res.status(200).json("Authentication code sent to your email!");
        }
    })
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