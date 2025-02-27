import orderSchema from '../../model/orderModel.js';
import productSchema from '../../model/productModel.js';
import Wallet from '../../model/walletModel.js';

const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page || 1);
        const limit = 10;
        const skip = (page - 1) * limit;

        //get filter parameters
        const status = req.query.status;
        const dateFrom = req.query.dateFrom;
        const dateTo = req.query.dateTo;

        //build filter object 
        let filter = {};

        //exclude pending status by default 
        filter['items.order.status'] = { $ne: 'pending' };

        //add additional status filter if provided
        if (status) {
            filter['items.order.status'] = status;
        }

        if (dateFrom || dateTo) {
            filter.orderDate = {};
            if (dateFrom) filter.orderDate.$gte = new Date(dateFrom);
            if (dateTo) filter.orderDate.$lte = new Date(dateTo);
        }

        const totalOrders = await orderSchema.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await orderSchema.find(filter)
            .populate('userId', 'firstName lastName email')
            .populate('items.product')
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit);

        // Process orders to handle null products
        const processedOrders = orders.map(order => {
            const orderObj = order.toObject();
            orderObj.items = orderObj.items.map(item => ({
                ...item,
                product: item.product || {
                    _id: 'unavailable',
                    productName: 'Product Unavailable',
                    imageUrl: ['/images/placeholder.jpg'],
                    price: item.price || 0
                }
            }));
            return orderObj;
        });

        res.render('admin/orders', {
            orders: processedOrders,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            admin: req.session.admin
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).render('admin/error', {
            message: 'Error fetching orders',
            error,
            admin: req.session.admin
        });
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await orderSchema.findById(orderId)
            .populate('items.product');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        //update all items status
        order.items.forEach(item => {
            item.order.status = status;
            item.order.statusHistory.push({
                status,
                date: new Date(),
                comment: `status updated tO ${status} by admin`
            });
        });


        //handle stock updates 
        if (status === 'cancelled') {
            //restore stock
            for (const item of order.items) {
                await productSchema.findByIdAndUpdate(
                    item.product._id,
                    { $inc: { stock: item.quantity } }
                );
            }
        }

        await order.save();
        res.json({
            success: true,
            message: 'Order status updated succesfully'
        });
    } catch (error) {
        next(error)
    }
};


const updateItemStatus = async (req, res, next) => {
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

const handleReturnRequest = async (req, res, next) => {
    try {
        const { orderId, productId } = req.params;
        const { returnStatus, adminComment } = req.body;

        const order = await orderSchema.findById(orderId)
            .populate('items.product');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const item = order.items.find(item =>
            item.product._id.toString() === productId
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        if (returnStatus === 'approved') {
            // Update only the necessary fields
            const updateResult = await orderSchema.findOneAndUpdate(
                {
                    _id: orderId,
                    'items.product': productId
                },
                {
                    $set: {
                        'items.$.order.status': 'returned',
                        'items.$.return.status': returnStatus,
                        'items.$.return.adminComment': adminComment,
                        'items.$.return.isReturnAccepted': true,
                        'payment.paymentStatus': 'refunded'
                    },
                    $push: {
                        'items.$.order.statusHistory': {
                            status: 'returned',
                            date: new Date(),
                            comment: `return approved by admin:${adminComment}`
                        }
                    }
                },
                { new: true }
            );

            // Update product stock
            await productSchema.findOneAndUpdate(
                {
                    _id: productId,
                    'size.size': item.size
                },
                {
                    $inc: { 'size.$.stock': item.quantity }
                }
            );

            // Process refund with the specific item
            const refundItem = {
                subtotal: item.subtotal,
                quantity: item.quantity,
                size: item.size
            };

            await processItemRefund(order, refundItem);
        }

        res.json({
            success: true,
            message: 'Return request handled successfully'
        });

    } catch (error) {
        console.error('Error in handleReturnRequest:', error);
        next(error);
    }
};

//helper function to process refund
async function processItemRefund(order, refundItem) {
    try {
        const wallet = await Wallet.findOne({ userId: order.userId });

        if (!wallet) {
            throw new Error('User wallet not found');
        }

        const refundAmount = refundItem.subtotal;
        wallet.balance += refundAmount;
        wallet.transactions.push({
            type: 'credit',
            amount: refundAmount,
            description: `Refund for item in order #${order.orderCode}`,
            orderId: order._id
        });

        await wallet.save();
    } catch (error) {
        console.error('Error processing refund:', error);
        throw error;
    }
}

export default {
    getOrders,
    updateOrderStatus,
    updateItemStatus,
    handleReturnRequest
}