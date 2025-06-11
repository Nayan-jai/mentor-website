import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { Prisma } from "@prisma/client";

// Define the request body type
type LoginRequest = {
  email: string;
  password: string;
};

// Define the response type
type LoginResponse = {
  message: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
};

export const POST = async (
  request: NextRequest
): Promise<NextResponse<LoginResponse>> => {
  try {
    const body = await request.json();
    const { email, password } = body as LoginRequest;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: "Login successful",
        user: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Failed to login" },
      { status: 500 }
    );
  }
}; 