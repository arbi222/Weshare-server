const router = require("express").Router();
const User = require("../models/User")
const nodeMailer = require("nodemailer");
const crypto = require('crypto');


const transporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.WESHARE_EMAIL,
        pass: process.env.WESHARE_PASS_CODE
    }
})

router.post("/forgotPassword", async (req,res) => {
    const email = req.body.email;

    const user = await User.findOne({username: email});

    if (!user) {
        return res.status(400).json("User with this email does not exist!")
    }

    const token = crypto.randomBytes(25).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 600000 // 10 min

    const mailOptions = {
        from: process.env.WESHARE_EMAIL,
        to: user.username,
        subject: 'Password Reset for Weshare',
        text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process within 10 minutes of receiving it:\n\nhttps://wesharemedia.onrender.com/reset-password/${token}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`
      };

    transporter.sendMail(mailOptions, (err, response) => {
        if (err){
            console.log(err);
            res.status(500).json('Error sending email!');
        }
        else{
            user.save();
            res.status(200).json("Recovery email sent!");
        }
    })
})


router.post("/resetPassword/:token", async (req,res) => {

    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()}
    })

    if (!user) {
        return res.status(400).json("Password reset token is invalid or has expired!")
    }
                                       
    if (req.body.newPassword === req.body.confirmPassword){
        user.setPassword(req.body.newPassword, (err, userUpdate) => {
            if (err){
                res.status(500).json("Error setting new password!")
            }
            else{
                user.hash = userUpdate.hash;
                user.salt = userUpdate.salt;
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                user.save();
            }
        })
        res.status(200).json("Password changed!")
    }
    else{
        res.status(400).json("Passwords do not match!")
    }

})

module.exports = router;
