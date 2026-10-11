const express = require("express");
const Product = require("../models/Product");

const router = express.Router();


// ======================================================
// 1. CREATE PRODUCT
// POST /api/products
// ======================================================

router.post("/", async (req, res, next) => {
    try {
        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });

    } catch (error) {
        next(error);
    }
});


// ======================================================
// 2. GET ALL PRODUCTS
// Filtering + Sorting + Pagination
// GET /api/products
// ======================================================

router.get("/", async (req, res, next) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            sort,
            page = 1,
            limit = 5
        } = req.query;


        // -------------------------
        // Filtering
        // -------------------------

        const filter = {};

        if (category) {
            filter.category = category;
        }

        if (minPrice || maxPrice) {
            filter.price = {};

            if (minPrice) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice) {
                filter.price.$lte = Number(maxPrice);
            }
        }


        // -------------------------
        // Pagination
        // -------------------------

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        const skip = (pageNumber - 1) * limitNumber;


        // -------------------------
        // Sorting
        // -------------------------

        let sortOption = {};

        if (sort === "price") {
            sortOption.price = 1;
        }

        else if (sort === "-price") {
            sortOption.price = -1;
        }

        else if (sort === "name") {
            sortOption.name = 1;
        }

        else if (sort === "-name") {
            sortOption.name = -1;
        }


        // -------------------------
        // Get Products
        // -------------------------

        const products = await Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNumber);


        const totalProducts = await Product.countDocuments(filter);


        res.status(200).json({
            success: true,
            totalProducts,
            page: pageNumber,
            limit: limitNumber,
            products
        });

    } catch (error) {
        next(error);
    }
});


// ======================================================
// 3. LOW STOCK REPORT
// GET /api/products/reports/low-stock
// ======================================================

router.get("/reports/low-stock", async (req, res, next) => {
    try {

        const products = await Product.find({
            $expr: {
                $lte: ["$quantity", "$lowStockThreshold"]
            }
        });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        next(error);
    }
});


// ======================================================
// 4. CATEGORY-WISE INVENTORY SUMMARY
// GET /api/products/reports/category-summary
// ======================================================

router.get("/reports/category-summary", async (req, res, next) => {
    try {

        const summary = await Product.aggregate([
            {
                $group: {
                    _id: "$category",

                    totalProducts: {
                        $sum: 1
                    },

                    totalQuantity: {
                        $sum: "$quantity"
                    },

                    totalInventoryValue: {
                        $sum: {
                            $multiply: ["$price", "$quantity"]
                        }
                    }
                }
            },

            {
                $sort: {
                    totalInventoryValue: -1
                }
            },

            {
                $project: {
                    _id: 0,

                    category: "$_id",

                    totalProducts: 1,

                    totalQuantity: 1,

                    totalInventoryValue: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            summary
        });

    } catch (error) {
        next(error);
    }
});


// ======================================================
// 5. RESTOCK PRODUCT
// PATCH /api/products/:id/restock
// ======================================================

router.patch("/:id/restock", async (req, res, next) => {
    try {

        const { quantity } = req.body;

        if (!quantity || Number(quantity) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Restock quantity must be greater than 0"
            });
        }


        const product = await Product.findByIdAndUpdate(
            req.params.id,

            {
                $inc: {
                    quantity: Number(quantity)
                }
            },

            {
                new: true,
                runValidators: true
            }
        );


        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        res.status(200).json({
            success: true,
            message: "Product restocked successfully",
            product
        });

    } catch (error) {
        next(error);
    }
});


// ======================================================
// 6. SELL PRODUCT
// PATCH /api/products/:id/sale
// ======================================================

router.patch("/:id/sale", async (req, res, next) => {
    try {

        const { quantity } = req.body;

        if (!quantity || Number(quantity) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Sale quantity must be greater than 0"
            });
        }


        const product = await Product.findById(req.params.id);


        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        if (product.quantity < Number(quantity)) {
            return res.status(400).json({
                success: false,
                message: "Not enough stock available"
            });
        }


        product.quantity -= Number(quantity);

        await product.save();


        res.status(200).json({
            success: true,
            message: "Product sale recorded successfully",
            product
        });

    } catch (error) {
        next(error);
    }
});


// ======================================================
// 7. GET SINGLE PRODUCT
// GET /api/products/:id
// ======================================================

router.get("/:id", async (req, res, next) => {
    try {

        const product = await Product.findById(req.params.id);


        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        next(error);
    }
});


// ======================================================
// 8. UPDATE PRODUCT
// PUT /api/products/:id
// ======================================================

router.put("/:id", async (req, res, next) => {
    try {

        const product = await Product.findByIdAndUpdate(
            req.params.id,

            req.body,

            {
                new: true,
                runValidators: true
            }
        );


        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });

    } catch (error) {
        next(error);
    }
});


// ======================================================
// 9. DELETE PRODUCT
// DELETE /api/products/:id
// ======================================================

router.delete("/:id", async (req, res, next) => {
    try {

        const product = await Product.findByIdAndDelete(
            req.params.id
        );


        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        next(error);
    }
});


module.exports = router;