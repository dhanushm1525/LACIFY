import express from 'express';
import path from 'path';
import fs from 'fs';
const app = express();

// Serve static files from the 'static' directory
app.use('/uploads', express.static('static/uploads'));
app.use(express.static('static'));

// Add this route to test image accessibility
app.get('/check-image/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(process.cwd(), 'static', 'uploads', 'products', filename);
    
    if (fs.existsSync(filepath)) {
        res.json({
            exists: true,
            path: filepath,
            url: `/uploads/products/${filename}`
        });
    } else {
        res.json({
            exists: false,
            path: filepath
        });
    }
}); 