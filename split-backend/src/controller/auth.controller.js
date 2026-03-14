import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../model/index.js';
import { sendLoginNotificationEmail } from '../services/emailService.js';

const getOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not set in environment');
  return new OAuth2Client(clientId);
};

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
    const { email, name, password, upiId } = req.body;

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
      upiId: upiId || null,
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
        upiId: user.upiId,
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
    sendLoginNotificationEmail(user.email, user.name).catch(() => {});

    const accessToken = signAccessToken(user);

    return res.status(200).json({
      message: 'Sign in successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        upiId: user.upiId,
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

async function googleSignIn(req, res) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    const client = getOAuthClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || payload.email_verified === false) {
      return res.status(400).json({ message: 'Invalid Google token payload' });
    }

    const normalizedEmail = payload.email.toLowerCase();
    let user = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Create a brand new auto-generated account
      user = await User.create({
        email: normalizedEmail,
        name: payload.name || normalizedEmail.split('@')[0],
        avatarUrl: payload.picture || null,
        authProvider: 'google',
        isActive: true,
        lastLoginAt: new Date(),
      });
    } else {
      // Update their login time and profile if needed
      user.name = payload.name || user.name;
      user.avatarUrl = payload.picture || user.avatarUrl;
      user.authProvider = 'google';
      user.lastLoginAt = new Date();
      await user.save();
    }

    const accessToken = signAccessToken(user);

    return res.status(200).json({
      message: 'Google Sign-in successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Google Sign-in failed:', error);
    return res.status(401).json({
      message: 'Google authentication failed',
      error: error.message,
    });
  }
}

export {
  signUp,
  signIn,
  updateProfile,
  googleSignIn,
};
