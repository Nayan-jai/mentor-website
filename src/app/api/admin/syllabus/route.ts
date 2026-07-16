import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const SYLLABI_FILE_PATH = path.join(process.cwd(), "public", "tracker", "premade-syllabi.json");
const SYSTEM_EMAIL = "system-syllabus-templates@platform.local";

export async function GET(request: NextRequest) {
  try {
    // Try to get from database first
    const systemUser = await prisma.user.findUnique({
      where: { email: SYSTEM_EMAIL },
      select: { studyTracker: true }
    });

    if (systemUser?.studyTracker) {
      return NextResponse.json(systemUser.studyTracker);
    }

    // Fallback to static JSON file
    if (!fs.existsSync(SYLLABI_FILE_PATH)) {
      return NextResponse.json({});
    }
    const data = fs.readFileSync(SYLLABI_FILE_PATH, "utf8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Failed to read syllabus templates:", error);
    return NextResponse.json({ message: "Failed to read syllabus templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }
    
    // Save to database under a special system user
    await prisma.user.upsert({
      where: { email: SYSTEM_EMAIL },
      update: { studyTracker: body },
      create: {
        email: SYSTEM_EMAIL,
        name: "System Syllabus Templates",
        password: "system-generated-password-never-login-direct-123", // Dummy password
        role: "ADMIN",
        studyTracker: body
      }
    });

    // Also write to disk if locally running (ignored on serverless Vercel)
    try {
      fs.writeFileSync(SYLLABI_FILE_PATH, JSON.stringify(body, null, 2), "utf8");
    } catch (fsErr) {
      console.warn("Could not write to local filesystem (expected on Vercel):", fsErr);
    }

    return NextResponse.json({ message: "Syllabi updated successfully" });
  } catch (error) {
    console.error("Failed to update syllabus templates:", error);
    return NextResponse.json({ message: "Failed to update syllabus templates" }, { status: 500 });
  }
}
