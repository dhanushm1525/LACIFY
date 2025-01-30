import Product from '../../model/productModel.js';

const getShopPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12; // Products per page
        const search = req.query.search || '';  // Default to empty string
        const sort = req.query.sort || 'default';
        
        // Build query
        let query = { isActive: true };
        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }

        // // Build sort options
        // let sortOptions = {};
        // switch (sort) {
        //     case 'price-low':
        //         sortOptions.price = 1;
        //         break;
        //     case 'price-high':
        //         sortOptions.price = -1;
        //         break;
        //     case 'newest':
        //         sortOptions.createdAt = -1;
        //         break;
        //     case 'name-asc':
        //         sortOptions.productName = 1;
        //         break;
        //     case 'name-desc':
        //         sortOptions.productName = -1;
        //         break;
        //     default:
        //         sortOptions.createdAt = -1; // Default sort
        // }

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        // Get products
        const products = await Product.find(query)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('categoriesId');

        // Add pagination info
        const pagination = {
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };

        res.render('user/shop', {
            products,
            currentPage: page,
            totalPages,
            search,  // Pass the search value
            sort,    // Pass the sort value
            totalProducts,
            pagination
        });

    } catch (error) {
        console.error('Shop page error:', error);
        res.status(500).render('error', { 
            message: 'Error loading shop page',
            search: '',  // Provide default values
            sort: 'default'
        });
    }
};

export default {
    getShopPage
}; 