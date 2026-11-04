import dns from "dns"
dns.setServers(["1.1.1.1", "8.8.8.8"]);
import mongoose from "mongoose";


const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL)
    console.log(" db connected ");
    
  } catch (error) {
    console.log(`db error ${error}`);
    
  }
}

export default connectDb