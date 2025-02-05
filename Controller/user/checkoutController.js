import cartSchema from '../../model/cartModel.js';
import orderSchema from '../../model/orderModel.js';
import addressSchema from '../../model/addressModel.js';
import productSchema from '../../model/productModel.js';


const getCheckoutPage = async (req,res)=>{
    try{
        //get users addresses
        const addresses = await addressSchema.find({
            userId:req.session.user
        });

        //get cart items with populated product details
        const cart = await cartSchema.findOne({userId:req.session.user});
        
        if(!cart || !cart.items || cart.items.length === 0){
            return res.redirect('/cart');
        }

        //populate product details and calculate subtotals
        const populatedCart = await cartSchema.findOne({userId:req.session.user})
        .populate({
            path:'items.productId',
            model:'Product',
            select:'productName imageUrl price stock'
        });
        
        //check stock availability
        const stockCheck= populatedCart.items.every(item=>
            item.productId.stock>=item.quantity
        );

        if(!stockCheck){
            return res.redirect('/cart?error=stock');
        }

        //format cart items for the template 
        const cartItems = populatedCart.items.map(item=>({
            product: {
                _id: item.productId._id,
                productName: item.productId.productName,
                imageUrl: item.productId.imageUrl,
            },
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price
        }));

        //calculate total
        const total = cartItems.reduce((sum,item)=> sum + item.subtotal, 0);

        res.render('user/checkout',{
            addresses,
            cartItems,
            total,
            user:req.session.user,
            wallet: null  // Add this to prevent undefined errors
        });
    }catch(error){
        console.error('Checkout page error',error);
        res.status(500).render('notFound',{
            message:'Error loading checkout page',
            user:req.session.user
        });
    }
};

const placeOrder = async (req,res)=>{
    try{
        const {addressId, paymentMethod } = req.body;
        const userId = req.session.user;

        //get cart and validate
        const cart = await cartSchema.findOne({userId})
        .populate('items.productId');

        if(!cart||cart.items.length===0){
            return res.status(400).json({
                sucess:false,
                message:'Cart is empty'                
            });
        }

        //calculate the total amount
        const cartTotal = cart.items.reduce((sum,item)=>sum+(item.quantity*item.price),0);


        // validate COD paymernt method
        if(paymentMethod==='cod'&&cartTotal>500000){
            return res.status(400).json({
                success:false,
                message:'Cash on Delivery is not available for orders above ₹5,00,000. Please choose a different payment method.'
            });
        } 


        //prepare initial items with basic info
        const initialItems = cart.items.map(item=>({
            product:item.productId._id,
            quantity: item.quantity,
            price:item.price

        }));


        //add order status and return fields to each item
        const orderItems = initialItems.map(item=>({
            ...item,
            subtotal: item.quantity * item.price,
            order:{
                status: paymentMethod === 'cod' ? 'processing' : 'pending',
                statusHistory:[{
                    status: paymentMethod === 'cod' ? 'processing' : 'pending',
                    date: new Date(),
                    comment: paymentMethod === 'cod' ?
                        'Order confirmed with cash on delivery' :
                        'Order placed, awaiting payment'
                }]
            },
            return: {
                isReturnRequested: false,
                reason: null,
                requestDate: null,
                status: null,
                adminComment: null,
                isReturnAccepted: false
            }
        }));

        //get address 
        const address = await addressSchema.findOne({
            _id:addressId,
            userId
        });

        if(!address){
            return res.status(400).json({
                success:false,
                message:'Delivery address not found'
            });
        }

        const order = await orderSchema.create({
            userId,
            items: orderItems,
            totalAmount: Math.round(cartTotal),
            
            shippingAddress: {
                fullName: address.fullName,
                mobileNumber: address.mobileNumber,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2,
                city: address.city,
                state: address.state,
                pincode: address.pincode
            },
            payment: {
                method: paymentMethod,
                paymentStatus: paymentMethod === 'cod' ? 'processing' : 'completed'
            }
        });

        //update product stock
        for(const item of orderItems){
            await productSchema.findOneAndUpdate(
                item.product,
                {$inc:{stock:-item.quantity}}
            );
        }

        //clear cart 
        await cartSchema.findByIdAndUpdate(cart._id,{
            items:[],
            totalAmount:0
        });

         res.json({
            success:true,
            message:'Order placed successfully',
            orderId:order.orderCode
         });

    }catch(error){
        console.error('Place order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error placing order'
        });
    }
}


export default{
    getCheckoutPage,
    placeOrder
}