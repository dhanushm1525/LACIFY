const getHome = async (req ,  res)=>{
    try{
        res.render('user/home')
    }catch(error){
        console.error('Error rendering signup page:',error);
        res.status(500).render('error',{
            message:'Error loading signup page',
            error:error.message
        });
        
    }
}

export default {
    getHome
}