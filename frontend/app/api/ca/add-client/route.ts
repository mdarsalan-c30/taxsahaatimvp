import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CA_SESSION_COOKIE, readCASession } from "@/lib/auth/ca";
import { insert, genId } from "@/lib/db/store";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CA_SESSION_COOKIE)?.value;
    const session = readCASession(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, customFeeCharged } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const newContact = await insert("crmContacts", {
      id: genId("crm"),
      tenantId: session.tenantId,
      email: email,
      lane: "b2b",
      stage: "started", // "started" implies they are pending AI review/filing
      aiStatus: "pending",
      customFeeCharged: Number(customFeeCharged) || 0,
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, contact: newContact });
  } catch (error) {
    console.error("[CA_ADD_CLIENT_API]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
