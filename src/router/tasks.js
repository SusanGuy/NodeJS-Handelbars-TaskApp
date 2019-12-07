const express = require("express");
const router = new express.Router();
const Task = require("../models/tasks");
const { alreadyAuthenticated, isAuthenticated } = require("../middleware/auth");

router.post("/taskboard/create", isAuthenticated, async(req, res) => {
    const newTask = new Task({
        description: req.body.description,
        completed: req.body.completed ? true : false,
        owner: req.user._id
    });
    try {
        await newTask.save();
        req.flash("success_msg", "Task saved Succesfully");
        res.redirect("/taskboard");
    } catch (err) {
        res.status(400).send(err);
    }
});

router.get("/taskboard", isAuthenticated, async(req, res) => {
    try {
        await req.user
            .populate({
                path: "tasks"
            })
            .execPopulate();

        res.render("taskboard", {
            title: "Your Tasks",
            tasks: req.user.tasks,
            message: req.flash()
        });
    } catch (err) {
        res.status(400).send(err);
    }
});

router.get("/taskboard/update/:id", isAuthenticated, async(req, res) => {
    const task = await Task.findById(req.params.id);
    res.render("editTask", {
        title: "Edit Task",
        task
    });
});

router.post("/taskboard/update/:id", isAuthenticated, async(req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({ _id, owner: req.user._id });

        task.description = req.body.description;
        task.completed = req.body.completed ? true : false;

        await task.save();

        res.redirect("/taskboard");
    } catch (err) {
        res.status(400).send(err);
    }
});

router.get("/taskboard/create", isAuthenticated, (req, res) => {
    res.render("createTask", {
        title: "Create Task"
    });
});

router.get("/taskboard/delete/:id", isAuthenticated, async(req, res) => {
    const _id = req.params.id;
    try {
        await Task.findOneAndDelete({
            _id,
            owner: req.user._id
        });

        res.redirect("/taskboard");
    } catch (err) {
        res.status(400).send(err);
    }
});

router.get("/taskboard/updateStatus/:id", isAuthenticated, async(req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        task.completed = true;
        await task.save();

        res.redirect("/taskboard");
    } catch (err) {
        res.status(400).send();
    }
});

module.exports = router;