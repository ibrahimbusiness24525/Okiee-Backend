require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const adminRoutes = require("./routes/LoginRoute.js");
const addPhoneRoutes = require("./routes/AddMobilePhoneRoute.js");
const invoicesRoutes = require("./routes/InvoiceRoute.js");
const shopRoutes = require("./routes/ShopRoute.js");
const dayBookRoutes = require("./routes/DayBookRoute.js");
const committeeRoute = require("./routes/CommitteeLedger.js");
const purchasePhone = require("./routes/purchasePhoneRoute.js");
const ledgerRouter = require("./routes/LedgerRoutes.js");
const partyLedgerRouter = require("./routes/PartyLedgerRoute.js");
const bankRouter = require("./routes/bankRoute.js");
const personRouter = require("./routes/payablesAndReceiveablesRoutes.js");
const accessoryRouter = require("./routes/accessoryRoute.js");
const pocketCashRouter = require("./routes/PocketCashRoute.js");
const entityShopLedgerRouter = require("./routes/ShopLedgerRoute.js");
const CompanyRouter = require("./routes/CompanyRoutes.js");
const BalanceSheetRouter = require("./routes/balanceSheetRoutes.js");
const creditTransaction = require("./routes/payablesAndReceiveablesRoutes.js");
const passwordRouter = require("./routes/passwordRoute.js");
const repairJobRouter = require("./routes/repairJobRoute.js");
const saleInvoiceRouter = require("./routes/saleInvoiceRoute.js");
const expenseRouter = require("./routes/expenseRoute.js");
// import rateLimit from 'express-rate-limit';

// const limiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 30, // limit each IP to 30 requests per windowMs
// });

// app.use(limiter);
const connectDB = require("./config/db.js");

const PORT = process.env.PORT || 8080;
const app = express();

connectDB();
app.use(cors({ origin: "*", credentials: true }));

app.use(cors());
// app.use(cors({
//     origin: 'https://www.okiiee.com',
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   }));
app.use(express.json());
app.use(express.json({ limit: "50mb" })); // Increase payload limit
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({
    message:
      "This is a dummy test route. Your server is running fine! 5/31/2025",
    status: "success",
  });
});

app.use("/api/admin", adminRoutes);
app.use("/api/phone", addPhoneRoutes);
app.use("/api/invoice", invoicesRoutes);
app.use("/api/committee", committeeRoute);
app.use("/api/shop", shopRoutes);
app.use("/api/dayBook", dayBookRoutes);
app.use("/api/Purchase", purchasePhone);
app.use("/api/ledger", ledgerRouter);
app.use("/api/partyLedger", partyLedgerRouter);
app.use("/api/committee", committeeRoute);
app.use("/api/banks", bankRouter);
app.use("/api/pocketCash", pocketCashRouter);
app.use("/api/entity", entityShopLedgerRouter);
app.use("/api/person", personRouter);
app.use("/api/accessory", accessoryRouter);
app.use("/api/company", CompanyRouter);
app.use("/api/balanceSheet", BalanceSheetRouter);
app.use("/api/password", passwordRouter);
app.use("/api/repair", repairJobRouter);
app.use("/api/sale-invoice", saleInvoiceRouter);
app.use("/api/expense", expenseRouter);

app.listen(PORT, () => console.log(`Server listening to port ${PORT}`));
