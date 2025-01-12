const mongoose = require("mongoose")
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true,
    },
    middleName:{
        type: String,
        default: ""
    },
    lastName:{
        type: String,
        required: true,
    },
    username:{ // this is the email
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    isTwoFactorAuthOn: {
        type: Boolean,
        default: false
    },
    twoFactorAuthCode: {
        type: String,
    },
    mobileNumber:{
        type: String,
        default: ""
    },
    profilePicture:{
        type: String,
        default: ""
    },
    coverPicture:{
        type: String,
        default: ""
    },
    images:{
        type: Array,
        default: []
    },
    videos:{
        type: Array,
        default: []
    },
    age:{
        type: Number,
        required: true,
        min: 16,
    },
    gender:{
        type: String,
        required: true,
    },
    bio:{
        type: String,
        max: 130,
        default: ""
    },
    work:{
        type: String,
        default: "",
        max: 70,
    },
    school:{
        type: String,
        default: "",
        max: 70,
    },
    state:{
        type: String,
        default: "",
        max: 70,
    },
    city:{
        type: String,
        default: "",
        max: 70,
    },
    relationship:{
        type: String,
        default: "",
    },
    friends:{
        type: Array,
        default: []
    },
    friendRequests:{
        type: Array,
        default: []
    },
    blockList:{
        type: Array,
        default: []
    },
    isAdmin:{
        type: Boolean,
        default: false
    }
},
{timestamps: true}
);

UserSchema.index({ firstName: 'text', lastName: 'text', middleName: "text" });

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema)