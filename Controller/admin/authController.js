import { config } from 'dotenv';


config()

const getAdmin = (req,res)=>{
    res.render('admin/login')
} 

const postAdmin = async (req, res,next) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Check credentials against environment variables
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            req.session.isAdmin = true;
            return res.json({
                success: true,
                message: 'Login successful',
                redirectUrl: '/admin/dashboard'
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
    } catch (error) {
      next(error)
    }
}

const getLogout = (req , res)=>{
    req.session.destroy(()=>{
        res.redirect('/admin/login')
    });
}


export default {
    getAdmin,
    postAdmin,
    getLogout
    
}