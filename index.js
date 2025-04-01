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
const http = require("http");
const socketIo = require("socket.io");

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


const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: ["https://wesharemedia.onrender.com", "https://wesharemessenger.onrender.com"],
  },
});


let users = []

const addUser = (userId, socketId) => {
    const user = users.find(user => user.userId === userId);
    if (user){
        if (!user.socketIds.includes(socketId)){
            user.socketIds.push(socketId);
        }
    }
    else{
        users.push({userId, socketIds: [socketId]});
    }
}

const removeUser = (socketId) => {
    users = users.map(user => {
        user.socketIds = user.socketIds.filter(id => id !== socketId);
        return user;
    }).filter(user => user.socketIds.length > 0);
}

const getUser = (userId) => {
    return users.find(user => user.userId === userId)
}

io.on("connection", (socket) => {
    console.log("a user connected!")
    
    socket.on("addUser", userId => {
        addUser(userId, socket.id)
        io.emit("getUsers", users);
    })
  
    // Handle WebRTC offer
    socket.on("sendOffer", ({callerId, receiverId, callType, chatId, offer }) => {
        const currentUser = getUser(callerId);
        const otherUser = getUser(receiverId);
        if (otherUser) {
            otherUser.socketIds.forEach((socketId) => {
                io.to(socketId).emit("receiveOffer", { callerId, callType, chatId, offer });
            });
        }
        else{
            currentUser.socketIds.forEach(socketId => {
                io.to(socketId).emit("callingThem", {
                    state: "offline",
                })
            })
        }
    });

    // Handle WebRTC answer
    socket.on("sendAnswer", ({ receiverId, answer }) => {
        const otherUser = getUser(receiverId);
        if (otherUser) {
            otherUser.socketIds.forEach((socketId) => {
                io.to(socketId).emit("receiveAnswer", { answer });
            });
        }
    });

    // Handle ICE candidate exchange
    socket.on("sendIceCandidate", ({ receiverId, candidate }) => {
        const otherUser = getUser(receiverId);
        if (otherUser) {
            otherUser.socketIds.forEach((socketId) => {
                io.to(socketId).emit("receiveIceCandidate", { candidate });
            });
        }
    });

    socket.on("toggleCamera", ({receiverId, status}) => {
        const otherUser = getUser(receiverId);
        if (otherUser) {
          otherUser.socketIds.forEach((socketId) => {
            io.to(socketId).emit("toggleCamera", { status });
          });
        }
    })

    socket.on("endCall", ({ receiverId, senderId, status }) => {
        const otherUser = getUser(receiverId);
        if (otherUser) {
          otherUser.socketIds.forEach((socketId) => {
            io.to(socketId).emit("callEnded", { status, senderId });
          });
        }
    });

    
    // send and get message
    socket.on("sendMessage", ({senderId, receiverId, text, callType, callDuration, callInfo, fileUrl, fileType, fileName}) => {
        const otherUser = getUser(receiverId);
        if (otherUser){
            otherUser.socketIds.forEach(socketId => {
                io.to(socketId).emit("getMessage", {
                    senderId,
                    text,
                    fileUrl,
                    fileType,
                    fileName,
                    callType,
                    callDuration,
                    callInfo
                })
            })
        }
    })

    socket.on("seeMessage", ({senderId, receiverId, haveSeen}) => {
        const otherUser = getUser(receiverId);
        if (otherUser){
            otherUser.socketIds.forEach(socketId => {
                io.to(socketId).emit("haveSeenMessage", {
                    senderId,
                    haveSeen
                })
            })
        }
    })

    // update and get conversations
    socket.on("updateConversation", ({conversationOwner, receiverId, chatId, lastMessage}) => {
        const otherUser = getUser(conversationOwner);
        if (otherUser){
            otherUser.socketIds.forEach(socketId => {
                io.to(socketId).emit("getConversation", {
                    conversationOwner,
                    receiverId,
                    chatId,
                    lastMessage,
                    isSeen: false,
                })
            })
        }
    })

    // blocking users
    socket.on("blockUser", ({currentUserId, theBlockedOneId}) => {
        const currentUser = getUser(currentUserId);
        const otherUser = getUser(theBlockedOneId);

        currentUser.socketIds.forEach(socketId => {
            io.to(socketId).emit("getBlockedState", {
                state: "blockedByYou",
                theOtherUserId: theBlockedOneId
            })
        })
        
        if (otherUser){
            otherUser.socketIds.forEach(socketId => {
                io.to(socketId).emit("getBlockedState", {
                    state: "blockedByThem",
                    theOtherUserId: currentUserId
                })
            })
        }
    })

    // unBlocking users
    socket.on("unBlockUser", ({currentUserId, theBlockedOneId}) => {
        const currentUser = getUser(currentUserId);
        const otherUser = getUser(theBlockedOneId);

        currentUser.socketIds.forEach(socketId => {
            io.to(socketId).emit("getUnBlockedState", {
                state: "",
                theOtherUserId: theBlockedOneId
            })
        })
        
        if (otherUser){
            otherUser.socketIds.forEach(socketId => {
                io.to(socketId).emit("getUnBlockedState", {
                    state: "",
                    theOtherUserId: currentUserId
                })
            })
        }
    })

    // send and get notifications
    socket.on("sendNotification", (notification) => {
        const otherUser = getUser(notification.receiverId);
        if (otherUser){
            otherUser.socketIds.forEach(socketId => {
                io.to(socketId).emit("getNotification", {
                    authorId: notification.authorId,
                    postId: notification.postId,
                    content: notification.content
                })
            })
        }
    })

    // remove notification
    socket.on("removeNotification", (notification) => {
        const otherUser = getUser(notification.receiverId);
        if (otherUser){
            otherUser.socketIds.forEach(socketId => {
                io.to(socketId).emit("updateNotifications", {
                    authorId: notification.authorId,
                    postId: notification.postId,
                    forLikePurpose: notification.forLikePurpose,
                    friendRequest: notification.friendRequest,
                    content: notification.content
                })
            })
        }
    })

    
    // when disconnected
    socket.on("disconnect", () => {
        console.log("a user disconnected!")
        removeUser(socket.id)
        io.emit("getUsers", users);
    })
})


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
server.listen(port, () => {
  console.log(`Backend Server is running on port ${port}`);
});
