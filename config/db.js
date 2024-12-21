const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // waqasishaq800
    // tl0s4uJp5ZeY8RGt
     await mongoose.connect('mongodb+srv://waqasishaq800:tl0s4uJp5ZeY8RGt@cluster0.fv4zx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('MongoDB connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
