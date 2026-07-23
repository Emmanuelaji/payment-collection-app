# Payment Collection & Record Management App

A modern, secure payment recording system for businesses that accept offline payments. Record payments with one click, track history, and export data to Excel.

## Features
- Secure email/password login (Supabase Auth)
- Role-based access (Admin & Collector)
- Quick payment buttons: ₦100, ₦200, ₦500, ₦1000 (configurable)
- Custom amount entry with optional customer details
- Real-time dashboard statistics
- Payment history with search, date/status filters, pagination
- Excel export respecting current filters
- Payment voiding (soft delete)
- Audit trail
- Admin user management
- Fully responsive (mobile-first)

## Tech Stack
- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui
- Supabase (PostgreSQL, Auth, RLS)
- SheetJS (xlsx) for Excel export
- Zod validation, react-hook-form
- date-fns for date formatting

## Local Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd payment-collection-app