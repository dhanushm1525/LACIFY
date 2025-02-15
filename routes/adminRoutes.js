import {Router} from 'express'
import authController from '../Controller/admin/authController.js'
import adminMiddleware from '../middlewares/adminMiddleware.js'
import dashboardController from '../Controller/admin/dashboardController.js'
import userController from '../Controller/admin/userController.js'
import categoryController from '../Controller/admin/categoryController.js'
import productController from '../Controller/admin/productController.js'
import orderController from '../Controller/admin/orderController.js'
const router = Router()


router.get('/login',adminMiddleware.isLogin,adminMiddleware.errorHandler,authController.getAdmin)
router.post('/login',adminMiddleware.errorHandler,authController.postAdmin)
router.get('/dashboard',adminMiddleware.checkSession,adminMiddleware.errorHandler,dashboardController.getDashboard)
router.get('/userList',adminMiddleware.checkSession,adminMiddleware.errorHandler,userController.getUserList)
router.post('/user/:id/toggle-block',adminMiddleware.checkSession,adminMiddleware.errorHandler,userController.getToggle)
router.get('/logout',adminMiddleware.checkSession,adminMiddleware.errorHandler,authController.getLogout)

router.get('/category',adminMiddleware.checkSession,adminMiddleware.errorHandler,categoryController.getCategories)
router.post('/category/add',adminMiddleware.checkSession,adminMiddleware.errorHandler,categoryController.addCategory)
router.post('/category/edit',adminMiddleware.checkSession,adminMiddleware.errorHandler,categoryController.editCatagory)
router.get('/category/toggle',adminMiddleware.checkSession,adminMiddleware.errorHandler,categoryController.toggleCategory)


router.get('/product',adminMiddleware.checkSession,adminMiddleware.errorHandler,productController.renderProductPage)
router.post('/product/add',adminMiddleware.checkSession,adminMiddleware.errorHandler,productController.addProduct)
router.get('/product/:id',adminMiddleware.checkSession,adminMiddleware.errorHandler,productController.getProductDetails)
router.post('/product/edit/:id',adminMiddleware.checkSession,adminMiddleware.errorHandler,productController.updateProduct)
router.post('/product/toggle-status/:id',adminMiddleware.checkSession,adminMiddleware.errorHandler,productController.toggleProductStatus)

router.get('/orders',adminMiddleware.checkSession,orderController.getOrders)
router.post('/orders/:orderId/status', adminMiddleware.checkSession,adminMiddleware.errorHandler, orderController.updateOrderStatus);
router.patch('/orders/:orderId/items/:productId/status', adminMiddleware.checkSession, adminMiddleware.errorHandler,orderController.updateItemStatus);
router.post('/orders/:orderId/items/:productId/return', adminMiddleware.checkSession, orderController.handleReturnRequest);



export default router


