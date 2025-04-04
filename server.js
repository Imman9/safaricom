require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5500",
  "https://safaricom-rho.vercel.app/", // Replace with your actual frontend domain
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// M-Pesa API endpoints
const BASE_URL =
  process.env.MPESA_ENV === "sandbox"
    ? "https://sandbox.safaricom.co.ke"
    : "https://api.safaricom.co.ke";

// Generate access token
async function getAccessToken() {
  try {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");
    const response = await axios.get(
      `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

// Generate timestamp
function generateTimestamp() {
  return new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, -3);
}

// Generate password
function generatePassword(shortcode, passkey, timestamp) {
  const str = shortcode + passkey + timestamp;
  return Buffer.from(str).toString("base64");
}

// STK Push endpoint
app.post("/api/initiate-payment", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const amount = 1; // Fixed amount of 1000 KES

    // Get access token
    const accessToken = await getAccessToken();

    // Generate timestamp and password
    const timestamp = generateTimestamp();
    const password = generatePassword(
      process.env.MPESA_SHORTCODE,
      process.env.MPESA_PASSKEY,
      timestamp
    );

    // Prepare request body
    const requestBody = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL:
        process.env.CALLBACK_URL || "https://safaricom-backend.onrender.com",
      AccountReference: "PaymentRequest",
      TransactionDesc: "Payment request of 1 KES",
    };

    // Make STK Push request
    const response = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({
      error: "Failed to initiate payment",
      details: error.message,
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
