import Category from "../../model/categoryModel.js";

//render category page
const getCategories = async(req,res)=>{
    try{
        const categories = await Category.find().sort({createdAt:-1});
        res.render('admin/category',{categories});
    }catch(error){
        console.error('Error Fetching categories:',error);
        res.status(500).send('Error Fetching Categories');
    }
};

//add category

const addCategory=async(req,res)=>{
    try{
        const {categoryName,categoryDescription}=req.body;
        const trimmedategoryName = categoryName.trim();

        //Validate category
        if(!/^[A-Za-z]+$/.test(trimmedategoryName)){
            return res.status(400).send('Category can only contain Alphabets');
        }

        if(trimmedategoryName.length>10){
            return res.status(400).send('Category name must not exceed 10 characters')
        }

        //capitaize first letter,rest lowercase
        const formattedCategoryName = trimmedategoryName.charAt(0).toUpperCase()+trimmedategoryName.slice(1).toLowerCase();

        //check if category name exists
        const existingCategory = await Category.findOne({
            name:{$regex:new RegExp(`${formattedCategoryName}$`,'i')}
        });

        if(existingCategory){
            return res.status(400).send('Category name already exists');
        }


        //validate categoryDescription 
        if(categoryDescription.length<10||categoryDescription.length>100){
            return res.status(400).send('Description must be between 10 and 100 characters');

        }


        const newCategory = new Category({
            name:formattedCategoryName,
            description:categoryDescription,
            isActive:true,
        });


        await newCategory.save();
        res.redirect('/admin/category');
     }catch(error){
        console.error('Error adding category',error);
        res.status(500).send('Error adding Category');
     }
};


//Edit category
const editCatagory = async (req,res)=>{
    try{
        const {categoryId,categoryName,categoryDescription}=req.body;
        const trimmedCategoryName = categoryName.trim();

        //validate catagory name
        if(!/^[A-Za-z]+$/.test(trimmedCategoryName)){
            return res.status(400).send('Catagory name can only contain alphabets');
        }

        if(trimmedCategoryName.length>10){
            return res.status(400).send('Category name must not exceed 10 characters');

        }

        //capitalise first letter
        const formattedCategoryName = trimmedCategoryName.charAt(0).toUpperCase() + 
                                    trimmedCategoryName.slice(1).toLowerCase();

         // Check if category name already exists (excluding current category)
        const existingCategory = await Category.findOne({
            _id: { $ne: categoryId },
            name: { $regex: new RegExp(`^${formattedCategoryName}$`, 'i') }
        });

        if (existingCategory) {
            return res.status(400).send('Category name already exists.');
        }

        //validate category description
        if (categoryDescription.length < 10 || categoryDescription.length > 100) {
            return res.status(400).send(
                'Description must be between 10 and 100 characters.'
            );
        }

        await Category.findByIdAndUpdate(categoryId,{
            name:formattedCategoryName,
            description:categoryDescription,
        });

        res.redirect('/admin/category');

    }catch(error){
        console.error('Error editing Category',error);
        res.status(500).send('Error editinng Category');
    }
};

//soft delete
const 
toggleCategory = async(req,res)=>{
    try{
        const {id}=req.query;

        //find and update the category
        const category = await Category.findById(id);
        if(!category){
            return res.status(404).json({
                message:'Category not found'
            });
        }

        category.isActive=!category.isActive;
        await category.save();

        return res.status(200).json({
            success:true,
            message:`Category ${category.isActive?'show':'hidden'} successfully`
        });

    }catch(error){
        console.error('Error toggling category',error);
        return res.status(500).json({
            success:false,
            message:'Error toggling category status'
        });
    }
};


export default {
    getCategories,
    addCategory,
    editCatagory,
    toggleCategory
}