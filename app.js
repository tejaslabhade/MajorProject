if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const { saveRedirectUrl } = require("./middleware.js");

const dbUrl = process.env.ATLASDB_URL;

console.log("DB URL exists:", !!process.env.ATLASDB_URL);

const store = MongoStore.create({
    mongoUrl : dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
});

store.on("error",(err)=>{
    console.log("ERROR in MONGO SESSION STORE",err);
});

const sessionOption = {
    store,
    secret:process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie :{
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxAge : 7*24*60*60*1000,
        httpOnly : true,
    },
};


app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

async function main(){
    await mongoose.connect(dbUrl);
}

main()
    .then(()=>{
        console.log("connected to DB");
    })
    .catch((err)=>{
        console.log(err);
    });


app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(saveRedirectUrl);

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/",userRouter);

app.all('*',(req,res,next)=>{
    next(new ExpressError(404,"Page not found."));

});

app.use((err,req,res,next)=>{
    let { statusCode=500, message="something went wrong!"} = err;
    res.status(statusCode).render("error.ejs",{message});
})
app.listen("8080",()=>{
    console.log("server is listening to port 8080");
})