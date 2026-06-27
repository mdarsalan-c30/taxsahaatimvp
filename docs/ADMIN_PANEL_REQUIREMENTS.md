# Admin Panel Requirements

## Overview
The Admin Panel will be built inside the existing Next.js application, accessible only to users with the `ADMIN` role. It will connect to the PostgreSQL database (hosted on Hostinger VPS).

## Core Responsibilities
- **Pricing Management:** Edit B2C and B2B pricing plans, toggle discounts (e.g., slash ₹899 to ₹359).
- **Content Management:** Manage SEO blogs, FAQ answers, and Glossary terms.
- **AI Genie Knowledge:** Add static Keyword-Answer mappings to avoid API hits.
- **Platform Toggles:** Enable/disable live filing status counters, maintenance mode.
- **B2B User Management:** View corporate clients, issue bulk filing credits, track usage.

## Technical Stack
- Next.js App Router (`/admin` routes protected by middleware).
- PostgreSQL database via Prisma ORM.
- Tailwind CSS UI (matching the main app).
