# Feature Spec: Ticket Report

## Overview

The **Ticket Report** feature allows users of the **AmunisiPTN** tryout application to report bugs, errors, or issues encountered while using the system.

The purpose of this feature is to:

- Provide a structured communication channel between users and admins for technical issues.
- Simplify issue tracking until resolution.
- Improve user experience through transparent issue handling progress.

---

# Goals

- Users can create issue reports.
- Users can monitor ticket progress/status.
- Admins can monitor all tickets.
- Admins can update ticket statuses.

---

# Actors

## User

A role responsible for creating ticket reports.

### Permissions

- Create tickets
- View own tickets
- Upload supporting images
- Monitor ticket status

---

## Admin

A role responsible for handling ticket reports.

### Permissions

- View all tickets
- Filter tickets by status
- Update ticket status
- Resolve tickets

---

# Ticket Lifecycle

```text
OPEN → IN_PROGRESS → SOLVED
```

## Status Definitions

### OPEN

A newly created ticket that has not been handled yet.

### IN_PROGRESS

The admin is currently investigating or working on the issue.

### SOLVED

The issue has been resolved.

---

# User Flow

## Create Ticket

The user navigates to:

```text
Dashboard → Help Center → Report Issue
```

The user fills out the form.

### Fields

| Field       | Type                  | Required |
| ----------- | --------------------- | -------- |
| title       | string                | yes      |
| description | rich text             | yes      |
| images      | multiple image upload | no       |

The system automatically sets:

```text
status = OPEN
created_by = current_user
created_at = current_timestamp
```

---

## View My Tickets

Users can view a list of their own submitted tickets.

### Displayed Fields

- Ticket ID
- Title
- Current Status
- Created At
- Updated At

### Actions

- View ticket details

---

## Ticket Detail

Users can view:

- Title
- Description
- Uploaded images
- Current status
- Created at
- Updated at

---

# Admin Flow

## Ticket Dashboard

Admins can view all submitted tickets.

### Features

- Search by title
- Filter by status
- Sort by latest
- View ticket details

---

## Update Ticket Status

Admins can update ticket statuses with valid transitions:

```text
OPEN → IN_PROGRESS
IN_PROGRESS → SOLVED
```

---

# Functional Requirements

## FR-01 Create Ticket

The system must allow authenticated users to create tickets.

### Validation

- `title` is required
- `description` is required

---

## FR-02 Upload Images

The system must support optional multiple image uploads.

### Constraints

- Maximum 5 images
- Maximum 3MB per image
- Allowed formats: jpg, jpeg, png, webp

### Storage

```text
/storage/ticket-reports/
```

Images should be stored as an array/JSON in the `images` field.

---

## FR-03 Rich Text Description

The description field must support:

- Bold
- Italic
- Bullet lists
- Ordered lists
- Code blocks
- Links

### Suggested Editors

- Tiptap
- Quill
- CKEditor

---

## FR-04 Ticket Listing

- Users can only view their own tickets.
- Admins can view all tickets.

---

## FR-05 Ticket Status Management

Admins can update ticket statuses.

### Valid Statuses

- OPEN
- IN_PROGRESS
- SOLVED

Status transitions must follow the defined lifecycle.

---

# Non-Functional Requirements

## Performance

- Ticket list should load in under 2 seconds.
- Image uploads must display a progress indicator.

---

## Security

- Only authenticated users can create tickets.
- Users cannot access other users’ tickets.
- Only admins can update ticket statuses.

---

## Scalability

The system should support:

- 10,000+ tickets
- Optimized image storage

---

# Database Design

## `ticket_reports`

| Field       | Type          |
| ----------- | ------------- |
| id          | uuid          |
| user_id     | uuid          |
| title       | varchar       |
| description | longtext      |
| images      | json nullable |
| status      | enum          |
| created_at  | timestamp     |
| updated_at  | timestamp     |

---

# API Contract

## Create Ticket

```http
POST /api/ticket-reports
```

### Payload

```json
{
  "title": "Exam timer stopped",
  "description": "<p>The timer stopped when switching questions</p>",
  "images": ["file"]
}
```

### Response

```json
{
  "success": true,
  "data": {}
}
```

---

## Get User Tickets

```http
GET /api/ticket-reports
```

Returns only the authenticated user's tickets.

---

## Get Ticket Detail

```http
GET /api/ticket-reports/{id}
```

---

## Admin Get All Tickets

```http
GET /api/admin/ticket-reports
```

### Query Example

```text
?status=OPEN
```

---

## Update Ticket Status

```http
PATCH /api/admin/ticket-reports/{id}/status
```

### Payload

```json
{
  "status": "IN_PROGRESS"
}
```

---

# UI Components

## User Side

- TicketReportButton
- CreateTicketDialog
- TicketReportForm
- TicketReportList
- TicketReportCard
- TicketReportDetail

---

## Admin Side

- TicketReportTable
- TicketStatusBadge
- TicketFilterTabs
- TicketDetailDrawer
- UpdateStatusDialog

---

# Edge Cases

## Empty Images

Tickets should still be created successfully without images.

---

## Oversized Images

The system must reject images that exceed the size limit.

---

## Deleted User

Tickets must remain stored even if the associated user is deleted.

---

# Future Improvements

- Comment threads between users and admins
- Reopen solved tickets
- Priority labels (Low, Medium, High, Critical)
- Category tags (Bug, Payment, UI, System Error)
- Support for non-image attachments
- Notification system

---

# Acceptance Criteria

- Users can submit ticket reports.
- Users can view their own ticket list.
- Users can view ticket details.
- Admins can view all tickets.
- Admins can filter tickets by status.
- Admins can update ticket statuses.
- Image uploads work correctly.
- Access control works based on user roles.
- Rich text descriptions are stored properly.
