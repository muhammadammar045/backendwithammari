import mongoose from 'mongoose'
import { DBNAME } from '../constants.js'

const connectDb = async () => {
    try {
        const db = await mongoose.connect(`${process.env.MONGO_URI}/${DBNAME}`)
        console.log(`MongoDB Connected Successfully !! Database Host : ${db.connection.host}`)
    } catch (error) {
        console.error("MongoDB Connection Failed : " + error)
        process.exit(1)
    }

}

export default connectDb;