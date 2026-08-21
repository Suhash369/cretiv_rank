import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Organization from '../models/Organization';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/constants';
import { AuthRequest } from '../middleware/auth';
import AuditLog from '../models/AuditLog';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Your account has been suspended.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        organizationId: user.organizationId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    // Audit log
    await AuditLog.create({
      organizationId: user.organizationId,
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: (user._id as any).toString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        jobRole: user.jobRole,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed server error.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    const user = await User.findById(req.user.id).populate('organizationId');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: 'Server error retrieving profile.' });
  }
};
