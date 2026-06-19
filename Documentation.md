# Employee Management System - Comprehensive Documentation

## Overview
The Employee Management System is a robust web application designed to streamline organizational processes, manage human resources, track attendance, and facilitate project and task management. 

### Key System Features
- **Real-Time Notifications**: The system employs a WebSocket-based event-driven architecture to deliver instant notifications (with audible alerts) to Admins, HRs, Leaders, and Employees for crucial events like task assignments, leave approvals, and announcements, without requiring a page refresh.

To ensure security and organized access, the system utilizes a **Role-Based Access Control (RBAC)** architecture. There are four primary roles within the application, each tailored to specific organizational duties:
1. **Admin**
2. **HR (Human Resources)**
3. **Leader**
4. **Employee**

Below is the detailed, page-by-page documentation for each role.

---

## 1. Role: Admin
The Administrator is the highest-level user in the system. Admins have global oversight and management capabilities over all users, system configurations, and high-level reporting.

### Admin Pages & Features
- **Admin Dashboard (`admin-dashboard.jsx`)**
  - The central command center for administrators.
  - Displays high-level analytics, key organizational metrics, system status, and quick-action shortcuts.

- **Admins Management (`AdminsPage.jsx`)**
  - Interface for managing administrator accounts. Admins can create new admin profiles, update details, or revoke access.

- **HRs Management (`HRsPage.jsx`)**
  - Dedicated page to oversee the Human Resources team. Admins can add, edit, or remove HR personnel from the system.

- **Leaders Management (`LeadersPage.jsx`)**
  - Allows admins to manage the organization's team leaders and managers, assigning them to their respective departments.

- **Employees Management (`EmployeesPage.jsx`)**
  - A global directory and management interface for all standard employees across the organization.

- **Profile Verification (`ProfileVerificationPage.jsx`)**
  - A specialized tool for verifying user profiles, checking uploaded documents, and ensuring data integrity across user accounts.

- **Projects Overview (`ProjectsPage.jsx`)**
  - A centralized view of all company projects. Admins can track overall progress, oversee timelines, and monitor which leaders are assigned to specific initiatives.

- **Teams Management (`TeamsPage.jsx`)**
  - Allows for the creation and structural management of various teams, defining hierarchy and team compositions.

- **Global Tasks (`AdminTasksPage.jsx`)**
  - A bird's-eye view of all tasks within the organization, useful for auditing and tracking broad operational progress.

- **Global Attendance (`AttendancePage.jsx`)**
  - System-wide attendance tracking, allowing the admin to view daily presence, absences, and attendance trends.

- **Global Leaves (`LeavesPage.jsx`)**
  - Oversee all leave requests (pending, approved, rejected) across the entire company.

- **Holiday Calendar (`AdminHolidayCalendar.jsx`)**
  - Configuration page to set up company-wide holidays, non-working days, and regional observances.

- **Reports Analytics (`ReportsPage.jsx`)**
  - A reporting engine to generate detailed analytics on employee performance, attendance patterns, and project completions.

- **Contact Directory (`AdminContactEmployeePage.jsx`)**
  - A quick-search directory enabling the admin to instantly find contact information for any user in the system.

---

## 2. Role: HR (Human Resources)
The HR role is focused on the employee lifecycle, payroll, recruitment, and maintaining compliance.

### HR Pages & Features
- **HR Dashboard (`hr-dashboard.jsx`)**
  - A summary view tailored for HR professionals, highlighting pending leave requests, current attendance rates, and hiring pipeline updates.

- **My Profile (`HRProfilePage.jsx`)**
  - The personal profile of the HR user, containing their personal details, contact info, and documents.

- **My Attendance (`HRAttendancePage.jsx`) & Leaves (`HRLeavePage.jsx`)**
  - Pages for the HR personnel to log their own daily attendance and apply for their personal time off.

- **Manage Attendance (`HRManageAttendancePage.jsx`)**
  - Core HR tool to review, edit, and manage the attendance records of all employees to ensure accuracy for payroll.

- **Manage Leaves (`HRManageLeavesPage.jsx`)**
  - Interface to review employee leave applications. HR can approve, reject, or request more information regarding time-off requests.

- **Salary & Payroll (`HRSalaryPage.jsx`)**
  - Comprehensive module to manage employee compensation, process monthly payroll, adjust allowances/deductions, and generate salary slips.

- **Hiring Pipeline (`HRHiringPage.jsx`)**
  - Recruitment management tool to track candidates, schedule interviews, evaluate applicants, and manage job postings across different departments.

- **Generate Letters (`HRGenerateLetterPage.jsx`)**
  - An automated tool for HR to quickly generate official company documents such as Offer Letters, Relieving Letters, Experience Certificates, and Salary Certificates.

- **Contact Directory (`HRContactEmployeePage.jsx`)**
  - Quick access to employee contact information for HR communications.

---

## 3. Role: Leader
Leaders (or Managers) are responsible for specific teams. They manage projects, assign tasks, and monitor the performance of the employees under their purview.

### Leader Pages & Features
- **Leader Dashboard (`Leader-dashboard.jsx`)**
  - A focused overview showing the status of their assigned projects, team productivity metrics, and recent team activities.

- **My Profile (`Profile.jsx`)**
  - The leader's personal profile and details.

- **My Attendance (`Attendance.jsx`) & Leaves (`Leave.jsx`)**
  - Interfaces for the leader to manage their own time, clock in/out, and request personal time off.

- **My Teams (`Teams.jsx`)**
  - Displays the structure and members of the specific teams the leader is managing.

- **Projects Management (`Projects.jsx`)**
  - Detailed view of the projects assigned to the leader. Allows tracking of milestones, deadlines, and overall project health.

- **Task Allocation (`Task.jsx`)**
  - The operational core for leaders to create tasks, assign them to specific team members, set deadlines, and track task completion statuses (Pending, In Progress, Completed).

- **Contact Directory (`ContactEmployee.jsx`)**
  - Communication tool to easily find and contact their team members or other personnel.

---

## 4. Role: Employee
The core workforce of the organization. The Employee role provides tools for individuals to manage their daily work, track their time, and collaborate with their teams.

### Employee Pages & Features
- **Employee Dashboard (`employee-dashboard.jsx`)**
  - A personalized landing page showing the employee's pending tasks, quick check-in actions, recent announcements, and a summary of their attendance.

- **My Profile (`Profile.jsx`)**
  - The employee's personal page to view and update contact details, view their role, and upload necessary documents.

- **Attendance (`Attendance.jsx`)**
  - The interface used by employees to clock in when they start work and clock out when they finish. It also displays a history of their past attendance records.

- **Leaves (`Leaves.jsx`)**
  - The portal for employees to check their available leave balance, submit new leave applications, and track the approval status of past requests.

- **My Teams (`Teams.jsx`)**
  - A view to see fellow team members and understand the structure of the team they belong to.

- **My Projects (`Projects.jsx`)**
  - Read-only or contributor view of the projects the employee is currently participating in, including project scopes and deadlines.

- **My Tasks (`Tasks.jsx`)**
  - The individual's to-do list. Employees view tasks assigned to them by their Leader, update the status as they work on them, and submit completion details (such as worklogs or deployment links) when finished.

- **Contact Directory (`ContactEmployee.jsx`)**
  - A lookup tool to find contact information for colleagues, team leaders, or HR for internal communication.
