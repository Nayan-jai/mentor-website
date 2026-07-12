import { NextRequest, NextResponse } from "next/server";
import { authOptions, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get("createdBy");
    const includePublic = searchParams.get("includePublic") === "true";

    let whereClause: any = {};

    if (createdBy === "me") {
      // Get tests created by current user
      whereClause.createdById = session.user.id;
    } else if (includePublic) {
      // Get all public tests
      whereClause.isPublic = true;
    } else {
      // Get all tests (admin/mentor access) or user's own tests
      if (session.user.role === "STUDENT") {
        whereClause = {
          OR: [
            { createdById: session.user.id },
            { isPublic: true }
          ]
        };
      }
      // Mentors and admins can see all tests
    }

    const tests = await prisma.test.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        questions: {
          select: {
            id: true,
            questionNumber: true,
            type: true,
            subject: true,
            difficulty: true,
            marks: true,
          },
          orderBy: {
            questionNumber: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the frontend format
    const formattedTests = tests.map(test => ({
      id: test.id,
      title: test.title,
      description: test.description,
      duration: test.duration,
      totalMarks: test.totalMarks,
      isPublic: test.isPublic,
      createdAt: test.createdAt,
      createdBy: test.createdBy,
      questions: test.questions,
      questionCount: test.questions.length,
    }));

    return NextResponse.json({ tests: formattedTests });
  } catch (error) {
    console.error("Error fetching tests:", error);
    return NextResponse.json(
      { message: "Failed to fetch tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only mentors and admins can create tests
    if (!["MENTOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { message: "Only mentors and admins can create tests" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, duration, questions, isPublic = true } = body;

    if (!title || !description || !duration || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { message: "Missing required fields: title, description, duration, questions" },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { message: "Test must have at least one question" },
        { status: 400 }
      );
    }

    // Calculate total marks
    const totalMarks = questions.length * 2; // Each question is worth 2 marks

    // Create the test with questions
    const test = await prisma.test.create({
      data: {
        title,
        description,
        duration,
        totalMarks,
        isPublic,
        createdById: session.user.id,
        questions: {
          create: questions.map((question: any, index: number) => ({
            questionNumber: index + 1,
            type: question.type,
            subject: question.subject,
            difficulty: question.difficulty,
            marks: 2, // Fixed 2 marks per question
            timeLimit: question.timeLimit || 2,
            question: question.question || null,
            prompt: question.prompt || null,
            explanation: question.explanation || null,
            options: question.options || [],
            statements: question.statements || null,
            pairs: question.pairs || null,
          })),
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        questions: {
          orderBy: {
            questionNumber: 'asc',
          },
        },
      },
    });

    return NextResponse.json({
      message: "Test created successfully",
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        isPublic: test.isPublic,
        createdAt: test.createdAt,
        createdBy: test.createdBy,
        questions: test.questions,
      },
    });
  } catch (error) {
    console.error("Error creating test:", error);
    return NextResponse.json(
      { message: "Failed to create test" },
      { status: 500 }
    );
  }
}