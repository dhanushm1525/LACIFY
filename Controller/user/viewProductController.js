import Product from '../../model/productModel.js';
import { calculateFinalPrice } from '../../utils/calculateOffer.js';
import Offer from '../../model/offerModel.js';

const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId)
            .populate('categoriesId');

        if (!product) {
            return res.status(404).redirect('/home');
        }

        // Fetch active offers for this product and its category
        const offers = await Offer.find({
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
            $or: [
                { productIds: product._id },
                { categoryId: product.categoriesId._id }
            ]
        });

        const productOffer = offers.find(offer => 
            offer.productIds && offer.productIds.some(id => id.equals(product._id))
        );
        
        const categoryOffer = offers.find(offer => 
            offer.categoryId && offer.categoryId.equals(product.categoriesId._id)
        );

        // Calculate final price with offers
        const finalPrice = calculateFinalPrice(product, categoryOffer, productOffer);
        
        const processedProduct = {
            ...product.toObject(),
            discountPrice: finalPrice,
            originalPrice: product.price,
            offerApplied: finalPrice < product.price,
            offerPercentage: productOffer?.discount || categoryOffer?.discount || 0,
            appliedOffer: productOffer || categoryOffer
        };

        // Find related products from the same category
        const relatedProducts = await Product.find({
            categoriesId: product.categoriesId,
            isActive: true,
            _id: { $ne: productId }
        })
        .limit(4);

        // // Process the product data
        // const processedProduct = {
        //     ...product.toObject(),
        //     productName: product.productName || '',
        //     brand: product.brand || '',
        //     description: product.description || '',
        //     price: product.price || 0,
        //     size: product.size || [], // This is already the array of {size, stock} objects
        //     imageUrl: product.imageUrl || [],
        //     rating: product.rating || 0
        // };

        // Calculate total stock
        processedProduct.stock = processedProduct.size.reduce((total, item) => total + (item.stock || 0), 0);

        const processedRelatedProducts = relatedProducts.map(p => ({
            ...p.toObject(),
            productName: p.productName || '',
            brand: p.brand || '',
            price: p.price || 0,
            imageUrl: p.imageUrl || []
        }));

        res.render('user/viewProduct', {
            product: processedProduct,
            relatedProducts: processedRelatedProducts,
            title: processedProduct.productName
        });

    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).redirect('/home');
    }
};

export default {
    getProductDetails,
}; 