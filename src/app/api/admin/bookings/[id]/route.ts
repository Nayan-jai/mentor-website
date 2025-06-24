import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.booking.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Booking cancelled" });
} 