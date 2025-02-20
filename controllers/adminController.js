const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const nodemailer = require('nodemailer');
const UserSchema = require("../schema/UserSchema");
const {generateAuthToken} = require("../services/authServices");
exports.register = async (req, res) => {
  // const accountId = req.params.accountId
  const { username, email, password, role } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await UserSchema.findOne({
      $or: [{ username: username }, { email: email }]
    });

    if (user) {
      return res.status(400).json({ message: "User with this username or emali already exists!" });
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserSchema({
      email,
      role,
      username,
      password: hashedPassword,
      // accountId,
      otp,
    });
    const savedUser = await newUser.save();
    const token = await generateAuthToken(savedUser);
    return res.status(201).json({
      message: "User registered successfully!",
      user: savedUser,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Internal server error, please try again",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body; // Expecting shopid and password from frontend.  

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find the user by either shop ID or username.
    const user = await UserSchema.findOne({
      $or: [{ email: username }, { username: username }],
    }).exec();

    if (!user) {
      return res.status(404).json({ message: "Wrong credentials provided, please try again" });
    }

    if (!user.active) {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong credentials provided, please try again" });
    }
    if(isMatch){
      const token = await generateAuthToken(user);
      return res.status(200).json({
        message: "Logged in successfully",
        redirect: "/dashboard",
        data: user,
        token,
      });
    }

    // return res.status(200).json({
    //   message: "Logged in successfully",
    //   redirect: "/dashboard",
    //   data: user,
    // });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error, please try again",
      error: error.message,
    });
  }
};

exports.getAllUsersExceptCurrent = async (req, res) => {
  const { user } = req.body;

  if (!user) {
    return res.status(400).json({
      message: "User data is required in the request body",
    });
  }

  try {
    let users = [];

    if (user.role === 'superadmin') {
      // Get all users except the current superadmin
      users = await UserSchema.find({ _id: { $ne: user._id } }).select('-password');
    } else if (user.role === 'admin') {
      // Get users who have the same accountId as the admin
      users = await UserSchema.find({ accountId: user._id}).select('-password');
    }

    return res.status(200).json({
      message: users.length ? "Users retrieved successfully" : "No User Found",
      data: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error, please try again",
      error: error.message,
    });
  }
};


exports.updateUser = async (req, res) => {
  const { role, _id } = req.body;

  try {
    // Check if the user exists
    const existingUser = await UserSchema.findById(_id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the role only if it's provided
    if (role !== undefined) {
      existingUser.role = role;
    } else {
      return res.status(400).json({ message: "Role is required for updating" });
    }

    // Save updated user information
    const updatedUser = await existingUser.save();
    res.status(200).json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error, please try again",
      error: error.message,
    });
  }
};

exports.toggleUserStatus = async (req, res) => {
  const { active, _id } = req.body; // Expecting a boolean value for isActive

  try {
    // Check if the user exists
    const user = await UserSchema.findById(_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the isActive status
    user.active = active ? false : true;
    const updatedUser = await user.save();

    res.status(200).json({
      message: `User ${updatedUser.active ? "activated" : "deactivated"} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error, please try again",
      error: error.message,
    });
  }
};


exports.updatePassword = async (req, res) => {
  const { newPassword } = req.body;
  const { userId } = req.params;

  try {
    // Check if the user exists and get their current password
    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prompt user to enter their current password to confirm
    // const currentPasswordFromDB = user.password;

    // Ensure the new password is provided
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    // Verify the current password
    // const isMatch = await bcrypt.compare(currentPasswordFromDB, user.password);
    // if (!isMatch) {
    //   return res.status(400).json({ message: "Current password is incorrect" });
    // }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Save the updated user information
    await user.save();
    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error, please try again",
      error: error.message,
    });
  }
};


exports.sendEmail = async (req, res) => {
    const { name, recipientEmail, subject, message } = req.body;

    // Set up the transporter with Gmail settings
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ibrahimgujjar24525@gmail.com', // Your Gmail address
            pass: 'hefc gcio qvlq ozcd',            // Your Gmail app password
        },
    });

    // Define email options with a clear structure for the message
    const mailOptions = {
        from: recipientEmail,                  // Sender's email (provided by user)
        to: 'ibrahimgujjar24525@gmail.com',     // Your receiving email address
        subject: subject || 'No Subject',      // Default subject if empty
        text: `Name: ${name}\nEmail: ${recipientEmail}\n\nMessage:\n${message}`,
    };

    try {
        // Send the email
        await transporter.sendMail(mailOptions);
        
        // Send a success response
        res.status(200).json({
            message: 'Email sent successfully',
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            message: 'Failed to send email',
            error: error.message,
        });
    }
};




