const fs = require('fs');
const crypto = require('crypto');
const path = './data/admin-store.json';

let store = { tenants: [], crmContacts: [] };
try {
  store = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch (e) {}

const hasDemoPartner = store.tenants.some(t => t.email === "partner@taxsaathi.com");
if (!hasDemoPartner) {
  const passwordHash = crypto.createHash("sha256").update("Partner2026").digest("hex");
  store.tenants.push({
    id: "tnt_demo123",
    email: "partner@taxsaathi.com",
    passwordHash: passwordHash,
    firmName: "TaxSaathi Demo Partner",
    status: "verified",
    walletBalance: 0,
    creditsAvailable: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  store.crmContacts = store.crmContacts || [];
  store.crmContacts.push({
    id: "crm_demo123",
    tenantId: "tnt_demo123",
    email: "completed.client@example.com",
    lane: "b2c",
    stage: "won",
    customFeeCharged: 1500,
    paymentStatus: "paid",
    createdAt: new Date().toISOString(),
  });
  
  fs.writeFileSync(path, JSON.stringify(store, null, 2));
  console.log("Injected demo partner to admin-store.json");
} else {
  console.log("Demo partner already exists");
}
