import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../model/index.js';

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function signUp(req, res) {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ message: 'email, name, and password are required' });
    }

    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      authProvider: 'email',
      isActive: true,
      lastLoginAt: new Date(),
    });

    const accessToken = signAccessToken(user);

    return res.status(201).json({
      message: 'User created successfully',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Sign up failed',
      error: error.message,
    });
  }
}

async function signIn(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || '');

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = signAccessToken(user);

    return res.status(200).json({
      message: 'Sign in successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(401).json({
      message: 'Sign in failed',
      error: error.message,
    });
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.user.sub;
    const { name, phone, upiId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (upiId) user.upiId = upiId;

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        upiId: user.upiId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Profile update failed',
      error: error.message,
    });
  }
}

export {
  signUp,
  signIn,
  updateProfile,
};
