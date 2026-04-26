const User = require("../models/user");
const { generateToken } = require("../utils/jwt");
const { z } = require("zod");


const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Please provide a valid email"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

const loginSchema = z.object({
    email: z.email("Please provide a valid email"),
    password: z.string().min(1, "Password is required")
});


// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {

        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Validation Error",
                errors: validation.error.errors.map(err => err.message)
            });
        }


        const { name, email, phone, password } = validation.data;


        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email or phone already exists"
            });
        }

        const user = await User.create({
            name,
            email,
            phone,
            password
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error("Register error : ", error);
        res.status(500).json({
            success: false,
            message: "Server error during registration"
        });
    }
};


// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {

        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Validation Error",
                errors: validation.error.errors.map(err => err.message)
            });
        }

        const { email, password } = validation.data;


        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error : ", error);
        res.status(500).json({
            success: false,
            message: "Server error in login"
        });
    }
};


// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    try {

        const user = await User.findById(req.userId).select('-password -__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get Profile error : ", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};