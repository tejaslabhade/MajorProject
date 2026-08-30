const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const Listing = require("../models/listing.js");

const MONGO_URL =
  "mongodb+srv://tejaslabhade2_db_user:Tejas123@cluster0.uuie24p.mongodb.net/?appName=Cluster0";

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to DB");

  // Delete all existing listings
  await Listing.deleteMany({});

  console.log("All existing listings deleted successfully");

  await mongoose.connection.close();
  console.log("Database connection closed");
}

main().catch((err) => {
  console.log("Error:", err);
});