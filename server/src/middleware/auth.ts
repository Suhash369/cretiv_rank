import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, CANDIDATE_JWT_SECRET } from '../config/constants';
import User from '../models/User';
import Invitation from '../models/Invitation';
import AssessmentAttempt from '../models/AssessmentAttempt';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'INTERVIEWER' | 'CANDIDATE';
    organizationId?: string;
  };
  candidateAttempt?: {
    attemptId: string;
    invitationId: string;
    assessmentId: string;
    organizationId: string;
    candidateName: string;
    candidateEmail: string;
  };
}

export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: string;
      organizationId?: string;
    };

    const user = await User.findById(decoded.id);
    if (!user || user.status === 'SUSPENDED') {
      return res.status(401).json({ error: 'User account is inactive or suspended.' });
    }

    req.user = {
      id: (user._id as any).toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ? (user.organizationId as any).toString() : undefined,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authorization token.' });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this action.' });
    }
    next();
  };
};

export const authenticateCandidate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Candidate session token missing.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, CANDIDATE_JWT_SECRET) as {
      attemptId: string;
      invitationId: string;
      assessmentId: string;
      organizationId: string;
      candidateName: string;
      candidateEmail: string;
    };

    const attempt = await AssessmentAttempt.findById(decoded.attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Assessment attempt record not found.' });
    }

    req.candidateAttempt = {
      attemptId: (attempt._id as any).toString(),
      invitationId: (attempt.invitationId as any).toString(),
      assessmentId: (attempt.assessmentId as any).toString(),
      organizationId: (attempt.organizationId as any).toString(),
      candidateName: attempt.candidateName,
      candidateEmail: attempt.candidateEmail,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired candidate session token.' });
  }
};
