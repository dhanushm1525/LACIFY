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
        const { productId } = req.body;

        //chekif product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                sucess: false,
                message: 'product not found'
            });
        }

        //find or create wishlist
        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
           wishlist = new Wishlist({userId,items:[]});
        }

        //check if prodicg is already in wishlist 
        const existingItem = wishlist.items.find(
            item=>item.productId.toString()===productId
        );

        if(existingItem){
            return res.status(400).json({
                success:false,
                message:'Product already in wishlist'
            });
        }

        //add to wishlist 
        wishlist.items.push({productId});
        await wishlist.save();

        res.json({
            success:true,
            message:'product added to wishlist'
        });

    }catch(error) {
        next(error)
    }
}

export default {
    getWishlist,
    addToWishlist
}