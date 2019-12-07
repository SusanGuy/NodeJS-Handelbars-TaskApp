const alreadyAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        res.redirect("/taskboard");
    } else {
        return next();
    }
};

const isAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        res.redirect("/users/login");
    } else {
        return next();
    }
};

module.exports = {
    alreadyAuthenticated,
    isAuthenticated
};