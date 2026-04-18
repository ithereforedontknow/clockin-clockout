Here's the updated README.md reflecting all the production-ready changes we've made:

```markdown
# ClockIn/Out

A comprehensive employee management system with time tracking, time off management, and a full Learning Management System (LMS). Built with React + TypeScript + Supabase + shadcn/ui.

## Tech Stack

| Layer       | Choice                                   |
|-------------|------------------------------------------|
| Framework   | React 18 + TypeScript + Vite             |
| Styling     | Tailwind CSS + shadcn/ui                 |
| Icons       | Lucide React                             |
| State       | TanStack Query v5                        |
| Backend     | Supabase (Postgres + Auth + RLS)         |
| Toasts      | Sonner                                   |
| Date utils  | date-fns                                 |
| Validation  | Zod                                      |
| PDF Gen     | @react-pdf/renderer                      |

## Features Implemented

### Core Features
- **Authentication** — Magic link email sign-in, password reset flow, company-branded login pages
- **Home tab** — Time off balance widgets, Who's Out calendar, upcoming holidays, celebrations, announcements
- **My Info tab** — View/edit personal info; fields flagged for approval submit change requests with pending/cancel workflow
- **People tab** — Searchable company directory (card grid) + Org Chart
- **Timesheet tab** — Clock in/out, break tracking, timesheet history, clock corrections
- **Time Off tab** — Current balances, future balance calculator, request history, edit/cancel pending requests
- **Approvals tab** — Review time off requests, info change requests, clock corrections (employer/admin)
- **Reports tab** — Timesheet reports, payroll export, workforce overview, training reports with CSV export
- **Admin tab** — Employee management, departments, holidays, audit log, course categories & tags

### Learning Management System (LMS)
- **Course Management** — Create courses with modules, lessons, rich text content, and quizzes
- **Course Categories & Tags** — Organize courses with categories and flexible tags
- **Video Lessons** — Cloudflare Stream integration with progress tracking
- **Quiz System** — Multiple choice quizzes with scoring and retry capability
- **Certificate Generation** — PDF certificates upon course completion
- **Bulk Operations** — Bulk assign/unassign courses to multiple employees
- **Course Duplication** — Clone entire courses with modules and lessons
- **Training Calendar** — Due date calendar view with event highlighting
- **Team Progress** — Manager view of team training progress
- **Training Reports** — Comprehensive reports with date range, category, status filters

### Settings & Configuration
- **Company Settings** — Company name, logo upload, contact info, address
- **Work Schedule** — Standard hours, working days, overtime thresholds
- **Notification Preferences** — Per-user toggles for all notification types
- **System Info** — Timezone configuration (Asia/Manila fixed)

## Quick Start

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the complete schema SQL in the SQL Editor (creates all tables, RLS policies, functions)
3. Create storage buckets:
   - `course-assets` (public) - for course thumbnails
   - `company-assets` (public) - for company logo
4. Note your **Project URL** and **anon public key** from Project Settings → API

### 2. Environment Variables

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Seed Initial Data

After signing up, insert an employee record linked to your auth user:

```sql
INSERT INTO employees (user_id, first_name, last_name, email, role, job_title, department, location)
VALUES ('your-auth-uid', 'Admin', 'User', 'admin@company.com', 'admin', 'Administrator', 'HR', 'Manila');
```

Then seed time off balances:

```sql
INSERT INTO time_off_balances (employee_id, category_id, balance, scheduled)
SELECT 'your-emp-id', id, 
  CASE name WHEN 'Vacation' THEN 15 WHEN 'Sick' THEN 10 ELSE 5 END,
  0
FROM time_off_categories;
```

Insert default company settings:

```sql
INSERT INTO company_settings (id, company_name)
VALUES ('singleton', 'Your Company Name')
ON CONFLICT (id) DO NOTHING;
```

## Architecture Notes

### Query Layer (`src/lib/queries/`)
All Supabase calls go through TanStack Query hooks organized by domain:
- `employeeQueries.ts` — Employee CRUD, info change requests, notification preferences
- `trainingQueries.ts` — All LMS functionality (~700 lines)
- `timeOffQueries.ts` — Time off requests, balances, holidays
- `clockQueries.ts` — Clock in/out, breaks, corrections
- `approvalQueries.ts` — Pending approvals & review actions
- `notificationQueries.ts` — Notifications CRUD
- `adminQueries.ts` — Admin panel employee management
- `reportQueries.ts` — Timesheet & payroll reports
- `companyQueries.ts` — Settings, departments
- `announcementQueries.ts` — Announcements
- `auditQueries.ts` — Audit logging

Centralized query keys in `keys.ts` ensure consistent cache management.

### Component Structure
Components are organized by feature:
- `src/components/training/` — All LMS components (15+ files)
- `src/components/admin/` — Admin panel components
- `src/components/reports/` — Reporting components
- `src/tabs/` — Tab orchestrators (thin wrappers)

### Approval Workflow
Fields requiring approval route through dedicated request tables:
- `info_change_requests` — Profile changes
- `time_off_requests` — Time off requests
- `clock_corrections` — Timesheet corrections

Employers/admins review and approve/deny through the Approvals tab.

### Audit Logging
All administrative actions are logged to the `audit_log` table including:
- Course creation/deletion
- Course assignment/unassignment
- Time off approvals/denials
- Info change approvals/denials
- Clock correction reviews

### Notification System
In-app notifications for:
- Time off approvals/denials
- Profile change approvals/denials
- Clock correction decisions
- New employee joins
- Course assignments
- Course completions

Users can toggle notification preferences per category in Settings.

### RLS Policies
Row Level Security ensures users only access authorized data:
- Employees see their own records and team data (if manager)
- Employers see team data and manage approvals
- Admins have full access

## Extending the App

| Feature              | Where to add                                      |
|----------------------|---------------------------------------------------|
| Email notifications  | `src/lib/email.ts` + Supabase Edge Functions      |
| iCal feed            | Edge Function returning `text/calendar` format    |
| Bulk data import     | Admin tab + CSV parsing                           |
| Custom report builder| Reports tab + dynamic query builder               |
| Mobile app           | React Native + shared query layer                 |
| SCORM/xAPI support   | New lesson type in LMS                            |

## Deployment

### Cloudflare Pages / Vercel / Netlify

1. Connect your Git repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables from `.env.local`
5. Deploy

**Note for Cloudflare Pages:** Ensure all file imports use consistent casing (case-sensitive Linux environment).

## License

Proprietary - All rights reserved
```

This README now accurately reflects the production-ready system we've built, including the modular query architecture, full LMS features, settings system, and deployment considerations.