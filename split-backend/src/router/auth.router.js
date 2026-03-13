import { Router } from 'express';
import { googleSignIn } from '../controller/auth.controller.js';

const authRouter = Router();

authRouter.post('/google', googleSignIn);

export default authRouter;
