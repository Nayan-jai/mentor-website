import { OMRAnswer, OMRProcessingResult } from './omr-processor';

export interface QuestionAnalysis {
  questionNumber: number;
  studentAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  isAttempted: boolean;
  marks: number;
  maxMarks: number;
  confidence?: number;
}

export interface TestResult {
  totalQuestions: number;
  attemptedQuestions: number;
  unattemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  questionAnalysis: QuestionAnalysis[];
  subjectWiseAnalysis: SubjectAnalysis[];
  timeSpent?: number;
}

export interface SubjectAnalysis {
  subject: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  marks: number;
  maxMarks: number;
}

export interface TestQuestion {
  id: string;
  type: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  question?: string;
  prompt?: string;
}

/**
 * Analyze OMR results against correct answers
 */
export class ResultAnalyzer {
  /**
   * Analyze test results from OMR processing
   */
  static analyzeResults(
    omrResult: OMRProcessingResult,
    testQuestions: TestQuestion[]
  ): TestResult {
    const questionAnalysis: QuestionAnalysis[] = [];
    const subjectMap = new Map<string, SubjectAnalysis>();
    
    let totalMarks = 0;
    let maxMarks = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;

    // Process each question
    testQuestions.forEach((question, index) => {
      const omrAnswer = omrResult.answers[index];
      const correctOption = question.options.find(opt => opt.isCorrect);
      const correctAnswer = correctOption?.id || 'a';
      
      const isAttempted = omrAnswer?.selectedOption !== null;
      const isCorrect = isAttempted && omrAnswer?.selectedOption === correctAnswer;
      
      // Standard marking scheme: +2 for correct, -2/3 for incorrect, 0 for unattempted
      let marks = 0;
      if (isAttempted) {
        if (isCorrect) {
          marks = 2; // 2 marks for correct answer
        } else {
          marks = -2/3; // -0.67 marks for incorrect answer (negative marking)
        }
      }
      // 0 marks for unattempted
      
      if (isAttempted) {
        if (isCorrect) {
          correctAnswers++;
        } else {
          incorrectAnswers++;
        }
      }
      
      totalMarks += marks;
      maxMarks += 2; // Each question carries 2 marks
      
      // Add to question analysis
      questionAnalysis.push({
        questionNumber: index + 1,
        studentAnswer: omrAnswer?.selectedOption || null,
        correctAnswer,
        isCorrect,
        isAttempted,
        marks: Number(marks.toFixed(2)), // Round to 2 decimal places for display
        maxMarks: 2, // Each question is worth 2 marks
        confidence: omrAnswer?.confidence,
      });
      
      // Update subject-wise analysis
      this.updateSubjectAnalysis(subjectMap, question, isAttempted, isCorrect, marks, 2);
    });

    const subjectWiseAnalysis = Array.from(subjectMap.values());
    // Calculate percentage: (actual marks / max possible marks) * 100
    // Handle negative scores by ensuring minimum 0%
    const percentage = maxMarks > 0 ? Math.max(0, (totalMarks / maxMarks) * 100) : 0;

    return {
      totalQuestions: testQuestions.length,
      attemptedQuestions: omrResult.attemptedQuestions,
      unattemptedQuestions: testQuestions.length - omrResult.attemptedQuestions,
      correctAnswers,
      incorrectAnswers,
      totalMarks,
      maxMarks,
      percentage,
      grade: this.calculateGrade(percentage),
      questionAnalysis,
      subjectWiseAnalysis,
    };
  }

  /**
   * Update subject-wise analysis
   */
  private static updateSubjectAnalysis(
    subjectMap: Map<string, SubjectAnalysis>,
    question: TestQuestion,
    isAttempted: boolean,
    isCorrect: boolean,
    marks: number,
    maxMarksPerQuestion: number = 2
  ) {
    const subject = question.subject;
    
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, {
        subject,
        totalQuestions: 0,
        attemptedQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        percentage: 0,
        marks: 0,
        maxMarks: 0,
      });
    }

    const analysis = subjectMap.get(subject)!;
    analysis.totalQuestions++;
    analysis.maxMarks += maxMarksPerQuestion; // Each question is worth 2 marks

    if (isAttempted) {
      analysis.attemptedQuestions++;
      if (isCorrect) {
        analysis.correctAnswers++;
        analysis.marks += marks; // +2 for correct
      } else {
        analysis.incorrectAnswers++;
        analysis.marks += marks; // -0.67 for incorrect
      }
    }

    analysis.percentage = analysis.maxMarks > 0 ? (analysis.marks / analysis.maxMarks) * 100 : 0;
  }

  /**
   * Calculate grade based on percentage
   */
  private static calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 30) return 'D';
    return 'F';
  }

  /**
   * Generate detailed performance insights
   */
  static generateInsights(result: TestResult): string[] {
    const insights: string[] = [];

    // Overall performance
    if (result.percentage >= 80) {
      insights.push("🎉 Excellent performance! You've scored above 80%.");
    } else if (result.percentage >= 60) {
      insights.push("👍 Good performance! You're on the right track.");
    } else if (result.percentage >= 40) {
      insights.push("📚 Fair performance. Focus on improving weak areas.");
    } else {
      insights.push("⚠️ Need improvement. Consider more practice and revision.");
    }

    // Attempt rate analysis
    const attemptRate = (result.attemptedQuestions / result.totalQuestions) * 100;
    if (attemptRate < 70) {
      insights.push(`📝 Low attempt rate (${attemptRate.toFixed(1)}%). Try to attempt more questions.`);
    } else if (attemptRate > 90) {
      insights.push(`✅ High attempt rate (${attemptRate.toFixed(1)}%). Great confidence!`);
    }

    // Accuracy analysis
    const accuracy = result.attemptedQuestions > 0 
      ? (result.correctAnswers / result.attemptedQuestions) * 100 
      : 0;
    
    if (accuracy < 50) {
      insights.push(`🎯 Low accuracy (${accuracy.toFixed(1)}%). With negative marking (-0.67), focus on quality over quantity.`);
    } else if (accuracy > 80) {
      insights.push(`🎯 High accuracy (${accuracy.toFixed(1)}%). Excellent precision! Your strategy is working well.`);
    }
    
    // Negative marking impact analysis
    const negativeMarks = result.incorrectAnswers * 0.67;
    const positiveMarks = result.correctAnswers * 2;
    if (negativeMarks > positiveMarks * 0.3) {
      insights.push(`⚠️ Negative marking impact is significant (-${negativeMarks.toFixed(2)} marks). Consider attempting fewer questions with higher confidence.`);
    }

    // Subject-wise insights
    const weakSubjects = result.subjectWiseAnalysis
      .filter(subject => subject.percentage < 50)
      .map(subject => subject.subject);
    
    if (weakSubjects.length > 0) {
      insights.push(`📖 Focus on: ${weakSubjects.join(', ')} - these subjects need more attention.`);
    }

    const strongSubjects = result.subjectWiseAnalysis
      .filter(subject => subject.percentage > 80)
      .map(subject => subject.subject);
    
    if (strongSubjects.length > 0) {
      insights.push(`💪 Strong areas: ${strongSubjects.join(', ')} - keep up the good work!`);
    }

    return insights;
  }

  /**
   * Generate study recommendations based on results
   */
  static generateRecommendations(result: TestResult): string[] {
    const recommendations: string[] = [];

    // Overall recommendations
    if (result.percentage < 60) {
      recommendations.push("📚 Increase daily study time and focus on fundamentals");
      recommendations.push("🎯 Practice more questions from weak areas");
      recommendations.push("👨‍🏫 Consider getting guidance from mentors");
    }

    // Subject-specific recommendations
    result.subjectWiseAnalysis.forEach(subject => {
      if (subject.percentage < 40) {
        recommendations.push(`📖 ${subject.subject}: Start with basic concepts and gradually move to advanced topics`);
      } else if (subject.percentage < 60) {
        recommendations.push(`📝 ${subject.subject}: Practice more questions and review mistakes`);
      }
    });

    // Attempt rate recommendations
    const attemptRate = (result.attemptedQuestions / result.totalQuestions) * 100;
    if (attemptRate < 80) {
      recommendations.push("⏱️ Work on time management to attempt more questions");
      recommendations.push("🚀 Build confidence through regular practice tests");
    }

    // Accuracy recommendations
    const accuracy = result.attemptedQuestions > 0 
      ? (result.correctAnswers / result.attemptedQuestions) * 100 
      : 0;
    
    if (accuracy < 60) {
      recommendations.push("🧠 Focus on conceptual understanding rather than memorization");
      recommendations.push("🔍 Analyze incorrect answers to identify knowledge gaps");
      recommendations.push("⚠️ With negative marking, attempt questions only when 70%+ confident");
    }
    
    // Negative marking specific recommendations
    const negativeImpact = (result.incorrectAnswers * 0.67) / Math.max(1, result.correctAnswers * 2) * 100;
    if (negativeImpact > 25) {
      recommendations.push(`📊 Negative marking cost you ${(result.incorrectAnswers * 0.67).toFixed(2)} marks. Be more selective in attempting questions`);
      recommendations.push("🎯 Practice elimination techniques to improve accuracy before attempting");
    }

    return recommendations;
  }

  /**
   * Export results to various formats
   */
  static exportResults(result: TestResult, format: 'json' | 'csv' | 'pdf' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(result, null, 2);
      
      case 'csv':
        return this.generateCSVReport(result);
      
      default:
        return JSON.stringify(result, null, 2);
    }
  }

  /**
   * Generate CSV report
   */
  private static generateCSVReport(result: TestResult): string {
    const headers = [
      'Question No',
      'Student Answer',
      'Correct Answer',
      'Status',
      'Marks',
      'Max Marks'
    ];

    const rows = result.questionAnalysis.map(q => [
      q.questionNumber,
      q.studentAnswer || 'Not Attempted',
      q.correctAnswer.toUpperCase(),
      q.isCorrect ? 'Correct' : q.isAttempted ? 'Incorrect' : 'Not Attempted',
      q.marks,
      q.maxMarks
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '', // Empty line
      `Total Score,${result.totalMarks}/${result.maxMarks}`,
      `Percentage,${result.percentage.toFixed(2)}%`,
      `Grade,${result.grade}`
    ].join('\n');

    return csvContent;
  }
}