import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { parseAndValidateQuestionFile } from '../services/csvParserService';
import Question from '../models/Question';
import QuestionVersion from '../models/QuestionVersion';
import AuditLog from '../models/AuditLog';

export const validateQuestionUpload = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV or Excel file uploaded.' });
    }

    const report = parseAndValidateQuestionFile(req.file.buffer);

    return res.json({
      filename: req.file.originalname,
      report,
    });
  } catch (error: any) {
    console.error('File validation error:', error);
    return res.status(500).json({ error: 'Failed to parse and validate upload file.' });
  }
};

export const confirmQuestionImport = async (req: AuthRequest, res: Response) => {
  try {
    const { rowsToImport } = req.body; // Array of validated row objects
    const orgId = req.user?.organizationId;

    if (!Array.isArray(rowsToImport) || rowsToImport.length === 0) {
      return res.status(400).json({ error: 'No valid rows provided for import.' });
    }

    const createdQuestions = [];

    for (const row of rowsToImport) {
      const options = [];
      if (row.option_a) options.push({ id: 'A', text: row.option_a });
      if (row.option_b) options.push({ id: 'B', text: row.option_b });
      if (row.option_c) options.push({ id: 'C', text: row.option_c });
      if (row.option_d) options.push({ id: 'D', text: row.option_d });

      const newQ = await Question.create({
        organizationId: orgId,
        question: row.question,
        questionType: row.question_type || 'MCQ',
        options,
        correctAnswer: row.correct_answer || 'A',
        marks: Math.max(1, parseInt(row.marks, 10) || 1),
        section: row.section || 'General',
        skill: row.skill || 'General',
        difficulty: row.difficulty || 'Medium',
        explanation: row.explanation || '',
        tags: ['excel_import'],
        currentVersion: 1,
        createdBy: req.user?.id,
      });

      await QuestionVersion.create({
        questionId: newQ._id,
        version: 1,
        question: newQ.question,
        questionType: newQ.questionType,
        options: newQ.options,
        correctAnswer: newQ.correctAnswer,
        marks: newQ.marks,
        section: newQ.section,
        skill: newQ.skill,
        difficulty: newQ.difficulty,
        explanation: newQ.explanation,
        createdBy: req.user?.id,
      });

      createdQuestions.push(newQ);
    }

    await AuditLog.create({
      organizationId: orgId,
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      action: 'BULK_QUESTION_IMPORT',
      entity: 'QuestionBank',
      details: { importedCount: createdQuestions.length },
    });

    return res.status(201).json({
      message: `Successfully imported ${createdQuestions.length} questions into Question Bank.`,
      importedCount: createdQuestions.length,
    });
  } catch (error: any) {
    console.error('Import confirmation error:', error);
    return res.status(500).json({ error: 'Failed to import validated questions.' });
  }
};
