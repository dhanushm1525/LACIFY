import Wishlist from "../../model/wishlistModel.js";
import Product from "../../model/productModel.js";



const getWishlist = async (req, res, next) => {
    try {
        const userId = req.session.user;

        //get wishlist 
        const wishlist = await Wishlist.findOne({ userId })
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'categoriesId'
                }
            });

        //dont filter out inactive products 
        res.render('user/wishlist', {
            wishlist: wishlist?.items || [],
            user: req.session.user
        });
    } catch (error) {
        next(error)
    }
};

const addToWishlist = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const { productId, size } = req.body;

        if (!size) {
            return res.status(400).json({
                success: false,
                message: 'Size is required'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Validate size exists for product
        const sizeExists = product.size.some(s => s.size === size);
        if (!sizeExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid size selected'
            });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId, items: [] });
        }

        // Check if product with same size is already in wishlist
        const existingItem = wishlist.items.find(
            item => item.productId.toString() === productId && item.size === size
        );

        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: 'Product with selected size already in wishlist'
            });
        }

        // Add to wishlist
        wishlist.items.push({ productId, size });
        await wishlist.save();

        res.json({
            success: true,
            message: 'Product added to wishlist'
        });

    } catch (error) {
        next(error);
    }
};


const removeWishlist = async (req, res, next) => {


    try {
        const userId = req.session.user;
        const productId = req.params.productId;




        const wish = await Wishlist.updateOne(
            { userId },
            { $pull: { items: { productId } } }
        );


        if (wish.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in wishlist'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product removed from wishlist'
        });
    } catch (error) {
        next(error)
    }
}

export default {
    getWishlist,
    addToWishlist,
    removeWishlist
}