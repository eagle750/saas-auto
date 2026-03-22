import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING",
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? "SET" : "MISSING",
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? "SET" : "MISSING",
    AUTH_SECRET: process.env.AUTH_SECRET ? "SET" : "MISSING",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "MISSING",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "SET" : "MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
  });
}
