"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const shared_1 = require("@deployhub/shared");
// Helper for validating email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
const registerUser = async (req, res, next) => {
    try {
        const { username, email, password, accountType, organizationName } = req.body;
        // 1. Check if all required fields are provided
        if (!username || !email || !password || !accountType) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }
        // 2. Validate Account Type and specific fields
        if (accountType !== 'organization' && accountType !== 'individual') {
            res.status(400).json({ error: 'Invalid account type. Must be organization or individual.' });
            return;
        }
        if (accountType === 'organization' && !organizationName) {
            res.status(400).json({ error: 'Organization name is required for organization accounts.' });
            return;
        }
        // 3. Validate Email
        if (!isValidEmail(email)) {
            res.status(400).json({ error: 'Invalid email format' });
            return;
        }
        // 4. Validate Passwords Match (Removed as confirmPassword is not used in UI)
        // 5. Password Strength Validation (Basic)
        if (password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters long' });
            return;
        }
        // 6. Check for existing user (Username or Email)
        const existingUser = await shared_1.User.findOne({
            $or: [{ email: email.toLowerCase() }, { username: username.trim() }],
        });
        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                res.status(409).json({ error: 'Email is already registered' });
                return;
            }
            if (existingUser.username === username.trim()) {
                res.status(409).json({ error: 'Username is already taken' });
                return;
            }
        }
        // 7. Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt_1.default.hash(password, saltRounds);
        // 8. Create the user
        const newUser = new shared_1.User({
            username: username.trim(),
            email: email.toLowerCase(),
            passwordHash,
            accountType,
            organizationName: accountType === 'organization' ? organizationName.trim() : undefined,
        });
        await newUser.save();
        // 9. Respond with success (excluding passwordHash)
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                accountType: newUser.accountType,
                organizationName: newUser.organizationName,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // 1. Validation
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        // 2. Find user by email (case-insensitive)
        const user = await shared_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Vague error to prevent user enumeration
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // 3. Verify Password
        const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // 4. Generate JWT Token
        const secret = shared_1.env.JWT_SECRET || 'secret';
        const token = jsonwebtoken_1.default.sign({ id: user._id, accountType: user.accountType }, secret, { expiresIn: shared_1.env.JWT_EXPIRES_IN });
        let organizationName = user.organizationName;
        if (user.accountType === 'employee' && user.organizationId) {
            const org = await shared_1.User.findById(user.organizationId).select('organizationName username');
            if (org) {
                organizationName = org.organizationName || org.username;
            }
        }
        // 5. Send Response
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                accountType: user.accountType,
                organizationName: organizationName,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.loginUser = loginUser;
const getCurrentUser = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const user = await shared_1.User.findById(req.user.id).select('-passwordHash');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        let organizationName = user.organizationName;
        if (user.accountType === 'employee' && user.organizationId) {
            const org = await shared_1.User.findById(user.organizationId).select('organizationName username');
            if (org) {
                organizationName = org.organizationName || org.username;
            }
        }
        res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                accountType: user.accountType,
                organizationName: organizationName,
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCurrentUser = getCurrentUser;
//# sourceMappingURL=auth.controller.js.map