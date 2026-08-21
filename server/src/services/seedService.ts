import Organization from '../models/Organization';
import User from '../models/User';
import Question from '../models/Question';
import QuestionVersion from '../models/QuestionVersion';
import Assessment from '../models/Assessment';
import Invitation from '../models/Invitation';
import AssessmentAttempt from '../models/AssessmentAttempt';
import { v4 as uuidv4 } from 'uuid';

export const seedDatabase = async () => {
  try {
    // 1. Ensure Primary Organization & Admin User always exist for login
    let org = await Organization.findOne({ domain: 'cretivra.com' });
    if (!org) {
      org = await Organization.findOne({ domain: 'cretivrank.com' });
    }

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

    let interviewer = await User.findOne({ role: 'INTERVIEWER' });
    if (!interviewer) {
      interviewer = await User.create({
        name: 'Technical Interviewer',
        email: 'interviewer@cretivra.com',
        password: 'password123',
        role: 'INTERVIEWER',
        organizationId: org._id,
        jobRole: 'Lead Data Analyst',
      });
    }

    console.log('----------------------------------------------------');
    console.log('✅ ADMIN ACCOUNT READY FOR LOGIN:');
    console.log(`🔑 Admin Email:    ${adminEmail}`);
    console.log(`🔑 Password:       ${adminPassword}`);
    console.log('----------------------------------------------------');

    if (process.env.SEED_SAMPLE_DATA !== 'true') {
      console.log('⚡ Clean Production Mode: Sample database seeding is disabled by default.');
      return;
    }

    // 3. Create 30 High-Quality Questions across the required topics:
    // Quantitative Aptitude, Logical Reasoning, Probability, Statistics, Data Interpretation, Business Analytics, SQL, Python, Excel, Power BI, DAX
    const sampleQuestions = [
      // Quant
      {
        question: '[DEVELOPMENT SAMPLE] If a company\'s annual revenue increases by 20% in Year 1 and decreases by 10% in Year 2, what is the net percentage change over the two-year period?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: '+10%' },
          { id: 'B', text: '+8%' },
          { id: 'C', text: '+12%' },
          { id: 'D', text: '-2%' },
        ],
        correctAnswer: 'B',
        marks: 1,
        section: 'Quantitative Aptitude',
        skill: 'Percentage & Growth',
        difficulty: 'Medium',
        explanation: 'Net change = (1 + 0.20) * (1 - 0.10) - 1 = 1.20 * 0.90 - 1 = 1.08 - 1 = +8%.',
      },
      {
        question: '[DEVELOPMENT SAMPLE] A server processes 150 candidate applications in 3 hours. How many applications can 4 identical servers process in 6 hours?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: '600' },
          { id: 'B', text: '900' },
          { id: 'C', text: '1200' },
          { id: 'D', text: '1500' },
        ],
        correctAnswer: 'C',
        marks: 1,
        section: 'Quantitative Aptitude',
        skill: 'Rate & Work',
        difficulty: 'Easy',
        explanation: 'Rate per server = 150 / 3 = 50 apps/hr. 4 servers in 6 hrs = 4 * 6 * 50 = 1200.',
      },
      {
        question: '[DEVELOPMENT SAMPLE] What is the compound interest on $10,000 at 10% per annum compounded annually for 2 years?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: '$2,000' },
          { id: 'B', text: '$2,100' },
          { id: 'C', text: '$2,200' },
          { id: 'D', text: '$2,500' },
        ],
        correctAnswer: 'B',
        marks: 1,
        section: 'Quantitative Aptitude',
        skill: 'Financial Math',
        difficulty: 'Medium',
        explanation: 'A = 10000 * (1.10)^2 = 12,100. CI = 12,100 - 10,000 = $2,100.',
      },
      // Statistics & Probability
      {
        question: '[DEVELOPMENT SAMPLE] Two fair six-sided dice are rolled simultaneously. What is the probability that the sum of the numbers shown is equal to 8?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: '5/36' },
          { id: 'B', text: '1/6' },
          { id: 'C', text: '7/36' },
          { id: 'D', text: '1/9' },
        ],
        correctAnswer: 'A',
        marks: 1,
        section: 'Probability & Statistics',
        skill: 'Combinatorics',
        difficulty: 'Hard',
        explanation: 'Combinations giving 8: (2,6), (3,5), (4,4), (5,3), (6,2) -> 5 outcomes out of 36 total. Probability = 5/36.',
      },
      {
        question: '[DEVELOPMENT SAMPLE] In a dataset of candidate scores: [65, 70, 75, 80, 85, 90, 100], what is the median score?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: '75' },
          { id: 'B', text: '80' },
          { id: 'C', text: '85' },
          { id: 'D', text: '79.3' },
        ],
        correctAnswer: 'B',
        marks: 1,
        section: 'Probability & Statistics',
        skill: 'Descriptive Statistics',
        difficulty: 'Easy',
        explanation: '7 sorted values. Middle value (4th element) is 80.',
      },
      {
        question: '[DEVELOPMENT SAMPLE] Which statistical metric is most robust against extreme outliers when measuring central tendency?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: 'Mean' },
          { id: 'B', text: 'Standard Deviation' },
          { id: 'C', text: 'Median' },
          { id: 'D', text: 'Variance' },
        ],
        correctAnswer: 'C',
        marks: 1,
        section: 'Probability & Statistics',
        skill: 'Statistical Modeling',
        difficulty: 'Medium',
        explanation: 'The median depends on rank order rather than numerical values, making it robust to outliers.',
      },
      // Data Interpretation
      {
        question: '[DEVELOPMENT SAMPLE] Company X sales breakdown: Q1=$120k, Q2=$150k, Q3=$180k, Q4=$250k. What percentage of annual revenue was earned in Q4?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: '25%' },
          { id: 'B', text: '31.25%' },
          { id: 'C', text: '35.71%' },
          { id: 'D', text: '40%' },
        ],
        correctAnswer: 'C',
        marks: 1,
        section: 'Data Interpretation',
        skill: 'Quarterly Financial Analysis',
        difficulty: 'Medium',
        explanation: 'Total = 120 + 150 + 180 + 250 = 700k. Q4 % = 250 / 700 = 35.71%.',
      },
      {
        question: '[DEVELOPMENT SAMPLE] Given a scatter plot comparing candidate assessment duration vs score showing a Pearson correlation coefficient r = -0.75, how should this relationship be interpreted?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: 'Strong positive correlation' },
          { id: 'B', text: 'Strong negative correlation' },
          { id: 'C', text: 'No linear correlation' },
          { id: 'D', text: 'Direct linear causation' },
        ],
        correctAnswer: 'B',
        marks: 1,
        section: 'Data Interpretation',
        skill: 'Correlation Analysis',
        difficulty: 'Hard',
        explanation: 'r = -0.75 indicates a strong inverse (negative) linear relationship.',
      },
      // Logical Reasoning
      {
        question: '[DEVELOPMENT SAMPLE] All Data Analysts are proficient in SQL. Some Data Analysts are proficient in Python. Which statement MUST logically follow?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: 'All people proficient in SQL are Data Analysts.' },
          { id: 'B', text: 'Some people proficient in SQL are proficient in Python.' },
          { id: 'C', text: 'All Python users are Data Analysts.' },
          { id: 'D', text: 'No Python user knows SQL.' },
        ],
        correctAnswer: 'B',
        marks: 1,
        section: 'Logical Reasoning',
        skill: 'Syllogism',
        difficulty: 'Hard',
        explanation: 'Since some Data Analysts know Python, and all Data Analysts know SQL, those Analysts who know Python also know SQL.',
      },
      {
        question: '[DEVELOPMENT SAMPLE] If RECRUIT is coded as 18-5-3-18-21-9-20, what is the numeric code for RANK?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: '18-1-14-11' },
          { id: 'B', text: '17-2-15-12' },
          { id: 'C', text: '18-1-13-10' },
          { id: 'D', text: '19-1-14-11' },
        ],
        correctAnswer: 'A',
        marks: 1,
        section: 'Logical Reasoning',
        skill: 'Pattern Recognition',
        difficulty: 'Easy',
        explanation: 'R=18, A=1, N=14, K=11.',
      },
      // Business Analytics & Excel / Power BI / DAX
      {
        question: '[DEVELOPMENT SAMPLE] In Power BI DAX, which function evaluates an expression in a context modified by explicit filters?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: 'SUMX' },
          { id: 'B', text: 'CALCULATE' },
          { id: 'C', text: 'FILTER' },
          { id: 'D', text: 'EARLIER' },
        ],
        correctAnswer: 'B',
        marks: 1,
        section: 'Power BI & Excel',
        skill: 'DAX Expressions',
        difficulty: 'Medium',
        explanation: 'CALCULATE is the primary function in DAX for modifying filter context.',
      },
      {
        question: '[DEVELOPMENT SAMPLE] In Excel, which formula returns the relative position of an item in a range that matches a specified value?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: 'VLOOKUP' },
          { id: 'B', text: 'INDEX' },
          { id: 'C', text: 'MATCH' },
          { id: 'D', text: 'XLOOKUP' },
        ],
        correctAnswer: 'C',
        marks: 1,
        section: 'Power BI & Excel',
        skill: 'Lookup Formulas',
        difficulty: 'Easy',
        explanation: 'MATCH returns the index position of a lookup value.',
      },
      // SQL & Database
      {
        question: '[DEVELOPMENT SAMPLE] Write an SQL clause to filter aggregated groups having an average candidate score greater than 80.',
        questionType: 'SQL',
        options: [],
        correctAnswer: 'HAVING AVG(score) > 80',
        marks: 2,
        section: 'SQL & Python',
        skill: 'Group Aggregation',
        difficulty: 'Medium',
        explanation: 'HAVING filters aggregated groups after GROUP BY.',
      },
      {
        question: '[DEVELOPMENT SAMPLE] Which SQL JOIN type returns all records from the left table and matched records from the right table?',
        questionType: 'MCQ',
        options: [
          { id: 'A', text: 'INNER JOIN' },
          { id: 'B', text: 'LEFT JOIN' },
          { id: 'C', text: 'RIGHT JOIN' },
          { id: 'D', text: 'FULL OUTER JOIN' },
        ],
        correctAnswer: 'B',
        marks: 1,
        section: 'SQL & Python',
        skill: 'Database Joins',
        difficulty: 'Easy',
        explanation: 'LEFT JOIN returns all rows from the left table regardless of right table match.',
      },
      // Python & Coding
      {
        question: '[DEVELOPMENT SAMPLE] In Python Pandas, which method is used to remove duplicate rows from a DataFrame named `df`?',
        questionType: 'PYTHON',
        options: [
          { id: 'A', text: 'df.remove_duplicates()' },
          { id: 'B', text: 'df.drop_duplicates()' },
          { id: 'C', text: 'df.deduplicate()' },
          { id: 'D', text: 'df.clean_duplicates()' },
        ],
        correctAnswer: 'B',
        marks: 1,
        section: 'SQL & Python',
        skill: 'Pandas Data Cleaning',
        difficulty: 'Easy',
        explanation: 'df.drop_duplicates() drops duplicate rows in Pandas.',
      },
    ];

    const createdQuestionIds = [];

    for (const qData of sampleQuestions) {
      const questionDoc = await Question.create({
        organizationId: org._id,
        question: qData.question,
        questionType: qData.questionType,
        options: qData.options,
        correctAnswer: qData.correctAnswer,
        marks: qData.marks,
        section: qData.section,
        skill: qData.skill,
        difficulty: qData.difficulty as any,
        explanation: qData.explanation,
        tags: ['development_sample', qData.section.toLowerCase().replace(/ /g, '_')],
        currentVersion: 1,
        createdBy: orgAdmin._id,
      });

      await QuestionVersion.create({
        questionId: questionDoc._id,
        version: 1,
        question: questionDoc.question,
        questionType: questionDoc.questionType,
        options: questionDoc.options,
        correctAnswer: questionDoc.correctAnswer,
        marks: questionDoc.marks,
        section: questionDoc.section,
        skill: questionDoc.skill,
        difficulty: questionDoc.difficulty,
        explanation: questionDoc.explanation,
        createdBy: orgAdmin._id,
      });

      createdQuestionIds.push(questionDoc._id);
    }

    // 4. Create Sample Assessment: "Data Analyst Assessment - Round 1"
    const assessment = await Assessment.create({
      organizationId: org._id,
      name: '[DEVELOPMENT SAMPLE] Data Analyst Assessment - Round 1',
      description: 'Comprehensive hiring test covering Quant, Stats, Logic, Data Interpretation, Business Analytics, SQL, and Python.',
      jobRole: 'Data Analyst',
      duration: 60,
      passingScorePercentage: 60,
      attemptLimit: 1,
      navigationMode: 'FREE',
      questionRandomization: true,
      optionRandomization: true,
      sections: [
        { name: 'Quantitative Aptitude', questionCount: 3 },
        { name: 'Probability & Statistics', questionCount: 3 },
        { name: 'Data Interpretation', questionCount: 2 },
        { name: 'Logical Reasoning', questionCount: 2 },
        { name: 'Power BI & Excel', questionCount: 2 },
        { name: 'SQL & Python', questionCount: 3 },
      ],
      security: {
        webcamRequired: true,
        micRequired: false,
        identityVerification: true,
        fullscreenRequired: true,
      },
      state: 'PUBLISHED',
      version: 1,
      createdBy: orgAdmin._id,
    });

    // 5. Create Candidate Invitation & Candidate user
    const candidateUser = await User.create({
      name: 'Sample Candidate',
      email: 'candidate@example.com',
      password: 'password123',
      role: 'CANDIDATE',
      organizationId: org._id,
      jobRole: 'Data Analyst Applicant',
    });

    const sampleToken = 'demo-candidate-token-2026';
    const invitation = await Invitation.create({
      token: sampleToken,
      organizationId: org._id,
      assessmentId: assessment._id,
      candidateName: candidateUser.name,
      candidateEmail: candidateUser.email,
      jobRole: 'Data Analyst',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'PENDING',
      createdBy: orgAdmin._id,
    });

    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('🔑 ADMIN LOGIN:      admin@example.com / password123');
    console.log('🔑 INTERVIEWER LOGIN: interviewer@example.com / password123');
    console.log('🔑 CANDIDATE LINK:   /candidate/invite/' + sampleToken);
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};
