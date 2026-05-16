# WeShare — Backend Server

> Shared Node.js backend powering both the WeShare Social Media platform and the WeShare Messenger. Handles REST APIs, real-time communication via Socket.io, and WebRTC signaling for voice and video calls.

🌐 **Social Media App:** [wesharemedia.onrender.com](https://wesharemedia.onrender.com)  
💻 **Social Client Repo:** [Weshare-client](https://github.com/arbi222/Weshare-client)

🌐 **Messenger App:** [wesharemessenger.onrender.com](https://wesharemessenger.onrender.com) 
💬 **Messenger Client Repo:** [Weshare-messenger](https://github.com/arbi222/Weshare-messenger)

---

## What Is WeShare?

WeShare is a system of two independent frontend applications — a social media platform and a real-time messenger — both powered by this single backend. The server exposes REST APIs consumed by both apps and manages all real-time functionality through Socket.io, including messaging, notifications, and WebRTC signaling for peer-to-peer voice and video calls.

---

## Features

### REST API
- User authentication and profile management
- Post creation, editing, and deletion
- Media handling with Firebase Storage (images, videos)
- User blocking system
- Friendship / follow system

### Real-Time (Socket.io)
- Instant messaging between users
- Online presence and last-seen tracking
- Real-time notifications for both apps
- WebRTC signaling server for voice and video calls (offer, answer, ICE candidates)

### Voice & Video Calling
- WebRTC peer-to-peer calling with STUN server configuration
- Signaling handled entirely through Socket.io
- Supports both voice-only and video calls

### Messaging Features
- Text messages in real time
- Image, video, audio clip, and GIF sharing
- User blocking — blocked users cannot send messages

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Real-Time | Socket.io |
| WebRTC Signaling | Socket.io |
| File Storage | Firebase Admin SDK |
| Authentication | JWT |

---

## Architecture

This single backend serves two completely independent frontend applications:

```
              ┌─────────────────────────┐
              │      WeShare Server     │
              │ (REST API + Socket.io)  │
              └────────────┬────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
   ┌────────▼────────┐          ┌─────────▼─────────┐
   │  Weshare-client │          │ Weshare-messenger │
   │  (Social Media) │          │  (Messenger App)  │
   └─────────────────┘          └───────────────────┘
```

---

## Author

**Arbi Hamolli** — Full-Stack Web Developer  
[arbihamolli.com](https://arbihamolli.com) · [LinkedIn](https://linkedin.com/in/arbi-hamolli) · [GitHub](https://github.com/arbi222)
