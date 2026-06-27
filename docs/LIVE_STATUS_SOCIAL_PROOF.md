# Live Status & Social Proof

## Overview
Social proof increases trust and conversion rates. However, fake social proof violates compliance and trust.

## Design
We will implement a "Live Filing Status" component that looks sexy (green highlighted color) but uses safe, real (or clearly labeled demo) data.

## Metrics to Display
1. "X returns analyzed this season" (from database count).
2. "Y AIS mismatches caught" (derived from engine logs).
3. "Users currently filing: Z" (randomized within a realistic bound based on active sessions, or real WebSocket count).

## Safe Design Rules
- **No Fake Savings:** Do not show "₹12.4L estimated tax savings identified" unless we are actually aggregating this from the database securely and anonymized.
- **Production Mode:** Use real database counters fetched via a `/api/stats` endpoint.
- **Admin Control:** The admin panel should have a toggle to enable/disable the live counter during low-traffic periods.
