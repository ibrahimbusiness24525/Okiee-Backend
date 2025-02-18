require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");


const adminRoutes = require("./routes/LoginRoute.js");
const addPhoneRoutes = require("./routes/AddMobilePhoneRoute.js");
const invoicesRoutes = require("./routes/InvoiceRoute.js");
const shopRoutes = require("./routes/ShopRoute.js");
const purchasePhone = require("./routes/purchasePhoneRoute.js");
const connectDB = require("./config/db.js");
const ledgerRouter = require("./routes/LedgerRoutes.js");

const PORT = process.env.PORT || 8080;
const app = express();

connectDB();

app.use(cors());
// app.use(cors({
//     origin: 'https://www.okiiee.com', 
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], 
//     allowedHeaders: ['Content-Type', 'Authorization'], 
//   }));
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
app.use("/api/Purchase", purchasePhone);
app.use("/api/ledger", ledgerRouter);
app.listen(PORT, () => console.log(`Server listening to port ${PORT}`));
