import { NextRequest, NextResponse } from "next/server";
import { authOptions, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const test = await prisma.test.findUnique({
      where: {
        id: params.id,
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

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    // Check access permissions
    if (!test.isPublic && test.createdById !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
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
    console.error("Error fetching test:", error);
    return NextResponse.json(
      { message: "Failed to fetch test" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      select: { createdById: true },
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    // Check if user can edit this test
    if (test.createdById !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You can only edit your own tests" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, duration, questions, isPublic } = body;

    // Calculate total marks
    const totalMarks = questions?.length ? questions.length * 2 : undefined;

    // Update test
    const updatedTest = await prisma.test.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(duration && { duration }),
        ...(totalMarks && { totalMarks }),
        ...(isPublic !== undefined && { isPublic }),
        ...(questions && {
          questions: {
            deleteMany: {}, // Delete all existing questions
            create: questions.map((question: any, index: number) => ({
              questionNumber: index + 1,
              type: question.type,
              subject: question.subject,
              difficulty: question.difficulty,
              marks: 2,
              timeLimit: question.timeLimit || 2,
              question: question.question || null,
              prompt: question.prompt || null,
              explanation: question.explanation || null,
              options: question.options || [],
              statements: question.statements || null,
              pairs: question.pairs || null,
            })),
          },
        }),
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
      message: "Test updated successfully",
      test: updatedTest,
    });
  } catch (error) {
    console.error("Error updating test:", error);
    return NextResponse.json(
      { message: "Failed to update test" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      select: { createdById: true, title: true },
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    // Check if user can delete this test
    if (test.createdById !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You can only delete your own tests" },
        { status: 403 }
      );
    }

    await prisma.test.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: `Test "${test.title}" deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting test:", error);
    return NextResponse.json(
      { message: "Failed to delete test" },
      { status: 500 }
    );
  }
}