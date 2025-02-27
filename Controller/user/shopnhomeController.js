import Product from '../../model/productModel.js';
import Category from '../../model/categoryModel.js';
import Offer from '../../model/offerModel.js';

const getHome = async (req, res) => {
    try {
        // Get IDs of active categories
        const activeCategories = await Category.find({ isActive: true }).distinct('_id');

        // Fetch active products with active categories
        const products = await Product.find({
            isActive: true,
            categoriesId: { $in: activeCategories }
        })
            .populate({
                path: 'categoriesId',
                match: { isActive: true }
            })
            .sort({ createdAt: -1 })
            .limit(5);

        // Filter out products where category wasn't populated (extra safety check)
        const filteredProducts = products.filter(product => product.categoriesId);

        res.render('user/home', {
            products: filteredProducts,
            title: 'Home'
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.render('user/home', {
            products: [],
            title: 'Home'
        });
    }
};

const getShop = async (req, res) => {
    // At the start of getShop, add:
    const sampleProduct = await Product.findOne({ isActive: true });
    
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const search = req.query.search || '';
        const sort = req.query.sort || 'default';
        const size = req.query.size || '';
        const minPrice = req.query.minPrice ? Number(req.query.minPrice) : '';
        const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : '';
        const stock = req.query.stock || '';

    

        // Get active offers first
        const activeOffers = await Offer.find({
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
            status: 'active'
        }).populate('categoryId');

        // Create maps for both product and category offers
        const productOfferMap = new Map();
        const categoryOfferMap = new Map();

        activeOffers.forEach(offer => {
            if (offer.offerType === 'product') {
                offer.productIds.forEach(productId => {
                    // If multiple offers exist for same product, keep the highest discount
                    const existingOffer = productOfferMap.get(productId.toString());
                    if (!existingOffer || existingOffer.discount < offer.discount) {
                        productOfferMap.set(productId.toString(), offer);
                    }
                });
            } else if (offer.offerType === 'category' && offer.categoryId) {
                // If multiple offers exist for same category, keep the highest discount
                const existingOffer = categoryOfferMap.get(offer.categoryId.toString());
                if (!existingOffer || existingOffer.discount < offer.discount) {
                    categoryOfferMap.set(offer.categoryId.toString(), offer);
                }
            }
        });

        // Get active categories
        const activeCategories = await Category.find({ isActive: true }).distinct('_id');

        // Build base query
        let query = {
            isActive: true,
            categoriesId: { $in: activeCategories }
        };

        // Add search filter
        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }

        // Add size filter
        if (size && size !== '') {
            
            query['size'] = {
                $elemMatch: {
                    size: size,
                    stock: { $gt: 0 }
                }
            };
            
        }

        

        // Add price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Add stock filter
        if (stock === 'inStock') {
            query['size.stock'] = { $gt: 0 };
        } else if (stock === 'outOfStock') {
            // This will find products where all sizes have 0 stock
            query['size'] = { $not: { $elemMatch: { stock: { $gt: 0 } } } };
        }


        // Build sort options
        let sortOptions = {};
        switch (sort) {
            case 'priceLowToHigh':
                sortOptions.price = 1;
                break;
            case 'priceHighToLow':
                sortOptions.price = -1;
                break;
            case 'newArrivals':
                sortOptions.createdAt = -1;
                break;
            default:
                sortOptions.createdAt = -1;
        }

        // Get total count
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        // Fetch products
        const products = await Product.find(query)
            .populate('categoriesId')
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit);

        // Process products and apply offers
        const productsWithPrices = products.map(product => {
            const productData = product.toObject();
            const productOffer = productOfferMap.get(product._id.toString());
            const categoryOffer = product.categoriesId ?
                categoryOfferMap.get(product.categoriesId.toString()) : null;

            let finalPrice = product.price;
            let appliedDiscount = 0;
            let appliedOffer = null;

            // Check product-specific offer
            if (productOffer) {
                const discountAmount = (product.price * productOffer.discount) / 100;
                if (discountAmount > appliedDiscount) {
                    appliedDiscount = discountAmount;
                    appliedOffer = productOffer;
                }
            }

            // Check category offer
            if (categoryOffer) {
                const discountAmount = (product.price * categoryOffer.discount) / 100;
                if (discountAmount > appliedDiscount) {
                    appliedDiscount = discountAmount;
                    appliedOffer = categoryOffer;
                }
            }

            // Calculate final price
            finalPrice = Math.round(product.price - appliedDiscount);

            return {
                ...productData,
                offerPrice: finalPrice,
                offerApplied: finalPrice < product.price,
                discountPercentage: appliedOffer ? appliedOffer.discount : 0
            };
        });

        const pagination = {
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };

        // Handle AJAX requests
        if (req.xhr) {
            return res.json({
                products: productsWithPrices,
                pagination
            });
        }

        // Regular page load
        res.render('user/shop', {
            products: productsWithPrices,
            pagination,
            search,
            sort
        });

    } catch (error) {
        console.error('Shop page error:', error);
        if (req.xhr) {
            return res.status(500).json({ error: 'Error loading products' });
        }
        res.render('user/shop', {
            products: [],
            pagination: {
                currentPage: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            },
            search: '',
            sort: 'default'
        });
    }
};

export default {
    getHome,
    getShop,
};
