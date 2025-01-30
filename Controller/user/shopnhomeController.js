import Product from '../../model/productModel.js';
import Category from '../../model/categoryModel.js';

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
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12; // Products per page
        const search = req.query.search || '';
        const sort = req.query.sort || 'default';
        
        // Get active categories first
        const activeCategories = await Category.find({ isActive: true }).distinct('_id');

        // Build query with active categories
        let query = { 
            isActive: true,
            categoriesId: { $in: activeCategories } // Only include products from active categories
        };

        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort options
        let sortOptions = {};
        switch (sort) {
            case 'price-low':
                sortOptions.price = 1;
                break;
            case 'price-high':
                sortOptions.price = -1;
                break;
            case 'newest':
                sortOptions.createdAt = -1;
                break;
            case 'name-asc':
                sortOptions.productName = 1;
                break;
            case 'name-desc':
                sortOptions.productName = -1;
                break;
            default:
                sortOptions.createdAt = -1;
        }

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        // Get products with populated category
        const products = await Product.find(query)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: 'categoriesId',
                match: { isActive: true } // Double-check category is active
            });

        // Filter out any products where category wasn't populated (extra safety)
        const filteredProducts = products.filter(product => product.categoriesId);

        // Add pagination info
        const pagination = {
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };

        res.render('user/shop', {
            products: filteredProducts,
            currentPage: page,
            totalPages,
            search,
            sort,
            totalProducts: filteredProducts.length,
            pagination
        });

    } catch (error) {
        console.error('Shop page error:', error);
        res.status(500).render('error', { 
            message: 'Error loading shop page',
            search: '',
            sort: 'default'
        });
    }
};

export default {
    getHome,
    getShop,
};
