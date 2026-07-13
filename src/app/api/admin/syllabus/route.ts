import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SYLLABI_FILE_PATH = path.join(process.cwd(), "public", "tracker", "premade-syllabi.json");

export async function GET(request: NextRequest) {
  try {
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
    
    // Write formatted JSON to public/tracker/premade-syllabi.json
    fs.writeFileSync(SYLLABI_FILE_PATH, JSON.stringify(body, null, 2), "utf8");
    return NextResponse.json({ message: "Syllabi updated successfully" });
  } catch (error) {
    console.error("Failed to update syllabus templates:", error);
    return NextResponse.json({ message: "Failed to update syllabus templates" }, { status: 500 });
  }
}
