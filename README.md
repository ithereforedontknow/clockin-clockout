# BambooHR Clone

A React + TypeScript + Supabase + shadcn/ui implementation of core BambooHR employee self-service features.

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

## Features Implemented

- **Home tab** — Time off balance widgets, Who's Out calendar, upcoming holidays, celebrations
- **My Info tab** — View/edit personal info; fields flagged `APPROVAL_REQUIRED_FIELDS` submit change requests with pending/cancel workflow
- **People tab** — Searchable company directory (card grid) + Org Chart placeholder
- **Time Off tab**
  - Current balances with scheduled deductions
  - Future balance calculator (accrual-aware)
  - Request history with status badges
  - Edit / cancel pending or future-dated requests
- **Request Time Off dialog** — Category, date range, business day counter, note, balance check warning
- **Loading skeletons** on all async data
- **Success & error toasts** via Sonner

## Quick Start

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor (creates all tables, RLS policies, seed data)
3. Note your **Project URL** and **anon public key** from Project Settings → API

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

### 4. Seed a Test Employee

Insert a row into `employees` with your `auth.users` UUID after signing up:

```sql
insert into employees (user_id, first_name, last_name, email, job_title, department, location)
values ('your-auth-uid', 'Jane', 'Doe', 'jane@company.com', 'Engineer', 'Engineering', 'Remote');
```

Then seed balances:

```sql
insert into time_off_balances (employee_id, category_id, balance, scheduled)
select 'your-emp-id', id, 
  case name when 'Vacation' then 15 when 'Sick' then 10 else 5 end,
  0
from time_off_categories;
```

## Architecture Notes

### Query Layer (`src/lib/queries.ts`)
All Supabase calls go through TanStack Query hooks. Mutations invalidate related query keys to keep UI in sync automatically. The `calculateFutureBalance` utility is a pure function for the balance calculator widget.

### Approval Workflow
Fields in `APPROVAL_REQUIRED_FIELDS` (job_title, department, location) route through `info_change_requests` table instead of directly updating the employee record. The approver workflow lives on the admin side (not implemented here). Pending changes show a badge and cancel button in My Info.

### Auth Integration
Currently uses a hardcoded `CURRENT_EMPLOYEE_ID` constant for demo. Replace with:

```ts
const { data: { user } } = await supabase.auth.getUser();
// then query employees where user_id = user.id
```

## Extending the App

| Feature              | Where to add                                      |
|----------------------|---------------------------------------------------|
| SSO login page       | New `LoginPage` component + `supabase.auth.signInWithOAuth` |
| HR admin dashboard   | Separate route/role check, new tab or sub-app     |
| Who's Out full calendar | Replace widget with `react-big-calendar` or FullCalendar |
| Email notifications  | Supabase Edge Functions triggered by DB webhooks  |
| iCal feed            | Edge Function returning `text/calendar` format    |
| File uploads         | Supabase Storage + Files tab                      |
