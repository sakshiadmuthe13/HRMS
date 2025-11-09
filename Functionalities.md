# DW Innovations Employee Management System

## Platform Overview
- **Purpose**: Centralize employee lifecycle management for DW Innovations, spanning onboarding, daily operations, compliance, payroll, and engagement.
- **Primary Audience**: Administrators, project leaders, and individual employees requiring role-specific dashboards and workflows.
- **Delivery Model**: React + Vite single-page application backed by an Express/MongoDB API with real-time Socket.IO updates and scheduled automations.

## Architecture Summary
- **Frontend**: React 19 SPA served by Vite, Tailwind-powered styling, routing via `react-router-dom`, toast feedback, charts, maps, and Socket.IO client for live notifications.
- **Backend**: Node.js Express 5 REST API with modular controllers, JWT authentication, role-based middleware, and cron-driven background jobs.
- **Database**: MongoDB collections managed through Mongoose schemas for users, attendance, leave, salary, teams, projects, notifications, and tasks.
- **Real-Time & Scheduling**: Socket.IO broadcasts for in-app notifications; Node-Cron nightly job emails celebrations (birthdays, work and marriage anniversaries).
- **Email & Storage**: Nodemailer for transactional mail (OTP, salary slips, holiday notices, celebration blasts); ImageKit integration for document uploads and CDN delivery.

## User Roles & Access
- **Admin**: Full organizational control including staff management, payroll, project orchestration, compliance verification, and communications.
- **Leader**: Team-level oversight to manage project execution, assign tasks, monitor attendance, and support leave approvals with visibility over reports.
- **Employee**: Self-service portal for attendance, leaves, tasks, profile upkeep, document submission, and organizational announcements.

## Authentication & Account Security
- **Login**: Email and password login flows tailored per role with protected routers in both frontend and backend.
- **Password Recovery**: OTP-based reset sent via email for forgotten credentials.
- **Session Control**: JWT issuance with role-specific guards securing every API route; logout endpoints clear client-side sessions.

## Admin Experience
- **Employee Lifecycle**: Create, view, update, and deactivate employees, leaders, and fellow admins; maintain full staff directory visibility.
- **Attendance Oversight**: Searchable attendance logs including check-in and check-out times filtered by date range.
- **Leave Governance**: Review incoming leave requests, approve or reject, and notify both requestor and their leader of status changes.
- **Payroll Management**: Credit salaries with base and bonus components, trigger email confirmations, and track cumulative payouts per user.
- **Team Structuring**: Form teams with designated leaders and members, manage updates, and retire obsolete teams.
- **Project Control**: Define project metadata (timeline, status, completion percentage, assigned teams), audit progress, modify details, or archive projects.
- **Document Compliance**: Review identity and employment documents uploaded by leaders and employees, marking verified records.
- **Holiday Calendar**: Schedule organizational holidays, publish them to the shared calendar, and broadcast email notifications.
- **Celebration Broadcasts**: Dispatch celebratory messages for daily milestones; cron job automates email campaigns to all active users.
- **Notification Hub**: Push role-wide or user-targeted announcements that surface instantly in every dashboard.

## Leader Experience
- **Attendance Management**: Daily check-in/check-out submissions with self-service history review.
- **Team Awareness**: View teams they belong to and drill into member rosters for quick contact.
- **Project Visibility**: Access all projects assigned to their teams, including status and milestones.
- **Leave Handling**: Submit personal leave requests, monitor approval statuses, and receive mail updates for subordinates’ requests.
- **Task Assignment**: Create tasks for employees within their projects, set expectations, and follow progress via status tracking.
- **Profile Administration**: Upload compliance documents, view personal profile details, and edit contact or demographic information.
- **Celebration Feed**: See daily celebrations (birthdays, anniversaries) alongside attendance tools for team engagement.
- **Employee Directory**: Search the organization-wide directory to retrieve colleague information when coordinating work.

## Employee Experience
- **Attendance Tracking**: Mark daily attendance with precise check-in/check-out times and review historical records.
- **Leave Requests**: Apply for leave, follow approval workflows, and receive email confirmations alongside leader notifications.
- **Team Participation**: View the teams they belong to and understand leadership and teammate assignments.
- **Task Execution**: Monitor tasks assigned by leaders, update statuses, and provide progress feedback.
- **Project Insight**: Review projects they are staffed on, including key details and timelines.
- **Document Submission**: Upload personal verification documents for admin approval and check verification status.
- **Profile Self-Service**: Manage personal details, ensuring records stay accurate and current.
- **Celebration Feed**: Stay informed about organizational celebrations directly within the attendance module.
- **Employee Directory**: Use the contact directory to locate colleague information for collaboration.

## Shared Capabilities
- **Dashboards**: Role-aware dashboards summarizing attendance stats, leave balances, tasks, notifications, and project insights.
- **Notifications**: Real-time in-app notifications plus email alerts for key events (leave decisions, salary credit, document status, celebrations).
- **Calendars & Visualizations**: Calendar views highlighting attendance, holidays, and leaves; analytics components visualize team and project health.
- **Responsive UI**: Tailwind-based responsive layouts optimized for desktop usage with consistent navigation and theming.
- **Security & Compliance**: Centralized JWT validation, password hashing with bcrypt, activity checks for active users, and document verification workflows.

## Operational Workflows
1. **Onboarding**: Admin creates user accounts, assigns roles, and places users into teams and projects.
2. **Daily Operations**: Users mark attendance, leaders assign tasks, and dashboards refresh with Socket.IO events.
3. **Leave Management**: Employees/leaders raise leave requests, admins adjudicate, and automated notifications propagate decisions.
4. **Payroll Cycle**: Admin credits salaries, emails receipts, and ledger entries update cumulative payout history.
5. **Compliance Review**: Users upload documents, admins verify, and notifications confirm completion.
6. **Engagement Loop**: Cron job aggregates celebrations nightly, pushes email campaigns, and the UI surfaces achievements the next day.

## Technology & Environment Requirements
- **Runtime**: Node.js ≥ 18 for both backend and frontend toolchains.
- **Environment Variables**: MongoDB URI, JWT secret, SMTP credentials, ImageKit keys, and API base URLs (templates in `.env.example`).
- **Local Setup**: Install dependencies separately in `backend/` and `frontend/`, run `npm run dev` in each for full-stack development.
- **Deployment Considerations**: Secure environment variables, rotate committed secrets, and provision persistent MongoDB, SMTP, and ImageKit services.

## Extension Opportunities
- **Calendar Enhancements**: Improve holiday/leave color coding, deadline tracking, and overdue escalation.
- **Reporting**: Generate downloadable reports for admins (attendance, payroll, project status).
- **Policy Automation**: Enforce yearly paid leave allowances with automatic balance deduction and visibility.
- **Advanced Modules**: Introduce departmental hierarchies, analytics exports, and richer compliance auditing flows.
