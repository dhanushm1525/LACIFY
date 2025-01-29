import {Router} from 'express'
import authController from '../Controller/admin/authController.js'
import adminMiddleware from '../middlewares/adminMiddleware.js'
import dashboardController from '../Controller/admin/dashboardController.js'
import userController from '../Controller/admin/userController.js'
import categoryController from '../Controller/admin/categoryController.js'
import productController from '../Controller/admin/productController.js'
const router = Router()


router.get('/login',authController.getAdmin)
router.post('/login',authController.postAdmin)
router.get('/dashboard',adminMiddleware.checkSession,dashboardController.getDashboard)
router.get('/userList',adminMiddleware.checkSession,userController.getUserList)
router.post('/user/:id/toggle-block',adminMiddleware.checkSession,userController.getToggle)
router.get('/logout',adminMiddleware.checkSession,authController.getLogout)

router.get('/category',adminMiddleware.checkSession,categoryController.getCategories)
router.post('/category/add',adminMiddleware.checkSession,categoryController.addCategory)
router.post('/category/edit',adminMiddleware.checkSession,categoryController.editCatagory)
router.get('/category/toggle',adminMiddleware.checkSession,categoryController.toggleCategory)


router.get('/product',adminMiddleware.checkSession,productController.renderProductPage)
router.post('/product/add',adminMiddleware.checkSession,productController.addProduct)
router.get('/product/:id',adminMiddleware.checkSession,productController.getProductDetails)
router.post('/product/edit/:id',adminMiddleware.checkSession,productController.updateProduct)
router.post('/product/toggle-status/:id',adminMiddleware.checkSession,productController.toggleProductStatus)

export default router


