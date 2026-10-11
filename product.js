const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true
        },

        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true
        },

        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"]
        },

        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [0, "Quantity cannot be negative"]
        },

        lowStockThreshold: {
            type: Number,
            default: 5,
            min: [0, "Threshold cannot be negative"]
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Product", productSchema);