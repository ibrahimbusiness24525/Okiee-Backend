const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

const adminRoutes = require("./routes/LoginRoute.js");
const addPhoneRoutes = require("./routes/AddMobilePhoneRoute.js");
const invoicesRoutes = require("./routes/InvoiceRoute.js");
const shopRoutes = require("./routes/ShopRoute.js");
const connectDB = require("./config/db.js");

const PORT = process.env.PORT || 8080;
const app = express();

connectDB();

app.use(cors({
    origin: 'https://okiee.vercel.app'
}));app.use(bodyParser.json());
app.use(express.json());
app.use(express.json({ limit: "50mb" }));  // Increase payload limit
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/", (req, res) => {
    res.json({
        message: "This is a dummy test route. Your server is running fine!",
        status: "success"
    });
});
app.use("/api/admin", adminRoutes);
app.use("/api/phone", addPhoneRoutes);
app.use("/api/invoice", invoicesRoutes);
app.use("/api/shop", shopRoutes);
app.listen(PORT, () => console.log(`Server listening to port ${PORT}`));
