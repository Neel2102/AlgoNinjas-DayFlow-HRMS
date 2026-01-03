import mongoose from "mongoose";

const connectDB = async ()=>{
    mongoose.connection.on('connected',()=>{
        console.log("DataBase Connected Successfully - mongodb Atlas");

    })
    await mongoose.connect(`${process.env.MONGODB_URI}`);
}

export default connectDB;