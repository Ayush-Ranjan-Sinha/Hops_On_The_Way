import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

export async function GET(req: NextRequest) {
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
  const db = await getDb();
  const user = await db.collection("users").findOne({ email: payload.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ trips: user.trips || [] });
} 