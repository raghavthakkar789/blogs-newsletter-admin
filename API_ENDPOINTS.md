# API Endpoints

## Blogs
GET    /api/blogs
GET    /api/blogs/:id
POST   /api/blogs
PATCH  /api/blogs/:id
DELETE /api/blogs/:id
PATCH  /api/blogs/:id/status
PATCH  /api/blogs/bulk/status

## Newsletters
GET    /api/newsletters
GET    /api/newsletters/:id
POST   /api/newsletters
PATCH  /api/newsletters/:id
DELETE /api/newsletters/:id
PATCH  /api/newsletters/:id/status
PATCH  /api/newsletters/bulk/status

## Upload
POST   /api/upload?folder=blogs
POST   /api/upload?folder=newsletters

## Generate Content - Blog
POST   /api/generate-blog-content
POST   /api/generate-blog-content/regenerate

## Generate Content - Newsletter
POST   /api/generate-newsletter-content
POST   /api/generate-newsletter-content/regenerate

## Analytics
GET    /api/analytics/dashboard
GET    /api/analytics/activity-logs

## Health
GET    /api/health

