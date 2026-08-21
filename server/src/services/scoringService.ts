import Answer, { IAnswer } from '../models/Answer';
import QuestionVersion from '../models/QuestionVersion';
import AssessmentAttempt, { IAssessmentAttempt, ISectionScore } from '../models/AssessmentAttempt';

export const evaluateAttemptAnswers = async (
  attempt: IAssessmentAttempt
): Promise<{
  totalScore: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  sectionScores: ISectionScore[];
}> => {
  const answers = await Answer.find({ attemptId: attempt._id });
  const answerMap = new Map<string, IAnswer>();
  answers.forEach((ans) => {
    answerMap.set(ans.questionId.toString(), ans);
  });

  let totalScore = 0;
  let maxScore = 0;
  let correctCountTotal = 0;
  let totalAnsweredCount = 0;

  const sectionMap = new Map<
    string,
    { score: number; maxScore: number; correct: number; incorrect: number; unanswered: number }
  >();

  // Iterate over each frozen question in candidate attempt
  for (const fq of attempt.frozenQuestions) {
    const qIdStr = fq.questionId.toString();
    const qMarks = fq.marks || 1;
    maxScore += qMarks;

    if (!sectionMap.has(fq.section)) {
      sectionMap.set(fq.section, { score: 0, maxScore: 0, correct: 0, incorrect: 0, unanswered: 0 });
    }
    const secStats = sectionMap.get(fq.section)!;
    secStats.maxScore += qMarks;

    // Retrieve full original question version containing correctAnswer (ADMIN-ONLY)
    const qVersionDoc = await QuestionVersion.findOne({
      questionId: fq.questionId,
      version: fq.questionVersion,
    });

    const candidateAnswerDoc = answerMap.get(qIdStr);
    const candidateAnswer = candidateAnswerDoc ? candidateAnswerDoc.answer : null;

    let isCorrect = false;
    let awardedMarks = 0;

    if (candidateAnswer === null || candidateAnswer === undefined || candidateAnswer === '') {
      // Unanswered -> 0 points (No penalty!)
      secStats.unanswered++;
    } else {
      totalAnsweredCount++;
      const actualCorrect: any = qVersionDoc ? qVersionDoc.correctAnswer : null;

      if (['MCQ', 'MULTIPLE_CHOICE'].includes(fq.questionType)) {
        if (typeof candidateAnswer === 'string' && typeof actualCorrect === 'string') {
          // Compare A, B, C, D choice IDs
          isCorrect = candidateAnswer.trim().toUpperCase() === actualCorrect.trim().toUpperCase();
        } else if (Array.isArray(candidateAnswer) && Array.isArray(actualCorrect)) {
          isCorrect =
            candidateAnswer.length === actualCorrect.length &&
            candidateAnswer.every((val) => actualCorrect.includes(val));
        }
      } else if (['NUMERICAL', 'SHORT_ANSWER'].includes(fq.questionType)) {
        if (candidateAnswer !== null && actualCorrect !== null) {
          isCorrect =
            String(candidateAnswer).trim().toLowerCase() === String(actualCorrect).trim().toLowerCase();
        }
      } else {
        // SQL / Python / Code / Analytical / Case Study
        // For text-based or code questions, string match or non-empty evaluation
        if (candidateAnswer !== null && String(candidateAnswer).trim().length > 0) {
          if (actualCorrect && String(actualCorrect).trim().length > 0) {
            isCorrect = String(candidateAnswer).trim() === String(actualCorrect).trim();
          } else {
            // Default credit for submitted custom solution
            isCorrect = true;
          }
        }
      }

      if (isCorrect) {
        awardedMarks = qMarks; // NO NEGATIVE MARKING EVER!
        secStats.correct++;
        secStats.score += awardedMarks;
        totalScore += awardedMarks;
        correctCountTotal++;
      } else {
        awardedMarks = 0; // Incorrect = 0! (NO NEGATIVE PENALTY)
        secStats.incorrect++;
      }

      // Update or create answer record with correctness & awarded score
      if (candidateAnswerDoc) {
        candidateAnswerDoc.isCorrect = isCorrect;
        candidateAnswerDoc.score = awardedMarks;
        await candidateAnswerDoc.save();
      }
    }
  }

  const percentage = maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(2)) : 0;
  const accuracy =
    totalAnsweredCount > 0 ? Number(((correctCountTotal / totalAnsweredCount) * 100).toFixed(2)) : 0;

  const sectionScoresList: ISectionScore[] = Array.from(sectionMap.entries()).map(([secName, stats]) => ({
    section: secName,
    score: stats.score,
    maxScore: stats.maxScore,
    correctCount: stats.correct,
    incorrectCount: stats.incorrect,
    unansweredCount: stats.unanswered,
  }));

  // Update attempt status and scoring breakdown
  attempt.score = totalScore;
  attempt.maxScore = maxScore;
  attempt.percentage = percentage;
  attempt.accuracy = accuracy;
  attempt.sectionScores = sectionScoresList;

  return {
    totalScore,
    maxScore,
    percentage,
    accuracy,
    sectionScores: sectionScoresList,
  };
};
