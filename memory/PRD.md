# Kiosk Application PRD

## Original Problem Statement
Pull code from https://github.com/Abhi-mygenie/Kiosk and build and run application. No database used, no testing agent required.

## Architecture
- **Frontend**: React 19 with Tailwind CSS, Framer Motion animations
- **Backend**: FastAPI (Python) - proxy to external POS API
- **External API**: preprod.mygenie.online (POS system)
- **No Local Database**: All data from POS API

## User Personas
1. **Hotel Staff**: Login to kiosk, manage sessions
2. **Hotel Guests**: Self-order from breakfast buffet menu

## Core Requirements (Static)
- Staff authentication via POS credentials
- Menu display with categories and items
- Cart management with quantity/variations
- Table selection before ordering
- Order submission to POS system
- Responsive design (portrait/landscape kiosk modes)

## What's Been Implemented
**Date: March 15, 2025**
- ✅ Cloned repository from GitHub
- ✅ Installed backend dependencies (FastAPI, httpx, etc.)
- ✅ Installed frontend dependencies (React, Radix UI, etc.)
- ✅ Started backend server (port 8001)
- ✅ Started frontend server (port 3000)
- ✅ Verified application loads (login page visible)

## Tech Stack
- React 19.0.0
- FastAPI 0.110.1
- Tailwind CSS 3.4.17
- Framer Motion 12.35.2
- Radix UI components
- Sonner for toasts

## Prioritized Backlog
- P0: Application deployed and running ✅
- P1: Test with valid POS credentials
- P2: Custom branding configuration
- P3: Offline mode support

## Next Tasks
1. Obtain POS credentials for testing
2. Verify full ordering flow works
3. Configure any custom branding if needed
