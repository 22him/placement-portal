import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as c from '../controllers/auth.controller.js';

const r = Router();
r.post('/register', c.register);
r.post('/login', c.login);
r.post('/admin/login', c.adminLogin);
r.post('/forgot-password', c.forgotPassword);
r.post('/reset-password/:token', c.resetPassword);
r.get('/me', protect, c.me);
r.put('/password', protect, c.changePassword);
export default r;
