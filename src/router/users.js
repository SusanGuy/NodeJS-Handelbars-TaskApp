const User = require("../models/users");
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const router = new express.Router();

const { alreadyAuthenticated, isAuthenticated } = require("../middleware/auth");

passport.use(
    new LocalStrategy({
            usernameField: "email",
            passwordField: "password"
        },
        async(username, password, done) => {
            try {
                const user = await User.findByCredentials(username, password);
                return done(null, user);
            } catch (err) {
                return done(null, false, {
                    message: err.toString().split(": ")[1]
                });
            }
        }
    )
);

passport.serializeUser(async(user, done) => {
    const userToView = await user;
    done(null, userToView._id);
});

passport.deserializeUser(async(id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

router.get("/users/signup", alreadyAuthenticated, (req, res) => {
    res.render("signup", {
        title: "Sign Up",
        message: req.flash()
    });
});

router.get("/users/login", alreadyAuthenticated, (req, res) => {
    res.render("login", {
        title: "Sign In",
        message: req.flash()
    });
});

router.post("/users/signup", async(req, res) => {
    try {
        if (req.body.password !== req.body.confirm_password) {
            req.flash("err_msg", "Passwords donot match!");
            res.redirect("/users/signup");
        }
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });
        await user.save();
        req.flash("success_msg", "You are successfully registered");
        res.redirect("/users/login");
    } catch (err) {
        let errMsg;
        if (err.name == "MongoError") {
            errMsg = "User already exists";
        } else if (err.errors.email) {
            errMsg = err.errors.email.message;
        } else if (err.errors.password) {
            errMsg = err.errors.password.message;
        }
        req.flash("err_msg", errMsg);
        res.redirect("/users/signup");
    }
});

router.post(
    "/users/login",
    passport.authenticate("local", {
        successRedirect: "/taskboard",
        failureRedirect: "/users/login",
        failureFlash: true
    })
);

router.get("/users/me", isAuthenticated, async(req, res) => {
    try {
        await req.user
            .populate({
                path: "tasks"
            })
            .execPopulate();

        res.render("aboutme", {
            totalTasks: req.user.tasks.length,
            completedTask: req.user.tasks.filter(task => task.completed === true)
                .length
        });
    } catch (err) {
        res.status(400).send(err);
    }
});

router.get("/users/logout", isAuthenticated, (req, res) => {
    req.logout();
    req.flash("success_msg", "You are logged out");
    res.redirect("/users/login");
});

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload an image"));
        }
        cb(undefined, true);
    }
});

router.post(
    "/users/upload",
    upload.single("file"),
    isAuthenticated,

    async(req, res) => {
        try {
            const buffer = await sharp(req.file.buffer)
                .resize({
                    width: 250,
                    height: 250
                })
                .png()
                .toBuffer();
            req.user.avatar = buffer;

            await req.user.save();

            res.redirect("/users/me");
        } catch (err) {
            res.redirect("/users/me");
        }
    }
);

router.get("/users/:id/photo", isAuthenticated, async(req, res) => {
    res.set("Content-Type", "image/png");
    res.send(req.user.avatar);
});

router.get("/users/changepassword", isAuthenticated, async(req, res) => {
    res.render("changepassword", {
        message: req.flash()
    });
});

router.get("/users/edit", isAuthenticated, async(req, res) => {
    res.render("editProfile", {
        message: req.flash()
    });
});

router.post("/users/edit", isAuthenticated, async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.name = req.body.name;
        user.email = req.body.email;
        await user.save();
        req.flash("success_msg", "Update Succesful! ");
        res.redirect("/users/me");
    } catch (err) {
        let errMsg;
        if (err.name == "MongoError") {
            errMsg = "User already exists";
        } else if (err.errors.email) {
            errMsg = err.errors.email.message;
        }
        req.flash("err_msg", errMsg);
        res.redirect("/users/edit");
    }
});

router.post("/users/changepassword", isAuthenticated, async(req, res) => {
    try {
        const user = await User.findByCredentials(
            req.user.email,
            req.body.password
        );

        user.password = req.body.new_password;
        await user.save();
        req.logout();
        req.flash("success_msg", "Password changed succesfully!");
        res.redirect("/users/login");
    } catch (err) {
        if (err.toString().split(": ")[0] === "Error") {
            req.flash("err_msg", "Wrong Password!");
        } else {
            req.flash("err_msg", err.errors.password.message);
        }
        res.redirect("/users/changepassword");
    }
});

router.get("/users/delete", isAuthenticated, async(req, res) => {
    try {
        await req.user.remove();
        req.logout();
        req.flash("success_msg", "User deleted successfully!");
        res.redirect("/users/login");
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get("/users/delete/image", isAuthenticated, async(req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.redirect("/users/me");
});

module.exports = router;