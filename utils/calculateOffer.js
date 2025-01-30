// //Calculate the final price after aplying coupon
// export const calculateFinalPrice= (product,categoryOffer,productOffer)=>{
//     let finalPrice = product.price;
//     let appliedDiscount = 0;



//     //Applycategory offer if exists
//     if(categoryOffer){
//         const categoryDiscountAmount = (finalPrice*categoryOffer.discount)/100;
//         appliedDiscount = Math.max(appliedDiscount,categoryDiscountAmount);
//     }


//     //Apply product offer if exists
//     if(productOffer){
//         const productDiscountAmount = (finalPrice*productOffer.discount)/100;
//         appliedDiscount = Math.max(appliedDiscount,productDiscountAmount);
//     }

//     finalPrice-=appliedDiscount;
//     return Math.round(finalPrice);
// }