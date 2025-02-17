import {Router} from 'express'
import authController from '../Controller/user/authController.js'
import shopnhomeController from '../Controller/user/shopnhomeController.js'
import userMiddlewares from '../middlewares/userMiddleware.js';
import viewProductController from '../Controller/user/viewProductController.js';
import userMiddleware from '../middlewares/userMiddleware.js';
import profileController from '../Controller/user/profileController.js';
import addressController from '../Controller/user/addressController.js';
import userCartController from '../Controller/user/cartController.js';
import checkoutController from '../Controller/user/checkoutController.js';
import orderController from '../Controller/user/orderController.js';
import walletController from '../Controller/user/walletController.js';
import wishlistController from '../Controller/user/wishlistController.js';

const router = Router()

router.get('/login',userMiddlewares.isLogin,authController.loadLogin)
router.post('/login',authController.postLogin)
router.get('/signup',userMiddlewares.isLogin,authController.getSignUp)
router.post('/signup',authController.postSignUp)
router.post('/validate-otp',authController.postOtp)
router.post('/resend-otp',authController.postResendOtp)
router.get('/logout', userMiddlewares.checkSession, authController.getLogout);


router.get('/',shopnhomeController.getHome)
router.get('/home',userMiddleware.checkSession,shopnhomeController.getHome)
router.get('/shop', shopnhomeController.getShop);


router.get('/forgot-password',authController.getForgotPassword)
router.post('/forgot-password/send-otp', authController.sendForgotPasswordOTP);
router.post('/forgot-password/verify-otp', authController.verifyForgotPasswordOTP);
router.post('/forgot-password/reset-password', authController.resetPassword);
router.get('/change-password', userMiddlewares.checkSession, authController.getChangePassword);
router.post('/change-password', userMiddlewares.checkSession, authController.postChangePassword);


router.get('/auth/google',userMiddleware.isLogin,authController.getGoogle)
router.get('/auth/google/callback',userMiddleware.isLogin,authController.getGoogleCallback)

router.get('/product/:id', userMiddleware.checkSession, viewProductController.getProductDetails);

router.get('/profile',userMiddleware.checkSession,profileController.getProfile)
router.patch('/profile/update',userMiddleware.checkSession,profileController.updateProfile)


router.get('/address',userMiddleware.checkSession,addressController.getAddress)
router.post('/address/add',userMiddleware.checkSession,addressController.addAddress)
router.delete('/address/:id', userMiddlewares.checkSession, addressController.deleteAddress);
router.put('/address/:id', userMiddlewares.checkSession, addressController.editAddress);

router.get('/cart', userMiddlewares.checkSession, userCartController.getCart);
router.post('/cart/add', userMiddlewares.checkSession, userCartController.addToCart);
router.patch('/cart/update-quantity', userMiddlewares.checkSession, userCartController.updateQuantity);
router.delete('/cart/remove/:productId', userMiddlewares.checkSession, userCartController.removeFromCart);

router.get('/checkout', userMiddlewares.checkSession, checkoutController.getCheckoutPage);
router.post('/checkout/place-order', userMiddlewares.checkSession, checkoutController.placeOrder);


router.get('/orders',userMiddleware.checkSession,orderController.getOrders)
router.patch('/orders/:orderId/items/:productId/cancel', userMiddlewares.checkSession, orderController.cancelOrder);

router.get('/wishlist', userMiddlewares.checkSession,userMiddleware.errorHandler, wishlistController.getWishlist);
router.post('/wishlist/add', userMiddlewares.checkSession,userMiddleware.errorHandler, wishlistController.addToWishlist);

router.get('/wallet', userMiddlewares.checkSession, walletController.getWallet);
router.post('/orders/:orderId/items/:productId/return', userMiddlewares.checkSession,userMiddleware.errorHandler,orderController.requestReturnItem);


export default router;