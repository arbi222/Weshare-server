const express = require("express");
const app = express()
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const cookieParser = require("cookie-parser")
const helmet = require("helmet")
const morgan = require("morgan")
const passport = require("passport")
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const cron = require("cron");
const https = require("https");

dotenv.config()

const authRoute  = require("./routes/auth")
const resetPassRoute = require("./routes/resetPass");
const twoFactorAuthRoute = require("./routes/2FA");
const userRoute = require("./routes/users")
const postRoute = require("./routes/posts")
const commentRoute = require("./routes/comments")
const notificationRoute = require("./routes/notifications")
const weatherRoute = require("./routes/weather")
const conversationsRoute = require("./routes/conversations")
const chatsRoute = require("./routes/chats")


mongoose.connect(process.env.MONGO_URL);

const corsOptions = {
  origin: ["https://wesharemedia.onrender.com", "https://wesharemessenger.onrender.com"],
  credentials: true,
};

// middleware
app.use(express.json())
app.use(cookieParser())
app.use(cors(corsOptions));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"))


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoute)
app.use("/api/reset", resetPassRoute)
app.use("/api/twoFactor", twoFactorAuthRoute)
app.use("/api/users", userRoute)
app.use("/api/posts", postRoute)
app.use("/api/comments", commentRoute)
app.use("/api/notifications", notificationRoute)
app.use("/api/weather", weatherRoute)
app.use("/api/conversations", conversationsRoute)
app.use("/api/chats", chatsRoute)

// Adding a cron job to keep my server alive because the host (Render) on free usage will make my server inactive 
// if no request is being made in 10-15 minutes.
const backendUrl = "https://weshare-server.onrender.com";
const job = new cron.CronJob('*/8 * * * *', function(){
  https.get(backendUrl, (res) => {
    if (res.statusCode === 200){
      console.log("server restarted")
    }
  }).on("error", (err) => {
      console.log("error");
  })
})
job.start();

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Backend Server is running on port ${port}`);
});
