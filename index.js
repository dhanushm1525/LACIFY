import express from "express";
import passport from "passport";
import session from "express-session";
import connectDb from "./connections/connection.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import nocache from "nocache";
import {config} from "dotenv";
import {log} from "mercedlogger";
import './utils/googleAuth.js';
import connnectDb from "./connections/connection.js";

config();

const app = express()
const PORT = process.env.PORT 

app.set("view engine","ejs")


app.use(nocache())
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized:false,
    cokie:{
        maxAge:1000*60*60*24
    }
}))



app.use(express.static('static'))
app.use('/js',express.static('static/js'));
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(passport.initialize())
app.use(passport.session())

//Routes
app.use('/',userRoutes)
app.use('/admin',adminRoutes)

//404 handler
app.use((req , res)=>{
    res.status(404).render('notFound',{
        fullname:req.session.user?req.session.user.fullname:null
    })
})
// Serve static files from the 'static' directory
app.use('/uploads', express.static('static/uploads'));
app.use(express.static('static'));

connectDb()

//Start server
app.listen(PORT,()=>{
    log.green('SERVER STATUS',`server runing on port : ${PORT}`)
})