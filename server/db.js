import mongoose from "mongoose";
let connection;
export async function connectDB() {
  if (!process.env.MONGODB_URI)
    throw Object.assign(
      new Error(
        "Cloud accounts are not configured yet. Explore the synthetic demo instead.",
      ),
      { status: 503, code: "DATABASE_NOT_CONFIGURED" },
    );
  connection ??= mongoose
    .connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || "chroniccare_demo",
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    })
    .catch((e) => {
      connection = undefined;
      throw e;
    });
  return connection;
}
