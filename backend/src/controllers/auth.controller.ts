import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, env } from '@deployhub/shared';

// Helper for validating email format
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password, confirmPassword, accountType } = req.body;

    // 1. Check if all required fields are provided
    if (!username || !email || !password || !confirmPassword || !accountType) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // 2. Validate Account Type
    if (accountType !== 'organization' && accountType !== 'individual') {
      res.status(400).json({ error: 'Invalid account type. Must be organization or individual.' });
      return;
    }

    // 3. Validate Email
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // 4. Validate Passwords Match
    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    // 5. Password Strength Validation (Basic)
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' });
      return;
    }

    // 6. Check for existing user (Username or Email)
    const existingUser = await User.findOne({
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
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 8. Create the user
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase(),
      passwordHash,
      accountType,
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
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // 2. Find user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Vague error to prevent user enumeration
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // 3. Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { id: user._id, accountType: user.accountType },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // 5. Send Response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        accountType: user.accountType,
      },
    });
  } catch (error) {
    next(error);
  }
};
