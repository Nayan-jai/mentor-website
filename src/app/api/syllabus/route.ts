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
