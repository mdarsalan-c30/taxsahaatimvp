import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CA_SESSION_COOKIE, readCASession } from "@/lib/auth/ca";
import { update } from "@/lib/db/store";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CA_SESSION_COOKIE)?.value;
    const session = readCASession(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId } = await req.json();

    if (!contactId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    // Update AI status to processed
    const updatedContact = await update("crmContacts", contactId, {
      aiStatus: "processed",
    });

    if (!updatedContact) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, contact: updatedContact });
  } catch (error) {
    console.error("[CA_AI_CHECK_API]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
