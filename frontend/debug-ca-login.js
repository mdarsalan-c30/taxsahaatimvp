const crypto = require("crypto");
const fs = require("fs");

const store = JSON.parse(fs.readFileSync("./data/admin-store.json"));
const tenants = store.tenants;

const email = "partner@taxsaathi.com";
const password = "Partner2026";

const tenant = tenants.find(t => t.email.toLowerCase() === email.toLowerCase());
console.log("Tenant found?", !!tenant);
if (tenant) {
    console.log("Tenant passwordHash length", tenant.passwordHash.length);
    const candidate = crypto.createHash("sha256").update(password).digest("hex");
    console.log("Candidate passwordHash length", candidate.length);
    console.log("Match?", candidate === tenant.passwordHash);
    
    // Test the timingSafeEqual
    const a = Buffer.from(candidate);
    const b = Buffer.from(tenant.passwordHash);
    console.log("Buffer compare:", crypto.timingSafeEqual(a, b));
}
