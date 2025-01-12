const router = require("express").Router();
const { generateAccessToken , generateRefreshToken } = require("../token");
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const passport = require("passport");

passport.use(User.createStrategy());

// serializing user loging in and out
passport.serializeUser(function(user , done){
    done(null , user.id);
  });
passport.deserializeUser(function(id, done){
    User.findById(id , function(err ,user){
        done(err , user);
    });
});


// Register
router.post("/register", async (req,res) => {
    try{
        const user = await User.findOne({username: req.body.username}); 

        if (user){
            res.status(403).json("This email is already in use by another user!");
        }
        else{
            User.register({
                firstName: req.body.firstName.charAt(0).toUpperCase() + req.body.firstName.slice(1),
                lastName: req.body.lastName.charAt(0).toUpperCase() + req.body.lastName.slice(1),
                username: req.body.username,
                age: req.body.age,
                gender: req.body.gender,
            }, req.body.password, async function(err, user){
                if (err){
                    console.log(err)
                }
                else{
                    await passport.authenticate("local")(req, res, function(){
                        res.status(200).json(user)
                    })
                }
            })
        }
    }
    catch (err){
        res.status(500).json(err);
    }
})


router.post("/refreshToken", async (req,res)=> {
    const refreshToken = req.cookies.refreshToken;
  
    if (!refreshToken){
        return res.status(401).json("You are not authenticated!");
    }

    try{
        jwt.verify(refreshToken, `${process.env.REFRESH_TOKEN_KEY}`, async (err, user)=> {
            if (err){
                res.status(403).json("Refresh Token is not valid!")
            }
            
            const newAccessToken = generateAccessToken(user)
            const newRefreshToken = generateRefreshToken(user)

            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: false,
                secure: false,
                sameSite: "strict",
                path: "/"
            })
    
            res.status(200).json({accessToken: newAccessToken});
        })
    }
    catch(err){
        console.log(err);
    }
})

// Login
router.post("/login", async (req,res) => {
    try{
        const user = await User.findOne({username: req.body.username});

        req.login(user, async function(err){
            if (err){
              res.status(404).send("Wrong email or user does not exist!");
            }
            else{
              await passport.authenticate("local")(req ,res , async function(){

                const accessToken = generateAccessToken(user);
                const refreshToken = generateRefreshToken(user);

                res.cookie("refreshToken", refreshToken, {
                    httpOnly: false,
                    secure: false,
                    sameSite: "strict",
                    path: "/"
                })

                const {updatedAt, ...userInfo} = user._doc;
   
                res.status(200).json({
                    userInfo, 
                    accessToken,
                });
              })
            }
          })
    }
    catch(err){
        res.status(500).json(err);
    }
})


router.get("/logout" , async (req,res) => {
    
    req.logout(function (err){
        if (err){
            return err;
        }
        else{
            res.clearCookie("refreshToken");
            res.clearCookie("accessToken");
            res.status(200).json("user logged out");
        }
    })
 
})

module.exports = router;
