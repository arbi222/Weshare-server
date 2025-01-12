const jwt = require("jsonwebtoken")

const generateAccessToken = (user) => {
    return jwt.sign(
        {id: user.id, isAdmin: user.isAdmin}, 
        `${process.env.ACCESS_TOKEN_KEY}`,
        {expiresIn: "3m"}
    );
}

const generateRefreshToken = (user) => {
    return jwt.sign(
        {id: user.id, isAdmin: user.isAdmin}, 
        `${process.env.REFRESH_TOKEN_KEY}`,
        {expiresIn: "4h"}
    );
}

const verify = (req,res,next) => {
    const authHeader = req.headers.authorization;
    if (authHeader){
        const token = authHeader.split(" ")[1];

        jwt.verify(token, `${process.env.ACCESS_TOKEN_KEY}`, (err,user) => {
            if (err){
                return res.status(403).json("Token is not valid");
            }
            
            req.user = user;
            next();
        })
    }
    else{
        res.status(401).json("You are not authenticated");
    }
}

module.exports = {
    generateAccessToken: generateAccessToken,
    generateRefreshToken: generateRefreshToken,
    verifyToken: verify
}