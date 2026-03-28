const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.log("MONGO_URI is not set. Running with demo in-memory data.");
    return false;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected.");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed. Falling back to demo data.");
    console.error(error.message);
    return false;
  }
};

module.exports = connectDB;
