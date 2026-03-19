//entry point of the application

import dotenv from "dotenv";
import {connectDB} from "./db/connectDB.js";
import {app} from "./app.js";

dotenv.config();

connectDB()
.then(()=>{
    app.on("error",(err)=> {
        console.log("Server crashed !",err);
        process.exit(1);
    })

    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port ${process.env.PORT}`)
    })
})
.catch((err) =>{
    console.log("DB connection failed!!!", err);
    
})