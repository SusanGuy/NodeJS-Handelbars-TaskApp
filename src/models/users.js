const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const Task = require("./tasks");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid");
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes("password")) {
                throw new Error("Cannot have the word password!");
            } else if (value.length < 7) {
                throw new Error("Password must be atleast 6 characters!");
            }
        }
    },
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});
userSchema.virtual("tasks", {
    ref: "Task",
    localField: "_id",
    foreignField: "owner"
});

userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.avatar;
    return userObject;
};

userSchema.statics.findByCredentials = async(email, password) => {
    const user = await User.findOne({
        email
    });
    if (!user) {
        throw new Error("User doesnot exist");
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Password or Email is incorrect");
    }
    return user;
};

userSchema.pre("save", async function(next) {
    const user = this;
    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});
userSchema.pre("remove", async function(next) {
    const user = this;
    await Task.deleteMany({
        owner: user._id
    });
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;