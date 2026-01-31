# AssetFlow - Tenant-Based Asset & Product Management Software

## Original Problem Statement
Create a tenant-based asset and product management software with:
- Standard industry fields for assets and products
- Ability to create additional custom fields
- Library for fields, Colors, Sizes, Suppliers, and Buyers
- Ability to convert asset into product
- AI-based data generation for attributes
- Forms that govern layout of attributes and subforms
- Admin area for system settings and organization management
- Sub forms for BOM and Measurement charts

## User Personas
1. **Admin User**: Manages organization, users, and system settings
2. **Product Manager**: Creates and manages assets/products, defines custom fields
3. **Team Member**: Views and edits assets/products within assigned scope

## Architecture
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React with Shadcn/UI components
- **Auth**: JWT-based with multi-tenant isolation
- **Database**: Separate MongoDB database per tenant
- **AI**: Emergent LLM integration (GPT-5.2) for attribute generation and image analysis

## Core Requirements (Implemented)
- [x] Multi-tenant architecture with database-per-tenant isolation
- [x] JWT authentication and authorization
- [x] Assets management with CRUD operations
- [x] Products management with CRUD operations
- [x] Materials library with CRUD operations
- [x] Convert Asset to Product workflow
- [x] Libraries: Colors, Sizes, Custom Fields, Suppliers, Buyers
- [x] Form Builder for custom layouts
- [x] AI-powered description/SKU generation
- [x] AI-powered image analysis for asset creation
- [x] Dashboard with statistics
- [x] Admin settings and user management
- [x] Detail pages for Assets, Products, Materials
- [x] Media upload functionality

## What's Been Implemented (Jan 31, 2026)
- Complete backend API with 40+ endpoints
- Full frontend with 15+ pages
- Multi-tenant database isolation
- JWT authentication flow with proper token handling
- All library CRUD operations
- Asset to Product conversion
- AI integration for attribute generation and image analysis
- Form builder for custom layouts
- Dashboard with real-time stats
- User and organization management
- Detail pages with full-screen view support
- Media upload panel
- **Full-screen detail pages with "Open in New Tab" option**
- **Slide-out sidebar navigation on detail pages**
- **Ctrl/Cmd+Click support to open items in new tabs**

## Bug Fixes Applied (Jan 31, 2026)
1. **Backend Validation Errors**: Fixed Pydantic models to have default values for all fields, ensuring backward compatibility with older database records
2. **Authentication Issues**: Fixed AuthContext to use axios interceptors for token handling, preventing race conditions
3. **SelectItem Empty Value**: Fixed React SelectItem components to use placeholder value instead of empty string

## API Endpoints
### Authentication
- `POST /api/auth/register` - Register new user and organization
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Core Entities
- `/api/assets` - CRUD for assets
- `/api/products` - CRUD for products
- `/api/materials` - CRUD for materials
- `POST /api/assets/{id}/convert-to-product` - Convert asset to product

### Libraries
- `/api/colors`, `/api/sizes`, `/api/custom-fields`
- `/api/suppliers`, `/api/buyers`
- `/api/divisions`, `/api/product-types`, `/api/seasons`

### Admin
- `/api/form-layouts` - Manage form layouts
- `/api/settings` - System settings
- `/api/users` - User management
- `/api/dashboard/stats` - Dashboard statistics

### AI & Upload
- `POST /api/ai/generate` - Generate AI content
- `POST /api/upload/media` - Upload media files
- `POST /api/upload/image-analyze` - Upload and AI-analyze image

## Test Credentials
- Email: testfix@example.com
- Password: test123

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- All core features implemented and tested

### P1 (Important) - UPCOMING
- [ ] Full-screen detail pages with new tab option
- [ ] Enhanced Media Upload Panel (drag-drop, copy-paste, multi-file)
- [ ] Product sub-tabs (Colors, Sizes, SKU Codes, Barcodes)

### P2 (Nice to Have)
- [ ] BOM (Bill of Materials) subform
- [ ] Measurement charts subform
- [ ] Bulk import/export functionality
- [ ] Advanced search and filtering
- [ ] `.ai` file processing (artboard extraction)

### P3 (Future)
- [ ] Role-based permissions (beyond admin/user)
- [ ] Audit trail/activity log
- [ ] Custom reports and analytics
- [ ] Email notifications

## Tech Notes
- Frontend babel plugin workaround: `REACT_APP_DISABLE_VISUAL_EDIT_PLUGIN=true` in `.env`
- Backend uses motor (async MongoDB driver)
- All response models use Pydantic with ConfigDict(extra="ignore")
- AI features use Emergent LLM Key (Universal Key)
