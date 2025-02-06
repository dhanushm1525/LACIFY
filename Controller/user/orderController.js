import orderSchema  from "../../model/orderModel.js";
import productSchema from "../../model/productModel.js";
import userSchema from '../../model/userModel.js';
import PDFDocument from 'pdfkit';



const getOrders = async (req,res)=>{
    try{
        const user = await userSchema.findById(req.session.user);
        const userId = req.session.user;
        const page = parseInt(req.query.page)||1;
        const limit = 5;


        const totalOrders = await orderSchema.countDocuments({userId});
        const totalPages = Math.ceil(totalOrders/limit);

        const orders = await orderSchema.find({userId})
        .sort({createdAt:-1})
        .skip((page-1)*limit)
        .limit(limit)
        .populate('items.product')

        res.render('user/viewOrder',{
            orders,
            currentPage:page.toExponential,
            totalPages,
            hasNextPage:page<totalPages,
            hasPrevPage:page >1,
            user
        });
    }catch(error){
        console.error('Get orders error',error);
        res.status(500).json({
            message:'Error fetching orders'
        });
        
    }
};

const cancelOrder = async (req,res)=>{
    try{
        const {orderId , productId} = req.params;
        const {reason } = req.body;
        const userId = req.session.user;

        const order = await orderSchema.findOne({_id:orderId,userId})
        .populate('items.product');

        if(!order){
            return res.status(404).json({
                success:false,
                message:'Order not found'
            });
        }

        //find the specific item
        const itemIndex = order.items.findIndex(item=>
            item.product._id.toString()===productId
        );

        if(itemIndex===-1){
            return res.status(404).json({
                success:false,
                message:'Item not found in order'
            });
        }

        const item = order.items[itemIndex];

        //check if item can be cancelled
        if(!['pending','processing'].includes(item.order.status)){
            return res.status(400).json({
                success:false,
                message:'This item cannot be cancelled at this stage'
            });
        }


        //update product stock
        await productSchema.findByIdAndUpdate(
            productId,
            {$inc:{stock:item.quantity}}
        );

        //update item status
        item.order.status='cancelled';
        item.order.statusHistory.push({
            status:'cancelled',
            date:new Date(),
            comment:`Item cancelled by user:${reason}`
        });

        await order.save();

        res.json({
            sucess:true,
            message:'Item cancelled successfully'
        });

    }catch(error){
        console.error('Cancel item error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error cancelling item'
        });
    }
}

export default {
    getOrders,
    cancelOrder
}