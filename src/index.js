const express = require("express");
const app = express();

require("./db/mongoose");

const port = process.env.PORT;
const userRouter = require("./router/users");
const taskRouter = require("./router/tasks");
const expressSession = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const hbs = require("hbs");
const path = require("path");
const viewsPath = path.join(__dirname + "/../templates/views");
const partialPath = path.join(__dirname + "/../templates/partials");
const static = path.join(__dirname + "/../public");
const flash = require("req-flash");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

app.use(express.static(static));
app.set("view engine", "hbs");
app.set("views", viewsPath);
hbs.registerPartials(partialPath);

//Express Session
app.use(cookieParser());
app.use(
    expressSession({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: true,
        resave: true
    })
);
app.use(flash());

//Passport Init
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.host = process.env.DOMAIN + port;
    next();
});

app.use(userRouter);
app.use(taskRouter);

app.get("/", (req, res) => {
    res.render("index", {
        title: "HomePage"
    });
});

app.listen(port, () => {
    console.log("Server running on port ", port);
});