import Product from '../../model/productModel.js';
import Category from '../../model/categoryModel.js';
import path from 'path';
import fs from 'fs';
import upload from '../../utils/multer.js'

// Add these validation functions at the top of the file
const validateProductName = (name) => {
    // Remove extra spaces and check length
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 50) {
        throw new Error('Product name must be between 3 and 50 characters');
    }
    
    // Allow letters, numbers, spaces, and basic punctuation
    const nameRegex = /^[a-zA-Z0-9\s]+$/;
    if (!nameRegex.test(trimmedName)) {
        throw new Error('Product name contains invalid characters');
    }
    
    return trimmedName;
};

const validateBrand = (brand) => {
    // Remove extra spaces and check length
    const trimmedBrand = brand.trim();
    if (trimmedBrand.length < 2 || trimmedBrand.length > 30) {
        throw new Error('Brand name must be between 2 and 30 characters');
    }
    
    // Allow letters, numbers, spaces, and hyphens
    const brandRegex = /^[a-zA-Z0-9\s]+$/;
    if (!brandRegex.test(trimmedBrand)) {
        throw new Error('Brand name contains invalid characters');
    }
    
    return trimmedBrand;
};

// Render Product Management Page
const renderProductPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Items per page
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        // Fetch paginated products with populated references
        const products = await Product.find()
            .populate('categoriesId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Sanitize products for JSON serialization
        const sanitizedProducts = products.map(product => {
            const sanitized = product.toObject();
            return {
                ...sanitized,
                _id: sanitized._id.toString(),
                categoriesId: {
                    _id: sanitized.categoriesId._id.toString(),
                    name: sanitized.categoriesId.name
                },
                imageUrl: sanitized.imageUrl || []
            };
        });

        res.render('admin/product', {
            products: sanitizedProducts,
            categories: await Category.find(),
            currentPage: page,
            totalPages,
            totalProducts,
            startIndex: skip,
            endIndex: skip + products.length
        });
    } catch (error) {
        console.error('Error rendering product page:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Add New Product
const addProduct = async (req, res) => {
    const uploadMultiple = upload.array('images', 3);

    uploadMultiple(req, res, async (err) => {
        if (err) {
            
            return res.status(400).json({ message: err.message });
        }

        try {
            // Check if files were uploaded
            if (!req.files || req.files.length !== 3) {
                return res.status(400).json({ message: 'Please upload exactly 3 images' });
            }

            // Validate file types and sizes
            for (const file of req.files) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    return res.status(400).json({ message: 'Each image must be less than 5MB' });
                }

                const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
                if (!validTypes.includes(file.mimetype)) {
                    return res.status(400).json({ message: 'Invalid file type. Only JPG, JPEG, PNG, and WebP are allowed' });
                }
            }

            const {
                productName,
                brand,
                categoriesId,
                description,
                price,
                stock,
                size
            } = req.body;

            // Validate required fields
            if (!productName || !brand || !categoriesId || !price || !stock) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            // Validate product name and brand
            let validatedName, validatedBrand;
            try {
                validatedName = validateProductName(productName);
                validatedBrand = validateBrand(brand);
            } catch (validationError) {
                return res.status(400).json({ message: validationError.message });
            }

            // Check for duplicate product name
            const existingProduct = await Product.findOne({
                productName: validatedName,
                _id: { $ne: req.params.id } // Exclude current product when updating
            });
            
            if (existingProduct) {
                return res.status(400).json({ message: 'A product with this name already exists' });
            }

            // Process and save the images
            const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);

            const newProduct = new Product({
                productName: validatedName,
                brand: validatedBrand,
                categoriesId,
                description: description.trim(),
                price: parseFloat(price),
                stock: parseInt(stock),
                size: Array.isArray(req.body.sizes) ? req.body.sizes : [req.body.sizes],
                imageUrl: imageUrls,
                isActive: true
            });

            await newProduct.save();
            res.status(201).json({ message: 'Product added successfully' });

        } catch (error) {
            // Delete uploaded files if there's an error
            if (req.files) {
                req.files.forEach(file => {
                    const filePath = path.join(process.cwd(), 'public', 'uploads', 'products', file.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                });
            }
            
            console.error('Error adding product:', error);
            res.status(400).json({ message: error.message || 'Error adding product' });
        }
    });
};

// Get Product Details for Editing
const getProductDetails = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categoriesId');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Convert to plain object and sanitize
        const sanitizedProduct = {
            ...product.toObject(),
            _id: product._id.toString(),
            productName: product.productName || '',
            brand: product.brand || '',
            categoriesId: {
                _id: product.categoriesId._id.toString(),
                name: product.categoriesId.name
            },
            description: product.description || '',
            price: product.price || 0,
            stock: product.stock || 0,
            size: Array.isArray(product.size) ? product.size : [product.size],
            imageUrl: product.imageUrl || [],
            isActive: product.isActive
        };

        res.json(sanitizedProduct);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Error fetching product details' });
    }
};

// Update Product
const updateProduct = async (req, res) => {
    const uploadMultiple = upload.array('images', 3);

    uploadMultiple(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            const { productId, productName, brand, categoriesId, description, price, stock, imageIndexes } = req.body;

            // Validate required fields
            if (!productName || !brand || !categoriesId || !description || !price || !stock) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            // Get existing product
            const existingProduct = await Product.findById(productId);
            if (!existingProduct) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Validate product name and brand
            let validatedName, validatedBrand;
            try {
                validatedName = validateProductName(productName);
                validatedBrand = validateBrand(brand);
            } catch (validationError) {
                return res.status(400).json({ message: validationError.message });
            }

            // Handle image updates
            let updatedImageUrls = [...existingProduct.imageUrl]; // Copy existing image URLs

            if (req.files && req.files.length > 0 && imageIndexes) {
                const indexes = imageIndexes.split(',').map(Number);
                
                // Process each new image
                req.files.forEach((file, i) => {
                    const updateIndex = indexes[i];
                    if (updateIndex >= 0 && updateIndex < 3) {
                        // Delete old image if it exists
                        const oldImagePath = path.join(process.cwd(), 'static', 'uploads', 'products', path.basename(existingProduct.imageUrl[updateIndex]));
                        try {
                            if (fs.existsSync(oldImagePath)) {
                                fs.unlinkSync(oldImagePath);
                            }
                        } catch (error) {
                            console.error('Error deleting old image:', error);
                        }
                        
                        // Update with new image
                        updatedImageUrls[updateIndex] = `/uploads/products/${file.filename}`;
                    }
                });
            }

            // Update product fields
            const updatedProduct = {
                productName: validatedName,
                brand: validatedBrand,
                categoriesId,
                description: description.trim(),
                price: parseFloat(price),
                stock: parseInt(stock),
                size: Array.isArray(req.body.sizes) ? req.body.sizes : [req.body.sizes],
                imageUrl: updatedImageUrls
            };

            // Update the product
            await Product.findByIdAndUpdate(productId, updatedProduct, { new: true });
            
            res.status(200).json({ message: 'Product updated successfully' });

        } catch (error) {
            // Delete any newly uploaded files if there's an error
            if (req.files) {
                req.files.forEach(file => {
                    const filePath = path.join(process.cwd(), 'static', 'uploads', 'products', file.filename);
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (err) {
                        console.error('Error deleting file:', err);
                    }
                });
            }
            
            console.error('Error updating product:', error);
            res.status(500).json({ message: error.message || 'Error updating product' });
        }
    });
};

// Toggle Product Status
const toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.isActive = !product.isActive;
        await product.save();

        res.json({
            message: 'Product status updated',
            isActive: product.isActive
        });
    } catch (error) {
        console.error('Error toggling product status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export default { renderProductPage, addProduct, getProductDetails, updateProduct, toggleProductStatus }