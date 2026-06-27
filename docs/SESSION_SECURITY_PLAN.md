# Session Security Plan

## DPDP Compliance
As a tax platform, we handle highly sensitive PII (PAN, Salary, Aadhaar). The Indian Digital Personal Data Protection Act requires strict security measures.

## Timeout Logic
1. **Auto Logout:** If the user is inactive for 15 minutes, automatically log them out and clear local state (`useDraftStore`).
2. **Warning Modal:** At 14 minutes, show a modal: "Your session will expire in 60 seconds due to inactivity. Click to stay logged in."
3. **Draft Auto-save:** Ensure all progress is saved to PostgreSQL before logging out, so the user can resume later.
4. **Re-Auth for Sensitive Actions:** Before paying via Razorpay or downloading the final ITR-V/Computation PDF, prompt for password or OTP re-verification.
