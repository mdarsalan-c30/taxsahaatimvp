import { NextRequest, NextResponse } from "next/server";
import { createApplication } from "@/lib/admin/partners";
import { hashPassword } from "@/lib/admin/auth";

/** Public CA-firm application intake; lands in the verification queue as pending. */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      firmName?: string;
      applicantName?: string;
      icaiNo?: string;
      email?: string;
      password?: string;
      city?: string;
    };
    if (!body.firmName?.trim()) {
      return NextResponse.json(
        { error: "Firm name is required" },
        { status: 400 }
      );
    }
    const tenant = await createApplication({
      firmName: body.firmName.trim(),
      applicantName: body.applicantName?.trim(),
      icaiNo: body.icaiNo?.trim(),
      email: body.email?.trim().toLowerCase(),
      passwordHash: body.password ? hashPassword(body.password) : undefined,
      city: body.city?.trim(),
    });
    return NextResponse.json({ ok: true, id: tenant.id });
  } catch {
    return NextResponse.json(
      { error: "Application failed" },
      { status: 500 }
    );
  }
}
