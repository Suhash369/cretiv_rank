import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './config/db';
import User from './models/User';
import Organization from './models/Organization';
import Question from './models/Question';
import QuestionVersion from './models/QuestionVersion';
import Assessment from './models/Assessment';
import Invitation from './models/Invitation';
import AssessmentAttempt from './models/AssessmentAttempt';
import Answer from './models/Answer';
import ProctoringEvent from './models/ProctoringEvent';
import AuditLog from './models/AuditLog';
import InterviewVerification from './models/InterviewVerification';

dotenv.config();

const resetData = async () => {
  try {
    await connectDB();
    console.log('🧹 Purging all sample/built-in questions and demo data from MongoDB Atlas database...');

    await Question.deleteMany({});
    await QuestionVersion.deleteMany({});
    await Assessment.deleteMany({});
    await Invitation.deleteMany({});
    await AssessmentAttempt.deleteMany({});
    await Answer.deleteMany({});
    await ProctoringEvent.deleteMany({});
    await AuditLog.deleteMany({});
    await InterviewVerification.deleteMany({});

    console.log('✅ Cleared all built-in questions, sample assessments & demo candidate data.');

    // Ensure pristine Organization and Admin account exist for clean product launch
    let org = await Organization.findOne({ domain: 'cretivra.com' });
    if (!org) {
      org = await Organization.create({
        name: 'CretivRank by Cretivra Enterprise',
        domain: 'cretivra.com',
        dataRetentionDays: 90,
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cretivra.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

    let orgAdmin = await User.findOne({ role: 'ORG_ADMIN' });
    if (!orgAdmin) {
      orgAdmin = await User.create({
        name: 'Lead Recruiter Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'ORG_ADMIN',
        organizationId: org._id,
        jobRole: 'Lead Technical Recruiter',
      });
    }

    console.log('----------------------------------------------------');
    console.log('✨ PERFECT PRODUCT LAUNCH DATABASE READY!');
    console.log(`🔑 ADMIN EMAIL:    ${adminEmail}`);
    console.log(`🔑 ADMIN PASSWORD: ${adminPassword}`);
    console.log('----------------------------------------------------');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

resetData();
