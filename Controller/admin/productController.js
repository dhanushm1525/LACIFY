import Product from "../../model/productModel.js";
import Category from "../../model/categoryModel.js";
import path from "path";
import fs from 'fs';
import upload from '../../utils/multer.js';


const validateProductName = (name)=>{
    const trimmedName = name.trim();
    if(trimmedName.length<3||trimmedName.length>50){
        throw new Error('Product name must be between 3 and 50 characters long');
    }

 // Allow letters, numbers, spaces, and basic punctuation

 const nameRegex = /^[a-zA-Z0-9\s]+$/;
 if(!nameRegex.test(trimmedName)){
    throw new Error('Product name contaims invalid characters');
 }

 return trimmedName;
};


const validateBrand = (brand)=>{

    //remove extra spaces and check length
    const trimmedBrand = brand.trim();
    if(trimmedBrand.length<2||trimmedBrand.length>30){
        throw new Error('Brand name must be between 2 and 30 characters');
    }

    //allow letter ,number, space
    const brandRegex = /^[a-zA-Z0-9\s]+$/;
    if(!brandRegex.test(trimmedBrand)){
        throw new Error('Brand name contains invalid characters');

    }

    return trimmedBrand;
};


//render product management page
const renderProductPage = async(req,res)=>{
    try{
        const page = parseInt(req.query.page)||1;
        const limit = 10;
        const skip=(page-1)*limit;

        //get total count for pages 
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts/limit);

        //fetch paginated products
        const products = await Product.find()
        .populate('categoriesId')
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit);


        //sanitize products for JSON serialization
        const sanitizedProducts = products.map(product=>{
            const sanitized = product.toObject();
            return{
                ...sanitized,
            _id:sanitized._id.toString(),
            categoriesId:{
                _id:sanitized.categoriesId._id.toString(),
                name:sanitized.categoriesId.name

            },
            imageUrl:sanitized.imageUrl||[]
            };
        });


        res.render('admin/product',{
            products:sanitizedProducts,
            categories:await Category.find(),
            currentPage:page,
            totalPages,
            startIndex:skip,
            endIndex:skip+products.length
        });
    }catch(error){
        console.error('Error rendering page:',error);
        res.status(500).json({
            message:'Internal error'
        });
    }
};


//Add new product
const addProduct = async (req,res)=>{
    const uploadMultiple = upload.array('images',3);

    uploadMultiple(req,res,async,(err)=>{
        if(err){
            return res.status(400).json({
                message:err.message
            });
        }

        try{
            //check if files were uploaded
            if(!req.files||req.files.length!==3){
                return res.status(400).json({
                    message:'please upload exactly 3 images'
                });
            }

            //Validate file types
            for(const file of req.files){
                if(file.size>5*1024*1024){
                    return res.status(400).json({
                        message:'Each image should be less than 5mb'
                    });
                }

                const validTypes = ['image/jpeg','image/png','image/png','image/webp'];
                if(!validTypes.includes(file.mimetype)){
                    return res.status(400).json({
                        message:'Invalid file type'
                    });
                }
            }

            const {
                productName,
                brand,
                catagoriesId,
                description,
                price,
                stock,
                size

            }=req.body;

            //validate required fields
            if(!productName||!brand||!catagoriesId||!price||!stock){
                return res.status(400).json({
                    message:'All fields are required'
                });
            }

            //Validate prodduct name and brand
            let validatedName,validatedBrand;
            try{
                validatedName = validateProductName(productName);
                validatedBrand = validateBrand(brand);
                       
             }
        }
    })
}