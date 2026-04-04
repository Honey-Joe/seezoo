const express = require("express");
const connectDB = require("./config/db.js")
const dotenv = require("dotenv");

dotenv.config();
const app = express();
connectDB();


app.get("/" , (req,res)=>{
    res.send("API is working")
})


const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});