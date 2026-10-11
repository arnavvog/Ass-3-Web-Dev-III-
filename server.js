const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");

const productRoutes = require("./routes/productRoutes");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();


// Use public DNS servers for MongoDB SRV lookup
dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);


const app = express();


// Middleware
app.use(express.json());


// Routes
app.use("/api/products", productRoutes);


// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Inventory Management API is running"
    });
});


// Centralized error handling
app.use(errorHandler);


// MongoDB connection
async function connectDB() {

    try {

        await mongoose.connect(
            process.env.MONGO_URI,
            {
                serverSelectionTimeoutMS: 10000
            }
        );

        console.log("MongoDB Atlas connected successfully");

    } catch (error) {

        console.log("MongoDB connection failed:");
        console.log(error.message);

    }
}


connectDB();


// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});