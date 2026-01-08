# Blogs & Newsletters Admin Panel - Product Requirements Document

--------------------------------------------------

## DOCUMENT METADATA

--------------------------------------------------

**Document Title:** Blogs & Newsletters Admin Panel (PRD)

**Owner:** Raghav Thakkar

**Document Status:** Active

**Version:** 1.0.0

**Last Updated:** 2025

--------------------------------------------------

## TABLE OF CONTENTS

--------------------------------------------------

1. [Purpose & Goals](#1-purpose--goals)
2. [Stakeholders](#2-stakeholders)
3. [Feature Summary](#3-feature-summary)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Constraints](#6-constraints)
7. [System Architecture](#7-system-architecture)
8. [Security & Compliance](#8-security--compliance)
9. [Dependencies](#9-dependencies)
10. [Risks & Mitigations](#10-risks--mitigations)
11. [User Stories](#11-user-stories)
12. [Technical Specifications](#12-technical-specifications)
13. [Acceptance Criteria](#13-acceptance-criteria)
14. [Out of Scope (Current Version)](#14-out-of-scope-current-version)
15. [Future Enhancements](#15-future-enhancements)
16. [Deployment & Environments](#16-deployment--environments)
17. [Testing Strategy](#17-testing-strategy)
18. [Documentation](#18-documentation)
19. [Support & Maintenance](#19-support--maintenance)
20. [Version History](#20-version-history)
21. [Appendix](#21-appendix)

--------------------------------------------------

## 1. PURPOSE & GOALS

--------------------------------------------------

### Overview

The Blogs & Newsletters Admin Panel is a comprehensive content management system designed to streamline the creation, approval, and publishing of blog posts and newsletters. It serves as the central hub for content teams to manage their editorial workflow, ensure quality control, and track content performance.

### Who It Is Built For

The system is primarily designed for:
- **Marketing Managers**: Content creators who draft, edit, and prepare blogs and newsletters for publication
- **Administrators**: Content approvers who review, approve, reject, and manage all content and user accounts
- **Content Operations Team**: Users responsible for validating content quality before public release

### Business Problems Solved

1. **Content Governance**: Eliminates uncontrolled publishing by enforcing approval workflows
2. **Content Quality Control**: Ensures all published content meets organizational standards through structured review processes
3. **Workflow Efficiency**: Reduces time-to-publish through AI-assisted content generation and streamlined approval processes
4. **Content Visibility**: Provides analytics and tracking to understand content performance
5. **Team Collaboration**: Enables multiple team members to work on content with clear ownership and edit history tracking
6. **Security & Access Control**: Protects content assets through role-based access control and audit logging

### Primary Objectives

1. Enable efficient content creation with AI-assisted generation capabilities
2. Implement robust approval workflows to ensure content quality
3. Provide comprehensive content management (CRUD operations) for blogs and newsletters
4. Ensure secure access through authentication and role-based permissions
5. Track all content changes and system activities through audit logs
6. Deliver intuitive user experience for content creators and administrators
7. Support public API endpoints for content consumption by external systems

### Success Metrics

- **Content Creation Efficiency**: Reduce average time to create a blog post by 40% through AI assistance
- **Approval Turnaround**: Achieve 90% of content approvals within 24 hours
- **System Adoption**: 100% of marketing team actively using the platform within 3 months
- **Content Quality**: Zero unapproved content published to public endpoints
- **System Performance**: 99% uptime with API response times under 500ms
- **Security**: Zero security breaches related to unauthorized content access

### Admin-Centric Goals

- **Content Control**: Full visibility and control over all published and pending content
- **Publishing Efficiency**: Streamlined workflow from draft to published content
- **Analytics & Insights**: Dashboard statistics showing content status distribution and team activity
- **Governance**: Complete audit trail of all content changes, approvals, and user actions
- **Team Management**: Ability to manage user accounts, roles, and permissions

--------------------------------------------------

## 2. STAKEHOLDERS

--------------------------------------------------

| Role | Owner(s) | Notes |
|------|----------|-------|
| Founders & Leadership | Shaker Dixit, Raghav | Strategic alignment, approvals |
| Product Owner | Janardhan | Backlog, prioritization, acceptance |
| Developer | Raghav Thakkar | Frontend/Backend, integrations, scalability |
| Quality Assurance | Suraj | Test strategy, coverage, automation |
| Design | — | Design is self made |
| Operations / UAT | Rajat | User of project – Content & communication owner responsible for validating blogs and newsletters before release |

--------------------------------------------------

## 3. FEATURE SUMMARY

--------------------------------------------------

### 3.1 Authentication & Role-Based Access

The system implements secure authentication using JWT tokens with role-based access control (RBAC). Two primary roles exist:

- **ADMIN**: Full system access including content approval, user management, and analytics
- **MARKETING_MANAGER**: Content creation and editing capabilities, limited to own content management

Key features include email/password authentication, session management with refresh tokens, password reset functionality, and account status management (ACTIVE, INACTIVE, SUSPENDED).

### 3.2 Blog Management

Comprehensive blog post management system supporting:

- **Content Creation**: Create blogs with title, rich text content, summary, tags, category, author, and featured image
- **Content Editing**: Edit existing blogs with full edit history tracking
- **Content Viewing**: Paginated list view with filtering and detailed single-blog view
- **Status Management**: Four status states (PENDING, APPROVED, REJECTED, DISABLED) with workflow transitions
- **Bulk Operations**: Bulk status updates for multiple blogs simultaneously
- **Search & Filter**: Full-text search across title, content, and summary with status and creator filters
- **Public Access**: Public API endpoints returning only approved content for external consumption

### 3.3 Newsletter Management

Feature-parallel system for newsletter management with identical capabilities to blog management, including creation, editing, approval workflows, and public access endpoints.

### 3.4 Content Editor

- **Rich Text Editor**: WYSIWYG editor (React Quill) supporting formatting, lists, links, and HTML content
- **Content Preview**: Preview rendered content before publishing
- **AI Content Generation**: Generate complete blog/newsletter content from ideas or descriptions
- **Field-Level Regeneration**: Regenerate specific fields (title, summary, content, tags, image) using AI with custom prompts

### 3.5 Publishing & Scheduling

- **Approval Workflow**: Two-stage workflow (PENDING → APPROVED) with admin review required
- **Status Transitions**: Support for APPROVED, REJECTED, and DISABLED states
- **Publish Timestamp**: Automatic `publishedAt` timestamp when content is approved for the first time
- **Public Publishing**: Approved content automatically available through public API endpoints

### 3.6 Drafts & Approvals

- **Draft Status**: All newly created content starts in PENDING status
- **Approval Process**: Admin-only approval with automatic timestamp recording
- **Re-approval**: Edited approved content returns to PENDING status for re-review
- **Edit History**: Complete audit trail of all edits including user, timestamp, and changed fields

### 3.7 Categories, Tags & SEO

- **Categories**: Optional categorization for organizing content
- **Tags**: Array-based tagging system for content classification
- **Summary**: Optional summary field for meta descriptions
- **Featured Image**: Image URL support for visual content representation

### 3.8 Media Management

- **Image Upload**: Secure file upload endpoint accepting JPEG, PNG, GIF, and WebP formats
- **File Validation**: MIME type and file size validation (max 10MB)
- **File Storage**: Local file storage with timestamped, sanitized filenames
- **File Security**: Filename sanitization to prevent security vulnerabilities

### 3.9 Analytics & Engagement Tracking

- **Dashboard Statistics**: Real-time counts of blogs and newsletters by status
- **User Statistics**: Admin-only view of user counts and status distribution
- **Activity Logs**: Comprehensive audit log of all system actions with filtering capabilities
- **Recent Activity Feed**: Last 10 activities displayed on dashboard
- **Role-Based Analytics**: Filtered statistics based on user role

### 3.10 Configuration & Settings

- **User Management**: Admin-only user creation, editing, and deletion
- **Profile Management**: Users can view and update their own profile information
- **Environment Configuration**: Environment variable-based configuration for database, JWT secrets, CORS, and file uploads
- **System Settings**: Configurable timeouts, rate limits, and security policies

--------------------------------------------------

## 4. FUNCTIONAL REQUIREMENTS

--------------------------------------------------

### 4.1 Priority-Based Requirements

| Priority | Requirement | Description |
|----------|-------------|-------------|
| P1 | User Authentication | Secure login, registration, session management, password reset |
| P1 | Role-Based Access Control | ADMIN and MARKETING_MANAGER roles with appropriate permissions |
| P1 | Blog CRUD Operations | Create, read, update, delete blogs with validation |
| P1 | Newsletter CRUD Operations | Create, read, update, delete newsletters with validation |
| P1 | Content Approval Workflow | Status management (PENDING, APPROVED, REJECTED, DISABLED) |
| P1 | Rich Text Editor | WYSIWYG editor for content creation and editing |
| P1 | File Upload | Secure image upload with validation |
| P1 | Public API Endpoints | Public access to approved content without authentication |
| P2 | AI Content Generation | Generate blog/newsletter content using AI service integration |
| P2 | Edit History Tracking | Track all content changes with user and timestamp information |
| P2 | Search & Filter | Full-text search and status/creator filtering |
| P2 | Bulk Operations | Bulk status updates for multiple content items |
| P2 | Activity Logging | Comprehensive audit log of all system actions |
| P2 | Dashboard Analytics | Statistics and metrics dashboard |
| P3 | User Management | Admin interface for managing user accounts |
| P3 | Profile Management | User profile viewing and editing |
| P3 | Pagination | Paginated lists for blogs, newsletters, and users |

### 4.2 Detailed User Flows

#### Blog Publish Flow

1. Marketing Manager logs into admin panel
2. Navigates to Blogs section
3. Clicks "Create Blog" or uses AI generation
4. Fills in blog details (title, content, summary, tags, category, image)
5. Saves blog → Status set to PENDING
6. Admin reviews blog in admin panel
7. Admin approves blog → Status changes to APPROVED, `publishedAt` timestamp set
8. Blog becomes available through public API endpoint
9. Public users can now access approved blog

#### Newsletter Send Flow

1. Marketing Manager creates newsletter with content
2. Newsletter saved with PENDING status
3. Admin reviews and approves newsletter
4. Newsletter becomes available through public API
5. External systems consume newsletter via public endpoint for distribution

#### Content Edit Flow

1. User opens existing blog/newsletter for editing
2. Makes changes to content fields
3. System tracks changed fields and updates edit history
4. If content is APPROVED, status changes to PENDING (requires re-approval)
5. User saves changes → Edit history updated with user info and timestamp
6. Admin must re-approve edited content before it's published again

#### Approval Workflow

1. Admin views list of PENDING content
2. Admin opens content for review
3. Admin can:
   - Approve → Status: APPROVED, sets `publishedAt`, records approver
   - Reject → Status: REJECTED, records rejection reason
   - Disable → Status: DISABLED (hides from public, preserves history)
4. Activity logged with admin information and timestamp

--------------------------------------------------

## 5. NON-FUNCTIONAL REQUIREMENTS

--------------------------------------------------

### 5.1 Performance

- **API Response Time**: 95% of API requests should respond within 500ms
- **Page Load Time**: Initial page load should complete within 2 seconds
- **Database Query Performance**: Complex queries with joins should execute within 200ms
- **File Upload**: Image uploads (up to 10MB) should complete within 5 seconds
- **AI Generation**: AI content generation requests should timeout after 30 seconds with graceful error handling
- **Concurrent Users**: System should support 100+ concurrent authenticated users

### 5.2 Security

- **Authentication**: JWT-based authentication with refresh tokens
- **Password Security**: Bcrypt hashing with 12 rounds, strong password requirements (8+ chars, uppercase, lowercase, number, special char)
- **Rate Limiting**: Login endpoint limited to 5 attempts per 15 minutes; API endpoints limited to 100 requests per 15 minutes
- **CORS**: Configurable allowed origins via environment variables
- **Input Validation**: All inputs validated using Zod schemas
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Prevention**: Input sanitization and proper HTML encoding
- **HTTP Security Headers**: Helmet middleware configured for security headers

### 5.3 Availability

- **Uptime Target**: 99% uptime during business hours (8 AM - 8 PM, Monday-Friday)
- **Error Handling**: Graceful error handling with user-friendly messages
- **Database Connection**: Connection pooling and retry logic for database connectivity
- **Service Degradation**: System should remain functional if non-critical services (AI generation) are unavailable

### 5.4 Scalability

- **Database Scaling**: Database indexes on frequently queried fields (status, createdAt, createdById)
- **Caching**: React Query caching with appropriate cache invalidation strategies
- **Pagination**: All list endpoints support pagination to handle large datasets
- **File Storage**: Scalable file storage architecture ready for cloud migration

### 5.5 Usability & Accessibility

- **Responsive Design**: Mobile, tablet, and desktop support
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Error Messages**: Clear, actionable error messages for users
- **Loading States**: Visual feedback during async operations
- **Form Validation**: Real-time validation with inline error messages

--------------------------------------------------

## 6. CONSTRAINTS

--------------------------------------------------

### 6.1 Technical Constraints

- **Frontend Framework**: React 18+ with TypeScript
- **Backend Runtime**: Node.js 18+ with Express.js
- **Database**: PostgreSQL 15+ (via Prisma ORM)
- **Authentication**: JWT tokens (no OAuth or third-party auth providers)
- **File Storage**: Local file system (not cloud storage in v1.0)
- **AI Integration**: External webhook-based AI service (not integrated AI models)
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)

### 6.2 Business Constraints

- **Budget**: No additional third-party service subscriptions beyond existing AI webhook
- **Timeline**: MVP delivery within defined sprint cycles
- **Team Size**: Limited development resources (single full-stack developer)
- **Design Resources**: Reuse existing design system and components

### 6.3 Integration Constraints

- **Email Service**: Password reset emails not implemented in v1.0 (tokens logged in development)
- **Analytics**: Basic dashboard statistics only; no advanced analytics tools
- **CMS Integration**: Standalone system; no integration with external CMS platforms
- **Newsletter Distribution**: Public API only; no built-in email sending functionality

--------------------------------------------------

## 7. SYSTEM ARCHITECTURE

--------------------------------------------------

### 7.1 Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **State Management**: 
  - React Query (TanStack Query) for server state
  - React Context API for authentication state
- **Form Management**: React Hook Form with Zod validation
- **UI Components**: shadcn/ui component library
- **Styling**: Tailwind CSS
- **Rich Text Editor**: React Quill
- **HTTP Client**: Axios with interceptors

**Architecture Pattern:**
- Component-based architecture with separation of concerns
- Page-level components for routes
- Reusable UI components in component library
- Service layer for API interactions
- Context providers for global state (authentication)

### 7.2 Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js 18+ with Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15+
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **File Upload**: express-fileupload
- **Security**: Helmet, CORS, express-rate-limit
- **HTTP Client**: Axios (for AI service integration)

**Architecture Pattern:**
- RESTful API design
- Route-based organization
- Middleware for authentication, logging, rate limiting
- Service layer abstraction for business logic
- Error handling middleware

### 7.3 Database Schema

**Core Models:**
- **User**: Authentication, roles, profile information
- **Blog**: Content, metadata, status, relationships
- **Newsletter**: Content, metadata, status, relationships
- **ActivityLog**: Audit trail of all system actions

**Key Relationships:**
- User → Blog (createdBy, approvedBy)
- User → Newsletter (createdBy, approvedBy)
- User → ActivityLog (userId)

**Status Enums:**
- ContentStatus: PENDING, APPROVED, REJECTED, DISABLED
- UserStatus: ACTIVE, INACTIVE, SUSPENDED

### 7.4 Configuration Management

- **Environment Variables**: All configuration via `.env` files
- **Secrets Management**: JWT secrets, database credentials in environment variables
- **Environment-Specific**: Separate configs for development, staging, production
- **Type Safety**: TypeScript ensures configuration correctness
- **Validation**: Runtime validation of required environment variables

--------------------------------------------------

## 8. SECURITY & COMPLIANCE

--------------------------------------------------

### 8.1 Authentication & Authorization

- **JWT Tokens**: Access tokens with short expiration, refresh tokens with longer expiration
- **Token Storage**: Refresh tokens in HTTP-only cookies, access tokens in memory
- **Password Hashing**: Bcrypt with 12 rounds, never stored in plain text
- **Account Lockout**: Automatic lockout after 5 failed login attempts (30-minute duration)
- **Session Management**: 7-day session persistence with automatic token refresh

### 8.2 API Security

- **Rate Limiting**: Login endpoint (5 req/15min), general API (100 req/15min)
- **CORS**: Whitelist-based CORS configuration
- **Input Validation**: All inputs validated with Zod schemas before processing
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Prevention**: Input sanitization, output encoding
- **File Upload Security**: MIME type validation, file size limits, filename sanitization

### 8.3 Data Protection

- **Sensitive Data**: Passwords hashed, tokens signed with secrets
- **Data Encryption**: HTTPS enforced in production
- **Access Control**: Role-based access control on all protected endpoints
- **Audit Logging**: All sensitive operations logged with user, IP, and timestamp

### 8.4 Content Access Control

- **Role-Based Permissions**: 
  - ADMIN: Full access to all content and operations
  - MARKETING_MANAGER: Create and edit all content, cannot approve or delete approved content
- **Content Isolation**: Users can see all content but permissions enforced on actions
- **Public vs Internal**: Separate endpoints for public (no auth) and internal (auth required) access

### 8.5 Compliance Considerations

- **Privacy**: No PII collected beyond necessary user account information
- **Data Retention**: Activity logs retained for audit purposes
- **Email Regulations**: Public API only; newsletter distribution handled by external systems (not in scope)
- **GDPR Considerations**: User data access and deletion capabilities (future enhancement)

--------------------------------------------------

## 9. DEPENDENCIES

--------------------------------------------------

### 9.1 External Services

- **AI Content Generation Service**: Webhook-based service at `http://54.88.119.163:5679` for content generation
  - Blog generation webhook
  - Newsletter generation webhook
  - Field-specific regeneration webhooks
  - Dependency: Service must be available and responding within 30-second timeout

### 9.2 Internal Dependencies

- **PostgreSQL Database**: Required for all data persistence
- **File System**: Local file storage for uploaded images

### 9.3 Development Dependencies

- **Node.js**: Version 18 or higher
- **npm/yarn**: Package manager for dependency management
- **Prisma CLI**: Database migrations and client generation
- **TypeScript**: Type checking and compilation

### 9.4 Third-Party Libraries

- **Frontend**: React, React Router, React Query, React Hook Form, Zod, Axios, React Quill, Tailwind CSS
- **Backend**: Express, Prisma, JWT, bcrypt, Zod, express-fileupload, Helmet, CORS, express-rate-limit

--------------------------------------------------

## 10. RISKS & MITIGATIONS

--------------------------------------------------

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| AI Service Unavailability | High | Medium | Graceful degradation; error handling with user-friendly messages; content creation still possible without AI |
| Database Performance Issues | High | Low | Database indexing on key fields; query optimization; connection pooling; monitoring and alerting |
| Security Breach | Critical | Low | Strong password requirements; JWT security; rate limiting; input validation; security headers; regular security audits |
| Data Loss | Critical | Low | Database backups; transaction support in Prisma; error handling prevents partial updates |
| Scalability Limitations | Medium | Medium | Pagination implemented; caching strategy; database indexes; architecture supports horizontal scaling |
| User Adoption Issues | Medium | Medium | Intuitive UI/UX; comprehensive documentation; training materials; responsive support |
| Integration Failures | Medium | Low | Error handling; timeout mechanisms; fallback behaviors; comprehensive logging |
| Browser Compatibility | Low | Low | Modern browser support only; testing across browsers; progressive enhancement |

--------------------------------------------------

## 11. USER STORIES

--------------------------------------------------

### 11.1 Admin User Stories

1. **As an admin**, I want to approve or reject content so I can control what gets published.
2. **As an admin**, I want to view all content regardless of status so I have complete visibility.
3. **As an admin**, I want to manage user accounts so I can control team access.
4. **As an admin**, I want to view activity logs so I can audit system usage.
5. **As an admin**, I want to bulk update content status so I can efficiently manage multiple items.
6. **As an admin**, I want to see dashboard statistics so I understand content pipeline health.

### 11.2 Marketing Manager User Stories

1. **As a marketing manager**, I want to create blog posts so I can publish content to our audience.
2. **As a marketing manager**, I want to use AI to generate content so I can create content faster.
3. **As a marketing manager**, I want to edit my content so I can refine it before submission.
4. **As a marketing manager**, I want to see the status of my content so I know what needs attention.
5. **As a marketing manager**, I want to search and filter content so I can find specific posts quickly.
6. **As a marketing manager**, I want to view edit history so I can track changes made to content.

### 11.3 Operations / UAT User Stories

1. **As an operations user**, I want to validate blog content before release so quality standards are met.
2. **As an operations user**, I want to validate newsletter content so communication quality is maintained.
3. **As an operations user**, I want to see content approval status so I know what's ready for release.
4. **As an operations user**, I want to review content in a readable format so I can provide feedback.

### 11.4 General User Stories

1. **As a user**, I want to log in securely so I can access the admin panel.
2. **As a user**, I want my session to persist so I don't have to log in repeatedly.
3. **As a user**, I want to reset my password so I can regain access if I forget it.
4. **As a user**, I want to see my profile information so I can verify my account details.
5. **As a user**, I want to see loading indicators so I know when operations are in progress.
6. **As a user**, I want clear error messages so I can fix issues quickly.

--------------------------------------------------

## 12. TECHNICAL SPECIFICATIONS

--------------------------------------------------

### 12.1 API Specifications

#### Authentication Endpoints

```
POST /api/auth/register - Register new user (admin only after first user)
POST /api/auth/login - User login
POST /api/auth/logout - User logout
POST /api/auth/refresh - Refresh access token
GET /api/auth/me - Get current user
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password - Reset password with token
POST /api/auth/change-password - Change password (authenticated)
```

#### Blog Endpoints

```
GET /api/blogs - Get all blogs with filters (public)
GET /api/blogs/:id - Get single blog with details (public)
POST /api/blogs - Create blog (authenticated)
PATCH /api/blogs/:id - Update blog (authenticated)
DELETE /api/blogs/:id - Delete blog (admin only)
PATCH /api/blogs/:id/status - Update blog status (admin only)
PATCH /api/blogs/bulk/status - Bulk update blog status (admin only)
```

#### Newsletter Endpoints

```
GET /api/newsletters - Get all newsletters with filters (public)
GET /api/newsletters/:id - Get single newsletter with details (public)
POST /api/newsletters - Create newsletter (authenticated)
PATCH /api/newsletters/:id - Update newsletter (authenticated)
DELETE /api/newsletters/:id - Delete newsletter (admin only)
PATCH /api/newsletters/:id/status - Update newsletter status (admin only)
PATCH /api/newsletters/bulk/status - Bulk update newsletter status (admin only)
```

#### AI Generation Endpoints

```
POST /api/generate-content - Generate blog content (authenticated)
POST /api/generate-content/regenerate - Regenerate blog field (authenticated)
POST /api/generate-newsletter-content - Generate newsletter content (authenticated)
POST /api/generate-newsletter-content/regenerate - Regenerate newsletter field (authenticated)
```

#### User Management Endpoints

```
GET /api/users - Get all users (admin only)
GET /api/users/:id - Get single user (admin only)
POST /api/users - Create user (admin only)
PATCH /api/users/:id - Update user (admin only)
DELETE /api/users/:id - Delete user (admin only)
POST /api/users/:id/reset-password - Reset user password (admin only)
```

#### File Upload Endpoints

```
POST /api/upload - Upload image file (authenticated)
```

#### Analytics Endpoints

```
GET /api/analytics/dashboard - Get dashboard statistics (authenticated)
GET /api/analytics/activity-logs - Get activity logs (admin only)
```

### 12.2 Data Models

#### User Model
```typescript
{
  id: string (UUID)
  email: string (unique)
  password: string (hashed)
  firstName: string
  lastName: string
  role: 'ADMIN' | 'MARKETING_MANAGER'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  avatar?: string
  lastLogin?: DateTime
  failedLoginAttempts: number
  lockedUntil?: DateTime
  passwordResetToken?: string
  passwordResetExpires?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Blog Model
```typescript
{
  id: string (UUID)
  title: string (max 200 chars)
  content: string (Text)
  summary?: string (max 500 chars)
  category?: string
  tags: string[]
  author?: string
  image?: string (URL)
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED'
  createdById: string (FK to User)
  approvedById?: string (FK to User)
  lastEditedBy?: string
  lastEditedAt?: DateTime
  editHistory?: JSON
  createdAt: DateTime
  updatedAt: DateTime
  publishedAt?: DateTime
}
```

#### Newsletter Model
```typescript
{
  id: string (UUID)
  title: string (max 200 chars)
  content: string (Text)
  summary?: string (max 500 chars)
  category?: string
  tags: string[]
  image?: string (URL)
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED'
  createdById: string (FK to User)
  approvedById?: string (FK to User)
  lastEditedBy?: string
  lastEditedAt?: DateTime
  editHistory?: JSON
  createdAt: DateTime
  updatedAt: DateTime
  publishedAt?: DateTime
}
```

#### ActivityLog Model
```typescript
{
  id: string (UUID)
  userId: string (FK to User)
  action: string
  entityType?: string
  entityId?: string
  details?: JSON
  ipAddress?: string
  userAgent?: string
  createdAt: DateTime
}
```

### 12.3 State Management

**Frontend State Architecture:**
- **Server State**: React Query manages all API data with caching and invalidation
- **Auth State**: React Context provides authentication state globally
- **Local State**: React useState for component-specific UI state
- **Form State**: React Hook Form manages form state and validation

**State Flow:**
1. User action triggers API call via service function
2. React Query handles request, caching, and error states
3. UI updates reactively based on query state
4. Cache invalidation on mutations ensures fresh data

### 12.4 Configuration Structure

**Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/blog_admin

# JWT
JWT_SECRET=secret-key
JWT_REFRESH_SECRET=refresh-secret-key

# Server
PORT=5000
NODE_ENV=development|production

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# AI Service
AI_WEBHOOK_TIMEOUT=30000
AI_WEBHOOK_URL=http://example.com/webhook
```

--------------------------------------------------

## 13. ACCEPTANCE CRITERIA

--------------------------------------------------

### 13.1 Blog Management

- ✅ User can create a blog with all required fields (title, content)
- ✅ Blog is created with PENDING status by default
- ✅ User can view paginated list of blogs with filters
- ✅ User can view detailed blog information including edit history
- ✅ Authorized users can edit blogs with edit history tracking
- ✅ Admin can approve/reject/disable blogs
- ✅ Admin can perform bulk status updates
- ✅ Approved blogs are accessible via public API endpoint
- ✅ Search functionality works across title, content, and summary

### 13.2 Newsletter Publishing

- ✅ Newsletter creation follows same workflow as blogs
- ✅ Newsletter approval process matches blog approval
- ✅ Approved newsletters available through public API
- ✅ Newsletter edit history tracked similarly to blogs

### 13.3 Approval Workflow

- ✅ All new content starts in PENDING status
- ✅ Only ADMIN role can change content status
- ✅ Approval sets publishedAt timestamp and records approver
- ✅ Rejection records status change in activity log
- ✅ Editing approved content returns it to PENDING status
- ✅ Bulk approval operations work for multiple items

### 13.4 AI Content Generation

- ✅ AI generation endpoint accepts blog/newsletter ideas
- ✅ Generated content includes title, content, summary, and tags
- ✅ Field-specific regeneration works with custom prompts
- ✅ Timeout handling prevents indefinite waits
- ✅ Error handling for AI service unavailability

### 13.5 Analytics

- ✅ Dashboard displays blog statistics by status
- ✅ Dashboard displays newsletter statistics by status
- ✅ Admin sees user statistics
- ✅ Recent activity log shows last 10 activities
- ✅ Activity logs page supports filtering and pagination

### 13.6 Security & Permissions

- ✅ Authentication required for all admin panel endpoints
- ✅ Role-based access control enforced on all operations
- ✅ Password strength requirements enforced
- ✅ Rate limiting prevents brute force attacks
- ✅ JWT tokens expire appropriately
- ✅ Activity logging captures all sensitive operations

--------------------------------------------------

## 14. OUT OF SCOPE (CURRENT VERSION)

--------------------------------------------------

The following features are explicitly excluded from version 1.0.0:

1. **Email Sending**: No built-in email distribution for newsletters; public API only
2. **Scheduled Publishing**: No ability to schedule content for future publication
3. **Content Versioning**: No version comparison or rollback capabilities beyond edit history
4. **Multi-language Support**: English-only content
5. **Content Templates**: No pre-defined templates for blogs/newsletters
6. **Social Media Integration**: No automatic posting to social platforms
7. **Advanced Analytics**: No page views, engagement metrics, or conversion tracking
8. **Content Collaboration**: No real-time collaborative editing or comments
9. **Workflow Customization**: Fixed approval workflow (no custom workflows)
10. **Content Import/Export**: No bulk import or export functionality
11. **Rich Media Management**: Only image uploads; no video or other media types
12. **SEO Tools**: Basic summary field only; no advanced SEO optimization tools
13. **Content Scheduling**: No ability to schedule content publication dates
14. **Email Notifications**: No email notifications for approvals or status changes
15. **Advanced Search**: No faceted search or advanced search operators

--------------------------------------------------

## 15. FUTURE ENHANCEMENTS

--------------------------------------------------

### Phase 2 (Planned)

1. **Content Scheduling**: Schedule blogs and newsletters for future publication
2. **Email Distribution**: Built-in email sending for newsletters with subscriber management
3. **Advanced Analytics**: Page views, engagement metrics, and content performance tracking
4. **Content Templates**: Pre-defined templates for common content types
5. **Rich Media Library**: Expanded media management with video and document support
6. **Content Versioning**: Version comparison and rollback capabilities
7. **Email Notifications**: Automated email notifications for approval requests and status changes
8. **Bulk Import/Export**: CSV/JSON import and export for content migration
9. **Advanced Search**: Faceted search with filters and saved searches
10. **Content Comments**: Internal commenting system for content review

### Phase 3 (Future)

1. **Multi-language Support**: Internationalization and multi-language content management
2. **Social Media Integration**: Automatic posting to social media platforms
3. **Workflow Customization**: Configurable approval workflows with multiple approvers
4. **Content Collaboration**: Real-time collaborative editing with conflict resolution
5. **SEO Optimization Tools**: Built-in SEO analysis and optimization recommendations
6. **AI Content Suggestions**: Proactive AI suggestions for content improvements
7. **Content Analytics Dashboard**: Advanced visualization and reporting
8. **API Webhooks**: Webhook notifications for content status changes
9. **Content Syndication**: RSS feeds and content syndication capabilities
10. **Advanced Permissions**: Granular permission system with custom roles

--------------------------------------------------

## 16. DEPLOYMENT & ENVIRONMENTS

--------------------------------------------------

### 16.1 Environments

#### Development
- **Purpose**: Local development and testing
- **Database**: Local PostgreSQL instance
- **File Storage**: Local `./uploads` directory
- **AI Service**: Development/staging AI webhook endpoints
- **URL**: `http://localhost:5173` (frontend), `http://localhost:5000` (backend)
- **Configuration**: `.env.development` file

#### Staging / UAT
- **Purpose**: User acceptance testing and pre-production validation
- **Database**: Staging PostgreSQL instance (separate from production)
- **File Storage**: Staging file storage directory
- **AI Service**: Staging AI webhook endpoints
- **URL**: TBD (staging domain)
- **Configuration**: Environment variables configured in hosting platform
- **Access**: Limited to UAT team and stakeholders

#### Production
- **Purpose**: Live system for end users
- **Database**: Production PostgreSQL instance with backups
- **File Storage**: Production file storage (consider cloud migration)
- **AI Service**: Production AI webhook endpoints
- **URL**: TBD (production domain)
- **Configuration**: Secure environment variables (secrets management)
- **SSL/TLS**: HTTPS enforced
- **Monitoring**: Application monitoring and error tracking

### 16.2 CI/CD Expectations

- **Source Control**: Git-based version control
- **Branching Strategy**: Feature branches, main/master for production
- **Automated Testing**: Unit tests and integration tests run on pull requests
- **Build Process**: Automated builds for frontend and backend
- **Deployment**: Automated deployment to staging; manual approval for production
- **Database Migrations**: Prisma migrations applied as part of deployment process
- **Environment Variables**: Managed securely through hosting platform

### 16.3 Environment Variables

All environment-specific configuration managed through environment variables:

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for access token signing
- `JWT_REFRESH_SECRET` - Secret for refresh token signing
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)

**Optional Variables:**
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)
- `UPLOAD_DIR` - File upload directory (default: ./uploads)
- `MAX_FILE_SIZE` - Maximum file size in bytes (default: 10485760)
- `AI_WEBHOOK_TIMEOUT` - AI service timeout in ms (default: 30000)

--------------------------------------------------

## 17. TESTING STRATEGY

--------------------------------------------------

### 17.1 Unit Testing

**Frontend:**
- Component rendering tests
- Hook testing (custom hooks)
- Utility function testing
- Form validation testing

**Backend:**
- Route handler testing
- Middleware testing
- Service function testing
- Utility function testing
- Validation schema testing

**Coverage Target**: Minimum 70% code coverage

### 17.2 Integration Testing

**API Integration Tests:**
- End-to-end API endpoint testing
- Authentication flow testing
- Database interaction testing
- File upload testing
- Error handling testing

**Database Integration:**
- Prisma query testing
- Transaction testing
- Relationship testing

### 17.3 End-to-End Testing

**Critical User Flows:**
1. User registration and login flow
2. Blog creation and approval workflow
3. Newsletter creation and approval workflow
4. Content editing and re-approval flow
5. User management flow (admin)
6. AI content generation flow
7. File upload flow
8. Search and filter functionality

**Tools**: Consider Cypress or Playwright for E2E testing

### 17.4 Manual Testing Checklist

**Authentication:**
- [ ] User registration (first user and subsequent)
- [ ] User login with valid credentials
- [ ] Login with invalid credentials
- [ ] Password reset flow
- [ ] Password change flow
- [ ] Session persistence
- [ ] Token refresh
- [ ] Logout functionality

**Blog Management:**
- [ ] Create blog with all fields
- [ ] Create blog with required fields only
- [ ] View blog list with pagination
- [ ] Filter blogs by status
- [ ] Search blogs by title/content
- [ ] View single blog details
- [ ] Edit blog
- [ ] Delete blog (admin)
- [ ] Approve blog (admin)
- [ ] Reject blog (admin)
- [ ] Bulk status update
- [ ] AI blog generation

**Newsletter Management:**
- [ ] All newsletter operations (same as blog checklist)

**User Management (Admin):**
- [ ] Create user
- [ ] View user list
- [ ] Update user
- [ ] Delete user
- [ ] Reset user password

**Analytics:**
- [ ] Dashboard statistics display
- [ ] Activity log viewing
- [ ] Activity log filtering

**Security:**
- [ ] Role-based access control
- [ ] Rate limiting
- [ ] Input validation
- [ ] File upload validation

--------------------------------------------------

## 18. DOCUMENTATION

--------------------------------------------------

### 18.1 Code Documentation

- **Inline Comments**: Complex logic explained with comments
- **JSDoc/TSDoc**: Function and class documentation
- **README Files**: Setup and usage instructions in root directories
- **API Documentation**: Endpoint documentation with request/response examples

### 18.2 User Documentation

- **User Guide**: Step-by-step guides for common tasks
  - Creating and editing blogs
  - Creating and editing newsletters
  - Approving content (admin)
  - Managing users (admin)
- **FAQ**: Common questions and answers
- **Video Tutorials**: Screen recordings for complex workflows (optional)

### 18.3 Developer Documentation

- **Setup Guide**: Local development environment setup
- **Architecture Documentation**: System architecture and design decisions
- **API Reference**: Complete API endpoint documentation
- **Database Schema**: ERD and model relationships
- **Deployment Guide**: Deployment procedures and checklists
- **Contributing Guide**: Code style, branching strategy, pull request process

--------------------------------------------------

## 19. SUPPORT & MAINTENANCE

--------------------------------------------------

### 19.1 Monitoring

- **Application Monitoring**: Error tracking and performance monitoring
- **Database Monitoring**: Query performance and connection pool monitoring
- **Log Aggregation**: Centralized logging for debugging
- **Uptime Monitoring**: External uptime checks for availability

### 19.2 Maintenance

- **Regular Updates**: Dependency updates and security patches
- **Database Maintenance**: Regular backups and optimization
- **Performance Optimization**: Continuous performance monitoring and optimization
- **Security Audits**: Regular security reviews and penetration testing

### 19.3 Support Channels

- **Issue Tracking**: GitHub Issues or similar for bug reports and feature requests
- **Documentation**: Comprehensive documentation as first line of support
- **Escalation Path**: Defined escalation process for critical issues

### 19.4 Backup & Recovery

- **Database Backups**: Daily automated backups with retention policy
- **File Backups**: Regular backups of uploaded files
- **Recovery Procedures**: Documented recovery procedures for disaster scenarios

--------------------------------------------------

## 20. VERSION HISTORY

--------------------------------------------------

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-XX | Raghav Thakkar | Initial PRD release |

--------------------------------------------------

## 21. APPENDIX

--------------------------------------------------

### 21.1 Glossary

- **ADMIN**: User role with full system access including content approval and user management
- **MARKETING_MANAGER**: User role with content creation and editing capabilities
- **PENDING**: Content status indicating content is awaiting approval
- **APPROVED**: Content status indicating content is approved and published
- **REJECTED**: Content status indicating content was rejected by admin
- **DISABLED**: Content status indicating content is hidden but not deleted
- **JWT**: JSON Web Token used for authentication
- **RBAC**: Role-Based Access Control
- **WYSIWYG**: What You See Is What You Get (rich text editor)
- **CRUD**: Create, Read, Update, Delete operations
- **API**: Application Programming Interface
- **ORM**: Object-Relational Mapping (Prisma in this case)
- **CORS**: Cross-Origin Resource Sharing
- **XSS**: Cross-Site Scripting attack
- **SQL Injection**: Database injection attack

### 21.2 References

- React Documentation: https://react.dev/
- Prisma Documentation: https://www.prisma.io/docs
- Express.js Documentation: https://expressjs.com/
- JWT Best Practices: Industry standard JWT implementation guidelines
- OWASP Security Guidelines: Web application security best practices
- RESTful API Design: Industry standard REST API design principles
- TypeScript Documentation: https://www.typescriptlang.org/docs/

### 21.3 Acronyms

- **PRD**: Product Requirements Document
- **MVP**: Minimum Viable Product
- **UAT**: User Acceptance Testing
- **CI/CD**: Continuous Integration / Continuous Deployment
- **PII**: Personally Identifiable Information
- **GDPR**: General Data Protection Regulation
- **HTTPS**: Hypertext Transfer Protocol Secure
- **SSL/TLS**: Secure Sockets Layer / Transport Layer Security

---

**Document End**


