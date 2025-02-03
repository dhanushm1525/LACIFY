import {Router} from 'express'
import authController from '../Controller/user/authController.js'
import shopnhomeController from '../Controller/user/shopnhomeController.js'
import userMiddlewares from '../middlewares/userMiddleware.js';
import viewProductController from '../Controller/user/viewProductController.js';
import userMiddleware from '../middlewares/userMiddleware.js';
import profileController from '../Controller/user/profileController.js';
const router = Router()

router.get('/login',userMiddlewares.isLogin,authController.loadLogin)
router.get('/signup',userMiddlewares.isLogin,authController.getSignUp)
router.get('/',userMiddleware.checkSession,shopnhomeController.getHome)
router.post('/signup',authController.postSignUp)
router.post('/validate-otp',authController.postOtp)
router.post('/resend-otp',authController.postResendOtp)
router.get('/forgot-password',authController.getForgotPassword)
router.get('/auth/google',authController.getGoogle)
router.get('/auth/google/callback',authController.getGoogleCallback)
router.get('/home',userMiddleware.checkSession,shopnhomeController.getHome)
router.post('/login',authController.postLogin)
router.get('/product/:id', userMiddleware.checkSession, viewProductController.getProductDetails);
router.get('/logout', userMiddlewares.checkSession, authController.getLogout);
router.get('/home', shopnhomeController.getHome);
router.get('/shop', shopnhomeController.getShop);
router.get('/profile',userMiddleware.checkSession,profileController.getProfile)
router.patch('/profile/update',userMiddleware.checkSession,profileController.updateProfile)
router.post('/forgot-password/send-otp', authController.sendForgotPasswordOTP);
router.post('/forgot-password/verify-otp', authController.verifyForgotPasswordOTP);
router.post('/forgot-password/reset-password', authController.resetPassword);
router.get('/change-password', userMiddlewares.checkSession, authController.getChangePassword);
router.post('/change-password', userMiddlewares.checkSession, authController.postChangePassword);


export default router;