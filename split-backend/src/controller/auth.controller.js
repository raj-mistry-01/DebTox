import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../model/index.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

async function googleSignIn(req, res) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token payload' });
    }

    const [user] = await User.findOrCreate({
      where: { email: payload.email.toLowerCase() },
      defaults: {
        googleSub: payload.sub,
        name: payload.name || payload.email.split('@')[0],
        email: payload.email.toLowerCase(),
        avatarUrl: payload.picture || null,
        authProvider: 'google',
        isActive: true,
        lastLoginAt: new Date(),
      },
    });

    if (!user.googleSub) {
      user.googleSub = payload.sub;
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = signAccessToken(user);

    return res.status(200).json({
      message: 'Google sign-in successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    return res.status(401).json({
      message: 'Google authentication failed',
      error: error.message,
    });
  }
}

export {
  googleSignIn,
};
