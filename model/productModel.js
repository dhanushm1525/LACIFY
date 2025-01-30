import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productName: {
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
    categoriesId: {
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
    size: {
        type: [String],
        required: true,
        validate: {
            validator: function(sizes) {
                return sizes && sizes.length > 0;
            },
            message: 'At least one size must be selected'
        }
    },
    imageUrl: {
        type: [String],
        required: true,
    }
}, 
{ timestamps: true });

export default mongoose.model("Product", productSchema);
