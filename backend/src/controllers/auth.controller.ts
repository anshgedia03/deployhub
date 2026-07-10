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
    const secret: string = (env.JWT_SECRET as unknown as string) || 'secret';
    const token = jwt.sign(
      { id: user._id, accountType: user.accountType },
      secret,
      { expiresIn: env.JWT_EXPIRES_IN as any }
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

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        accountType: user.accountType,
        organizationName: user.organizationName,
      }
    });
  } catch (error) {
    next(error);
  }
};
