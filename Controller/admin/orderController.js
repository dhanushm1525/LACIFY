import orderSchema from '../../model/orderModel.js';
import productSchema from '../../model/productModel.js';
import Wallet from '../../model/walletModel.js';

const getOrders = async (req,res)=>{
    try{
        const page = parseInt(req.query.page||1);
        const limit = 10;
        const skip = (page-1)*limit;

        //get filter parameters
        const status = req.query.status;
        const dateFrom = req.query.dateFrom;
        const dateTo = req.query.dateTo;

        //build filter object 
        let filter = {};

        //exclude pending status by default 
        filter ['items.order.status']={$ne:'pending'};

        //add additional status filter if provided
        if(status){
            filter['items.order.status'] = status;
        }

        if(dateFrom||dateTo){
            filter.orderDate = {};
            if(dateFrom)filter.orderDate.$gte = new Date(dateFrom);
            if(dateTo)filter.orderDate.$lte = new Date(dateTo);
        }

        const totalOrders = await orderSchema.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders/limit);

        const orders = await orderSchema.find(filter)
        .populate('userId','firstName lastName email')
        .populate('items.product')
        .sort({orderDate:-1})
        .skip(skip)
        .limit(limit);

        res.render('admin/orders',{
            orders,
            currentPage:page,
            totalPages,
            hasNextPage:page<totalPages,
            hasPrevPage:page>1,
            admin:req.session.admin
        });
    }catch(error){
        console.error('Get orders error:', error);
        res.status(500).render('admin/error', { 
            message: 'Error fetching orders',
            error,
            admin: req.session.admin
        });
    }
};

const updateOrderStatus = async (req,res,next)=>{
    try{
        const {orderId}=req.params;
        const {status}=req.body;

        const order  = await orderSchema.findById(orderId)
        .populate('items.product');

        if(!order){
            return res.status(404).json({
                success:false,
                message:'Order not found'
            });
        }

        //update all items status
        order.items.forEach(item=>{
            item.order.status=status;
            item.order.statusHistory.push({
                status,
                date:new Date(),
                comment:`status updated tO ${status} by admin`
            });
        });


        //handle stock updates 
        if(status==='cancelled'){
            //restore stock
            for(const item of order.items){
                await productSchema.findByIdAndUpdate(
                    item.product._id,
                    {$inc:{stock:item.quantity}}
                );
            }
        }

        await order.save();
        res.json({
            success:true,
            message:'Order status updated succesfully'
        });
    }catch(error){
        next(error)
    }
};


const updateItemStatus = async (req,res,next)=>{
    try {
        const { orderId, productId } = req.params;
        const { status } = req.body;

        const order = await orderSchema.findById(orderId)
            .populate('items.product');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const item = order.items.find(item => 
            item.product._id.toString() === productId
        );

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Update item status
        item.order.status = status;
        item.order.statusHistory.push({
            status,
            date: new Date(),
            comment: `Status updated to ${status} by admin`
        });

        if (status === 'cancelled') {
            // Restore stock
            await productSchema.findByIdAndUpdate(
                item.product._id,
                { $inc: { stock: item.quantity } }
            );
            
            // Check if all items in the order are cancelled
            const allItemsCancelled = order.items.every(item => item.order.status === 'cancelled');
            
            // If all items are cancelled, update payment status to cancelled
            if (allItemsCancelled) {
                order.payment.paymentStatus = 'cancelled';
            }
        } else if (status === 'delivered' && order.payment.method === 'cod') {
            // Check if all items are either delivered or cancelled
            const allItemsCompleted = order.items.every(item => 
                item.order.status === 'delivered' || item.order.status === 'cancelled'
            );
            
            // Update payment status for COD orders when all items are delivered/cancelled
            if (allItemsCompleted) {
                order.payment.paymentStatus = 'completed';
            }
        }

        // Use markModified to ensure Mongoose detects nested updates
        order.markModified('items');
        order.markModified('payment');

        await order.save();
        res.json({ success: true, message: 'Item status updated successfully' });

    } catch (error) {
       next(error)
    }
};

const handleReturnRequest = async (req,res,next)=>{
    try{
        const { orderId , productId} = req.params;
        const {returnStatus , adminComment}= req.body;

        const order=  await orderSchema.findById(orderId)
        .populate('items.product');

        if(!order){
            return res.status(404).json({
                success:false,
                messaage:'Order not found'
            });
        }

        const item = order.items.find(item=>
            item.product._id.toString()===productId
        );


        if(!item){
            return res.status(404).json({
                success:false,
                messaage:'item not found'
            });
        }

        item.return.status = returnStatus;
        item.return.adminComment = adminComment;
        item.return.isReturnAccepted = returnStatus==='approved';

        if(returnStatus === 'approved'){
            item.order.status === 'returned';
            item.order.statusHistory.push({
                status:'returned',
                date:new Date(),
                comment:`return approved by admin:${adminComment}`
            });

            //restore stock
             // Get the product
         const product = await productSchema.findById(productId);
        if (!product) {
           return res.status(404).json({
             success: false,
         message: 'Product not found'
            });
                    }
         // Get the size from the order history
        const orderSize = item.size ;
        

        // Find the specific size in the product's size array
        const sizeIndex = product.size.findIndex(s => s.size === orderSize);
        

        if (sizeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Size not found in product'
            });
        }

        // Calculate new stock for the specific size
        const currentStock = product.size[sizeIndex].stock;
        const quantityToAdd = Number(item.quantity);
        const newStock = currentStock + quantityToAdd;

       

        // Update the stock for the specific size
        product.size[sizeIndex].stock = newStock;
        await product.save();


        order.payment.paymentStatus = 'refunded';
        //process refund
        await processItemRefund(order,item);
        }else if(returnStatus==='rejected'){
            item.order.status = 'delivered';
            item.order.statusHistory.push({
                status: 'delivered',
                date: new Date(),
                comment: `Return rejected by admin: ${adminComment}`
            });

            //set payment status to completed 
            order.payment.paymentStatus = 'completed';

        }

        await order.save();
        res.json({
            success:true,
            messaage:'Return request handled successfully'
        });

    }catch(error){
        next(error)
    }
};


//heper function to process rfund

async function processItemRefund(order){
    const wallet = await Wallet.findOne({userId:order.userId});

    if(!wallet){
        throw new error('User wallet not found');
    }

    const refundAmount = item.subtotal;
    wallet.balance+=refundAmount;
    wallet.transactions.push({
        type:'credit',
        amount:refundAmount,
        description:`Refund for item in order #${order.orderCode}`,
        orderId:order._id
    });

    await wallet.save();
    order.payment.paymentStatus = 'refunded';
}

export default {
    getOrders,
    updateOrderStatus,
    updateItemStatus,
    handleReturnRequest
}