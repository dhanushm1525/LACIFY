import {Router} from 'express'
import authController from '../Controller/user/authController.js'
import shopnhomeController from '../Controller/user/shopnhomeController.js'
import userMiddlewares from '../middlewares/userMiddleware.js';
const router = Router()

router.get('/login',userMiddlewares.isLogin,authController.loadLogin)
router.get('/signup',userMiddlewares.isLogin,authController.getSignUp)
router.get('/',shopnhomeController.getHome)
router.post('/signup',authController.postSignUp)
router.post('/validate-otp',authController.postOtp)
router.post('/resend-otp',authController.postResendOtp)
router.get('/auth/google',authController.getGoogle)
router.get('/auth/google/callback',authController.getGoogleCallback)
router.get('/home',shopnhomeController.getHome)
router.post('/login',authController.postLogin)
export default router;