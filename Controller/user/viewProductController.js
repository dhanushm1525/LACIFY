import Product from '../../model/productModel.js';

const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId)
            .populate('categoriesId');

        if (!product) {
            return res.status(404).redirect('/home');
        }

        // Find related products from the same category
        const relatedProducts = await Product.find({
            categoriesId: product.categoriesId,
            isActive: true,
            _id: { $ne: productId }
        })
        .limit(4);

        // Convert to plain objects and ensure all properties exist
        const processedProduct = {
            ...product.toObject(),
            productName: product.productName || '',
            brand: product.brand || '',
            description: product.description || '',
            price: product.price || 0,
            stock: product.stock || 0,
            size: product.size || '',
            imageUrl: product.imageUrl || [],
            categoriesId: {
                _id: product.categoriesId._id,
                name: product.categoriesId.name || ''
            }
        };

        const processedRelatedProducts = relatedProducts.map(p => ({
            ...p.toObject(),
            productName: p.productName || '',
            brand: p.brand || '',
            price: p.price || 0,
            size: p.size || '',
            imageUrl: p.imageUrl || []
        }));

        res.render('user/viewProduct', { 
            product: processedProduct,
            relatedProducts: processedRelatedProducts,
            title: product.productName || 'Product Details'
        });

    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).redirect('/home');
    }
};

export default {
    getProductDetails,
}; 