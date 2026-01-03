import mongoose from "mongoose";

const connectDB = async ()=>{
    mongoose.connection.on('connected',()=>{
        console.log("DataBase Connected Successfully - mongodb Atlas");

    })
    const uri = process.env.MONGODB_URI ? String(process.env.MONGODB_URI).trim() : "";
    if (!uri) {
        throw new Error("MONGODB_URI is missing in environment variables");
    }
    await mongoose.connect(uri);
}

export default connectDB;