import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.replace("Bearer ", "");
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as { email: string; id: string };
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  const { trip } = await req.json();
  if (!trip) {
    return NextResponse.json({ error: "Trip data required" }, { status: 400 });
  }
  const db = await getDb();
  await db.collection("users").updateOne(
    { email: payload.email },
    { $push: { trips: trip } }
  );
  return NextResponse.json({ success: true });
} 