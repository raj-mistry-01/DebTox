import { Router } from 'express';
import { signUp, signIn, updateProfile, googleSignIn } from '../controller/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const authRouter = Router();

authRouter.post('/signup', signUp);
authRouter.post('/signin', signIn);
authRouter.post('/google-signin', googleSignIn);
authRouter.put('/profile', requireAuth, updateProfile);

export default authRouter;
