# Feature Spec: User Detail Page

## Overview

The **User Detail Page** allows admins to inspect detailed information about a specific user inside the AmunisiPTN system.

This page acts as a centralized dashboard for user-related activities, making it easier for admins to:

- Monitor user behavior
- Review submitted bug reports
- Review tryout participation history
- Take actions related to account moderation or support

This feature is tightly integrated with the Ticket Report system.

---

# Goals

- Provide a complete overview of a user.
- Improve admin support workflow.
- Enable faster issue investigation.
- Track learning and tryout behavior.
- Centralize user activity history.

---

# Route

```bash
/admin/users/[id]
```

Example:

```bash
/admin/users/123
```

---

# UI Components (shadcn/ui)

Required components:

- Card
- Tabs
- Badge
- Avatar
- Separator
- Button
- Table
- Dropdown Menu
- Alert Dialog
- Pagination
- Skeleton
- Tooltip
- Scroll Area
- Input
- Select

---

# Header Section

## Purpose

Quick navigation and user-level actions.

## Components

### Breadcrumb

```bash
Dashboard / Users / Detail
```

Use:

- Breadcrumb
- BreadcrumbItem
- BreadcrumbSeparator

---

### User Name

Display:

- Full name
- Username
- Email

Example:

```bash
Muhammad Ahib Ibrilli
@ahib
ahib@example.com
```

---

### User Actions

Located at top-right.

Actions:

| Action         | Description                |
| -------------- | -------------------------- |
| Suspend User   | Temporarily disable access |
| Ban User       | Permanently block user     |
| Reset Password | Trigger reset flow         |
| View Tickets   | Jump to ticket tab         |
| View Tryouts   | Jump to tryout tab         |

Component:

```bash
DropdownMenu
```

Danger actions:

- Suspend
- Ban

Require:

```bash
AlertDialog
```

---

# User Profile Card

## Purpose

Display main user information.

Component:

```bash
Card
```

---

## Basic Information

Fields:

| Field        | Type     |
| ------------ | -------- |
| Full Name    | string   |
| Username     | string   |
| Email        | string   |
| Phone Number | string   |
| School       | string   |
| Grade        | string   |
| Join Date    | datetime |
| Last Login   | datetime |

---

## Account Status

Use Badge.

Statuses:

- Active
- Suspended
- Banned
- Verified
- Unverified

Example:

```bash
[Active]
[Verified]
```

---

## Statistics

Quick metrics.

Cards:

- Total Tickets
- Total Tryouts
- Completed Tryouts
- Average Score
- Last Active

Layout:

```bash
Grid (5 columns)
```

Component:

```bash
Card
```

---

# Tabs Section

Use:

```bash
Tabs
```

Tabs:

1. Overview
2. Ticket History
3. Tryout History

---

# Tab: Overview

Contains summarized user activity.

---

## Recent Tickets

Show latest 5 tickets.

Fields:

- Ticket ID
- Title
- Status
- Priority
- Created At

Component:

```bash
Table
```

Status badge:

- Open
- In Progress
- Resolved
- Closed

---

## Recent Tryouts

Show latest 5 tryouts.

Fields:

- Tryout Name
- Score
- Rank
- Status
- Submitted At

Status:

- Completed
- Ongoing
- Abandoned

---

# Tab: Ticket History

Full ticket list submitted by user.

Purpose:

Admin can review all reports.

---

## Table Columns

| Column     | Type     |
| ---------- | -------- |
| Ticket ID  | string   |
| Title      | string   |
| Category   | string   |
| Status     | badge    |
| Priority   | badge    |
| Created At | datetime |
| Updated At | datetime |

---

## Features

### Search

Search by:

- Ticket ID
- Title

Component:

```bash
Input
```

---

### Filter

Filter by:

- Status
- Category
- Priority

Component:

```bash
Select
```

---

### Pagination

Required.

Component:

```bash
Pagination
```

---

### Row Action

Actions:

- View Detail
- Assign Admin
- Mark Resolved

Component:

```bash
DropdownMenu
```

---

# Tab: Tryout History

Displays all user tryout activity.

Purpose:

Track performance and engagement.

---

## Table Columns

| Column       | Type     |
| ------------ | -------- |
| Tryout ID    | string   |
| Tryout Name  | string   |
| Category     | string   |
| Score        | number   |
| Rank         | number   |
| Duration     | string   |
| Status       | badge    |
| Submitted At | datetime |

---

## Features

### Search

Search by tryout name.

---

### Filter

Filter by:

- Status
- Category

---

### Sort

Sort by:

- Highest Score
- Lowest Score
- Latest
- Oldest

---

### Pagination

Required.

---

# Loading State

Use:

```bash
Skeleton
```

For:

- Profile card
- Statistics
- Tables

---

# Empty State

Ticket history:

```bash
"No tickets submitted yet."
```

Tryout history:

```bash
"No tryout history available."
```

Use:

- Empty illustration
- Muted text

---

# Error State

Show:

```bash
Alert
```

Cases:

- User not found
- Failed to fetch data

---

# Permissions

Only:

```bash
Admin
Super Admin
Support Team
```

Can access.

---

# Design Principles

UI should be:

- Clean
- Spacious
- Minimal
- Data-focused
- Easy to scan
- Responsive

Guidelines:

- Use muted backgrounds
- Soft borders
- Consistent spacing
- Avoid visual clutter
- Use badges for statuses
- Keep tables compact but readable

---

# Responsive Behavior

Desktop:

```bash
2-column profile layout
```

Mobile:

```bash
Stacked cards
Scrollable tabs
Horizontal table scroll
```

---

# Future Improvements

- Export user ticket history
- Export tryout history
- User activity timeline
- Login history
- Payment history
- Performance analytics
- Risk detection (abnormal behavior)
