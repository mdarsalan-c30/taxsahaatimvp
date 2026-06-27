import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CA_SESSION_COOKIE, readCASession } from "@/lib/auth/ca";
import { update, all } from "@/lib/db/store";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CA_SESSION_COOKIE)?.value;
    const session = readCASession(token);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized CA Partner" }, { status: 401 });
    }

    const body = await req.json();
    const { contactId, simulationMode = "success" } = body;

    if (!contactId) {
      return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
    }

    // 1. Verify Tenant Credits
    const tenants = await all("tenants");
    const tenantIndex = tenants.findIndex((t) => t.id === session.tenantId);
    if (tenantIndex === -1) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenant = tenants[tenantIndex];
    if ((tenant.creditsAvailable || 0) < 1) {
      return NextResponse.json({ error: "Insufficient credits. Please purchase a B2B bulk package." }, { status: 402 });
    }

    // 2. Deduct Credit (Pessimistic lock equivalent for MVP)
    const newCredits = (tenant.creditsAvailable || 0) - 1;
    await update("tenants", tenant.id, { creditsAvailable: newCredits });

    // 3. Simulate API Call to ITR Dept / External Engine
    // In production, this would be an external API call that might fail.
    const isErrorSimulation = simulationMode === "error";

    if (isErrorSimulation) {
      // 4. ROLLBACK logic if the external API fails (e.g. Validation Error from IT Dept)
      await update("tenants", tenant.id, { creditsAvailable: newCredits + 1 });
      
      return NextResponse.json({ 
        error: "ITR Filing Failed (Validation Error). Credit has been fully refunded.",
        rolledBack: true,
        creditsAvailable: newCredits + 1
      }, { status: 500 });
    }

    // 5. Success Path: Update CRM Contact to 'won' (Completed)
    await update("crmContacts", contactId, { stage: "won" });

    return NextResponse.json({ 
      success: true, 
      message: "Filing successful. 1 Credit deducted.",
      creditsAvailable: newCredits 
    });

  } catch (error) {
    console.error("[CA_FILE_RETURN_API]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
