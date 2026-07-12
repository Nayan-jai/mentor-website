import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

/**
 * Uploads a file.
 * Locally: writes to public/uploads/
 * Production (Vercel): uploads to Vercel Blob (if BLOB_READ_WRITE_TOKEN is set)
 */
export async function uploadFile(file: File, filename: string): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  // Make filename unique and safe
  const timestamp = Date.now();
  const cleanFilename = `${timestamp}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

  if (token) {
    // Production / Vercel Blob
    const response = await put(cleanFilename, file.stream(), {
      access: "public",
      token,
    });
    return response.url;
  } else if (process.env.NODE_ENV === "production") {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set. Add a Vercel Blob store to your project.");
  } else {
    // Local development fallback
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, cleanFilename);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/${cleanFilename}`;
  }
}

/**
 * Deletes a file from storage.
 * Locally: deletes from public/uploads/
 * Production (Vercel): deletes from Vercel Blob (if BLOB_READ_WRITE_TOKEN is set)
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token && fileUrl.startsWith("http")) {
    const { del } = await import("@vercel/blob");
    await del(fileUrl, { token });
  } else if (fileUrl.startsWith("/uploads/")) {
    const filename = fileUrl.replace("/uploads/", "");
    const filePath = path.join(process.cwd(), "public", "uploads", filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
