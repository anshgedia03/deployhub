import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { User } from '@deployhub/shared';

// Helper for validating email format
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Only organization accounts can create employees
    if (req.user?.accountType !== 'organization') {
      res.status(403).json({ error: 'Forbidden: Only organizations can add employees' });
      return;
    }

    const { username, email, password, role } = req.body;

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
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.trim() }],
    });

    if (existingUser) {
      res.status(409).json({ error: 'Email or Username is already registered' });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newEmployee = new User({
      username: username.trim(),
      email: email.toLowerCase(),
      passwordHash,
      accountType: 'employee',
      organizationId: req.user.id, // Link to the organization
      role: role.trim(),
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
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.accountType !== 'organization') {
      res.status(403).json({ error: 'Forbidden: Only organizations can view employees' });
      return;
    }

    // Fetch users who are employees of this organization
    const employees = await User.find({
      organizationId: req.user.id,
      accountType: 'employee',
    }).select('-passwordHash');

    res.status(200).json({ employees });
  } catch (error) {
    next(error);
  }
};
