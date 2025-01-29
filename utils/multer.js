import multer from "multer";
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadDir = 'static/uploads/products';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'static/uploads/products');  // Changed to static folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Export the multer instance directly instead of an object
const upload = multer({
    storage:storage,
    fileFilter:(req,file,cb)=>{
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if(mimetype && extname){
            return cb(null,true);
        }
        cb(new Error('Only images are allowed'));
    },
    limits:{fileSize:5*1024*1024}//5mb file
});

// Export the multer instance directly
export default upload;