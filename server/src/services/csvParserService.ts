import * as XLSX from 'xlsx';
import { QUESTION_TYPES, SECTIONS, DIFFICULTIES } from '../config/constants';

export interface IValidatedRow {
  rowNumber: number;
  data: {
    question: string;
    question_type: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    marks: number;
    section: string;
    skill: string;
    difficulty: string;
    explanation?: string;
  };
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isDuplicate?: boolean;
}

export interface IValidationReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  validatedRows: IValidatedRow[];
  errorReportCsv: string;
}

export const parseAndValidateQuestionFile = (fileBuffer: Buffer): IValidationReport => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const validatedRows: IValidatedRow[] = [];
  const seenQuestions = new Set<string>();

  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // Accounting for 1-based header row
    const errors: string[] = [];
    const warnings: string[] = [];

    // Normalize keys to lowercase trimmed strings
    const normalized: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      normalized[key.trim().toLowerCase().replace(/ /g, '_')] = String(row[key]).trim();
    });

    const questionText = normalized['question'] || '';
    const questionType = (normalized['question_type'] || 'MCQ').toUpperCase();
    const optionA = normalized['option_a'] || '';
    const optionB = normalized['option_b'] || '';
    const optionC = normalized['option_c'] || '';
    const optionD = normalized['option_d'] || '';
    const correctAnswer = (normalized['correct_answer'] || '').toUpperCase();
    const marksRaw = normalized['marks'];
    const marks = parseInt(marksRaw, 10) || 1;
    const section = normalized['section'] || 'General Aptitude';
    const skill = normalized['skill'] || 'General';
    const difficultyRaw = normalized['difficulty'] || 'Medium';
    const explanation = normalized['explanation'] || '';

    // Validate Required Fields
    if (!questionText) {
      errors.push('Question text is required.');
    }

    // Duplicate Check
    const normalizedQText = questionText.toLowerCase().replace(/\s+/g, ' ');
    let isDuplicate = false;
    if (seenQuestions.has(normalizedQText) && questionText) {
      isDuplicate = true;
      duplicateCount++;
      warnings.push('Duplicate question detected in uploaded batch.');
    } else if (questionText) {
      seenQuestions.add(normalizedQText);
    }

    // Validate Question Type
    if (!QUESTION_TYPES.includes(questionType as any)) {
      errors.push(`Invalid question type '${questionType}'. Supported: ${QUESTION_TYPES.join(', ')}.`);
    }

    // Validate Options for MCQ / Multiple Choice
    if (['MCQ', 'MULTIPLE_CHOICE'].includes(questionType)) {
      if (!optionA || !optionB) {
        errors.push('MCQ questions require at least Option A and Option B.');
      }
      if (!correctAnswer) {
        errors.push('Correct answer choice (e.g. A, B, C, D) is required for MCQ.');
      } else {
        const validChoices = ['A', 'B', 'C', 'D', 'OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D'];
        if (!validChoices.includes(correctAnswer)) {
          errors.push(`Invalid correct_answer '${correctAnswer}'. Expected A, B, C, or D.`);
        }
      }
    }

    // Validate Marks
    if (isNaN(marks) || marks <= 0) {
      errors.push('Marks must be a positive integer >= 1.');
    }

    // Format & Validate Difficulty (ADMIN-ONLY internal field)
    let difficulty = 'Medium';
    const matchedDiff = DIFFICULTIES.find((d) => d.toLowerCase() === difficultyRaw.toLowerCase());
    if (matchedDiff) {
      difficulty = matchedDiff;
    } else {
      warnings.push(`Unrecognized difficulty '${difficultyRaw}'. Defaulted to 'Medium'.`);
    }

    const isValid = errors.length === 0;
    if (isValid) validCount++;
    else invalidCount++;

    validatedRows.push({
      rowNumber: rowNum,
      data: {
        question: questionText,
        question_type: questionType,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_answer: correctAnswer,
        marks,
        section,
        skill,
        difficulty,
        explanation,
      },
      isValid,
      errors,
      warnings,
      isDuplicate,
    });
  });

  // Generate CSV Error Report string
  let errorCsv = 'Row,Question,Status,Errors,Warnings\n';
  validatedRows.forEach((r) => {
    if (!r.isValid || r.warnings.length > 0) {
      const qEscaped = `"${r.data.question.replace(/"/g, '""')}"`;
      const errEscaped = `"${r.errors.join(' | ').replace(/"/g, '""')}"`;
      const warnEscaped = `"${r.warnings.join(' | ').replace(/"/g, '""')}"`;
      errorCsv += `${r.rowNumber},${qEscaped},${r.isValid ? 'WARNING' : 'INVALID'},${errEscaped},${warnEscaped}\n`;
    }
  });

  return {
    totalRows: rawRows.length,
    validRows: validCount,
    invalidRows: invalidCount,
    duplicateRows: duplicateCount,
    validatedRows,
    errorReportCsv: errorCsv,
  };
};
