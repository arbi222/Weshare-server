const router = require("express").Router();
const https = require("https");
const { verifyToken } = require("../token");

// Make a weather request
router.post("/", verifyToken, async (req,res)=> {

    const weatherApi = process.env.WEATHER_API_KEY;
    const cityName = req.body;
    const units = "metric";

    const url = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName.city + "&units=" + units + "&appid=" + weatherApi + "";
    
    try{
        https.get(url, function(response){
            response.on("data", function(data){
                const weatherData = JSON.parse(data);
                if (weatherData.cod !== "404"){
                    res.status(200).json(weatherData);
                }
                else{
                    res.status(403).json("The city does not exist or it is misspelled!");
                }
            })
        })
    }
    catch(err){
        res.status(500).json(err);
    }
})

module.exports = router;