const mongoose = require("mongoose");
const { Person } = require("../schema/PayablesAndReceiveablesSchema");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://ibrahimgujjar24525:Qo4iE6mC4k5YORqP@cluster0.8sqiu.mongodb.net/"
    );
    await Person.updateMany(
      { favourite: { $exists: false } },
      { $set: { favourite: false } }
    );

    console.log("MongoDB connected...");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
