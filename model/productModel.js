import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minLength: 10,
        maxLength: 250
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    sizes: {
        type: [Number], // Array of available sizes (e.g., [6, 7, 8, 9, 10])
        required: true,
    },
    imageUrl: {
        type: [String], // Array of image URLs
        required: true,
    }
}, 
{ timestamps: true });

export default mongoose.model("Product", productSchema);
