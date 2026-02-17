import mongoose from "mongoose";

export * from "./models";

export const connectToDatabase = async (uri: string) => {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB at", uri);
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    process.exit(1);
  }
};
