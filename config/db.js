const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // waqasishaq800
    // tl0s4uJp5ZeY8RGt
     await mongoose.connect('mongodb+srv://ibrahimgujjar24525:Qo4iE6mC4k5YORqP@cluster0.8sqiu.mongodb.net/');
    console.log('MongoDB connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
