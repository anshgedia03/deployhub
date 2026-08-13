"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmployeeAccessLevel = exports.getEmployees = exports.createEmployee = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const shared_1 = require("@deployhub/shared");
// Helper for validating email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
const createEmployee = async (req, res, next) => {
    try {
        // Only organization accounts can create employees
        if (req.user?.accountType !== 'organization') {
            res.status(403).json({ error: 'Forbidden: Only organizations can add employees' });
            return;
        }
        const { username, email, password, role, accessLevel } = req.body;
        if (!username || !email || !password || !role) {
            res.status(400).json({ error: 'All fields (username, email, password, role) are required' });
            return;
        }
        if (!isValidEmail(email)) {
            res.status(400).json({ error: 'Invalid email format' });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters long' });
            return;
        }
        // Check for existing user
        const existingUser = await shared_1.User.findOne({
            $or: [{ email: email.toLowerCase() }, { username: username.trim() }],
        });
        if (existingUser) {
            if (existingUser.accountType === 'organization') {
                res.status(409).json({ error: 'Cannot add an organization account as an employee' });
                return;
            }
            if (existingUser.accountType === 'employee') {
                res.status(409).json({ error: 'This user is already registered as an employee' });
                return;
            }
            // If they are an individual, verify the password provided in the modal
            const isPasswordValid = await bcrypt_1.default.compare(password, existingUser.passwordHash);
            if (!isPasswordValid) {
                res.status(401).json({ error: 'User already exists. You must provide their correct current password to add them as an employee.' });
                return;
            }
            // Upgrade individual to employee
            existingUser.accountType = 'employee';
            existingUser.organizationId = req.user.id;
            existingUser.role = role.trim();
            existingUser.accessLevel = accessLevel || 'limited';
            await existingUser.save();
            res.status(200).json({
                message: 'Existing individual user converted to employee successfully',
                employee: {
                    id: existingUser._id,
                    username: existingUser.username,
                    email: existingUser.email,
                    role: existingUser.role,
                    accountType: existingUser.accountType,
                    accessLevel: existingUser.accessLevel,
                },
            });
            return;
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt_1.default.hash(password, saltRounds);
        const newEmployee = new shared_1.User({
            username: username.trim(),
            email: email.toLowerCase(),
            passwordHash,
            accountType: 'employee',
            organizationId: req.user.id, // Link to the organization
            role: role.trim(),
            accessLevel: accessLevel || 'limited',
        });
        await newEmployee.save();
        res.status(201).json({
            message: 'Employee created successfully',
            employee: {
                id: newEmployee._id,
                username: newEmployee.username,
                email: newEmployee.email,
                role: newEmployee.role,
                accountType: newEmployee.accountType,
                accessLevel: newEmployee.accessLevel,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createEmployee = createEmployee;
const getEmployees = async (req, res, next) => {
    try {
        if (req.user?.accountType !== 'organization') {
            res.status(403).json({ error: 'Forbidden: Only organizations can view employees' });
            return;
        }
        // Fetch users who are employees of this organization
        const employees = await shared_1.User.find({
            organizationId: req.user.id,
            accountType: 'employee',
        }).select('-passwordHash');
        res.status(200).json({ employees });
    }
    catch (error) {
        next(error);
    }
};
exports.getEmployees = getEmployees;
const updateEmployeeAccessLevel = async (req, res, next) => {
    try {
        if (req.user?.accountType !== 'organization') {
            res.status(403).json({ error: 'Forbidden: Only organizations can modify employee access' });
            return;
        }
        const employeeId = req.params.id;
        const { accessLevel } = req.body;
        if (!['full', 'limited'].includes(accessLevel)) {
            res.status(400).json({ error: 'Invalid access level. Must be "full" or "limited".' });
            return;
        }
        const employee = await shared_1.User.findOne({
            _id: employeeId,
            organizationId: req.user.id,
            accountType: 'employee',
        });
        if (!employee) {
            res.status(404).json({ error: 'Employee not found in your organization' });
            return;
        }
        employee.accessLevel = accessLevel;
        await employee.save();
        res.status(200).json({
            message: 'Employee access level updated successfully',
            employee: {
                id: employee._id,
                username: employee.username,
                accessLevel: employee.accessLevel,
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateEmployeeAccessLevel = updateEmployeeAccessLevel;
//# sourceMappingURL=employee.controller.js.map