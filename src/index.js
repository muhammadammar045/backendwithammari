import dotenv from "dotenv";
import connectDb from "./db/conn.js";
import app from "./app.js";

dotenv.config({ path: "../env" })


connectDb()
    .then(() => {
        app.listen(process.env.PORT || 5000,
            () => { console.log(`App is listening on Port : http://localhost:${process.env.PORT}`) }
        )
    })
    .catch((error) => {
        console.log(`Mongo Connection Failed  :: ${error}`);
    })