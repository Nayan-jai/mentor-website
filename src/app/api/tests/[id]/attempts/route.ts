import { NextRequest, NextResponse } from "next/server";
import { authOptions, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const testId = params.id;
    const body = await request.json();
    const {
      attemptType,
      timeSpent,
      totalQuestions,
      attemptedQuestions,
      correctAnswers,
      incorrectAnswers,
      unattemptedQuestions,
      totalMarks,
      maxMarks,
      percentage,
      grade,
      questionResponses,
      insights,
      recommendations
    } = body;

    // Verify test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { id: true, title: true }
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    // Create test attempt with question responses
    const attempt = await prisma.testAttempt.create({
      data: {
        testId,
        userId: session.user.id,
        attemptType: attemptType || "OMR",
        completedAt: new Date(),
        timeSpent,
        totalQuestions,
        attemptedQuestions,
        correctAnswers,
        incorrectAnswers,
        unattemptedQuestions,
        totalMarks,
        maxMarks,
        percentage,
        grade,
        isCompleted: true,
        insights: insights || null,
        recommendations: recommendations || null,
        questionResponses: {
          create: questionResponses.map((response: any) => ({
            questionId: response.questionId || `q${response.questionNumber}`,
            questionNumber: response.questionNumber,
            selectedOption: response.selectedOption,
            correctAnswer: response.correctAnswer,
            isCorrect: response.isCorrect,
            isAttempted: response.isAttempted,
            marks: response.marks,
            maxMarks: response.maxMarks || 2,
            confidence: response.confidence,
            timeSpent: response.timeSpent,
          }))
        }
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        questionResponses: {
          orderBy: {
            questionNumber: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      message: "Test attempt saved successfully",
      attempt: {
        id: attempt.id,
        testId: attempt.testId,
        test: attempt.test,
        attemptType: attempt.attemptType,
        completedAt: attempt.completedAt,
        timeSpent: attempt.timeSpent,
        totalQuestions: attempt.totalQuestions,
        attemptedQuestions: attempt.attemptedQuestions,
        correctAnswers: attempt.correctAnswers,
        incorrectAnswers: attempt.incorrectAnswers,
        totalMarks: attempt.totalMarks,
        maxMarks: attempt.maxMarks,
        percentage: attempt.percentage,
        grade: attempt.grade,
        questionResponses: attempt.questionResponses,
        insights: attempt.insights,
        recommendations: attempt.recommendations,
        createdAt: attempt.createdAt,
      }
    });

  } catch (error) {
    console.error("Error saving test attempt:", error);
    return NextResponse.json(
      { message: "Failed to save test attempt" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const testId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build where clause based on permissions
    let whereClause: any = { testId };
    
    if (userId === "me" || !userId) {
      // Get current user's attempts
      whereClause.userId = session.user.id;
    } else if (session.user.role === "ADMIN" || session.user.role === "MENTOR") {
      // Admins and mentors can see all attempts for their tests
      if (userId !== "all") {
        whereClause.userId = userId;
      }
    } else {
      // Students can only see their own attempts
      whereClause.userId = session.user.id;
    }

    const attempts = await prisma.testAttempt.findMany({
      where: whereClause,
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        questionResponses: {
          orderBy: {
            questionNumber: 'asc'
          },
          select: {
            questionNumber: true,
            selectedOption: true,
            correctAnswer: true,
            isCorrect: true,
            isAttempted: true,
            marks: true,
            maxMarks: true,
            confidence: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return NextResponse.json({ attempts });

  } catch (error) {
    console.error("Error fetching test attempts:", error);
    return NextResponse.json(
      { message: "Failed to fetch test attempts" },
      { status: 500 }
    );
  }
}