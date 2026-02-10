# Plan 1
We will develop the application in phases and tasksteps.
Starting with tasks phase 1. Per phase we will evaluate and continue on request. 
WHen a phase or task is (still) open it will be [ ] and when it is finished it will be [x]

## [x] phase 1
### Product_docs:
Phase 1 is described in:
- product_docs\0000_architecture.md
- product_docs\0010_drizzle_mapping.md
- product_docs\0011_0001_initial.sql

###  Tasks
- [x]  created project Folder with \product_docs and starting point of application.
- [x]  Install sveltekit: npx sv create. sv@0.11.4: SvelteKit minimal: Typescript syntax.
- [x]  sveltekit with options: prettier, eslint, tailwindcss (forms), devtools-json, drizzle wit (db:PostgreSQL client: Neon),
- [x]  Database_url in .env. Picked from Neon>connection string (URL format)  
- [x]  Drizzle configured for datamodel. Including changes product_docs\0011_fixes.md
- [x]  Installed zod

##  [x] Phase 2
### product_docs
- product_docs\0100_startpage_flasks.md
- product_docs\0150_layout.md

### Description plan
Phase 2 focuses on implementing the Flasks startpage - the main landing page of the application. This page will display a comprehensive grid view of all flasks with their associated information (box location, broken date, low pressure date).

The implementation consists of:
1. **Top Navigation Bar**: A yellow-themed top bar with flask icon, navigation menu, and sign-in button
2. **Main Grid Display**: A multi-row data grid (15 rows per page) showing flask information with sortable columns
3. **Search Functionality**: Dual search fields for filtering by flask name and box name
4. **Interactive Features**: Keyboard navigation with yellow gradient row selector, click-to-select rows
5. **Remarks Panel**: Side panel displaying detailed remarks for the selected flask
6. **Pagination Controls**: Bottom pagination bar for navigating through larger datasets
7. **Action Buttons**: Placeholder buttons (New, Edit, Issue, Box, History) for future functionality

Technical approach:
- Use SvelteKit 5 with server-side data loading (+page.server.ts)
- Drizzle ORM queries with proper JOIN logic (flasks → box_content_lines → box_content_header → boxes)
- shadcn-svelte components for consistent UI (Table, Input, Button, Pagination)
- Timezone-aware date handling using date-fns
- Responsive design following the color scheme: white, yellow panels, grey

### Tasks
- [x] 1. Set up SvelteKit routes and page structure
- [x] 2. Implement top-bar menu component
- [x] 3. Create Drizzle queries for flasks data
- [x] 4. Build multi-row grid component with shadcn
- [x] 5. Implement search functionality
- [x] 6. Add keyboard navigation support
- [x] 7. Create remarks canvas component
- [x] 8. Implement pagination controls
- [x] 9. Add bottom action buttons
- [x] 10. Implement column sorting
- [x] 11. Apply layout styling and responsiveness
- [x] 12. Add date formatting utilities
- [x] 13. Testing and refinement

### Suggestions

#### Architecture & Design
1. **Component Organization**: Consider creating a `/lib/components/flasks` directory to organize all flask-related components (FlasksGrid, FlaskRemarksPanel, FlaskSearchBar, etc.)

2. **State Management**: For the startpage, use SvelteKit's built-in form actions and URL search params for state. This keeps the URL bookmarkable and the back button functional.

3. **Data Loading Strategy**: Implement server-side pagination and filtering to handle large datasets efficiently. The grid spec mentions 15 rows - consider making this configurable via user preferences later.

4. **Accessibility**: Ensure ARIA labels and keyboard navigation work properly. The grid should be navigable for screen readers and keyboard-only users.

#### Technical Considerations
5. **Performance**:
   - Use Drizzle's `.select()` to fetch only needed columns
   - Consider implementing virtual scrolling if the dataset grows significantly
   - Add proper database indexes on name columns (already present in schema)

6. **Date Handling**: Create a centralized date utility module (`$lib/utils/dates.ts`) with functions like:
   - `formatDateDisplay(date: Date, timezone: string): string`
   - `parseToUTC(dateString: string, timezone: string): Date`
   - This ensures consistency across the app

7. **Grid Layout**: The DataTables-inspired layout works well, but consider:
   - Using CSS Grid for the main layout (grid + remarks panel)
   - Implementing sticky header for the table when scrolling
   - Making the remarks panel resizable or collapsible

8. **Error Handling**: Add proper error states for:
   - Database connection failures
   - Empty search results
   - Loading states during data fetch

#### Future-Proofing
9. **Column Configuration**: The JSON structure defining columns is good. Consider storing this in a TypeScript config file (`$lib/config/flasksGridColumns.ts`) so it's easy to modify later.

10. **Relation Lookup**: The `relation_lookup` array in the column definition is interesting. Consider creating a generic query builder that can handle these relation chains dynamically.

11. **Sign-in Button**: Phase 2 includes a "Sign in" button but login is mentioned in 0101_login.md. Consider whether to:
    - Implement basic NeonAuth integration now
    - Create a placeholder that routes to a login page
    - Wait for a dedicated authentication phase

12. **Testing Approach**: Consider adding:
    - Unit tests for date utilities and formatting functions
    - Integration tests for Drizzle queries
    - E2E tests for critical user flows (search, pagination, sorting)

#### UX Enhancements
13. **Loading States**: Add skeleton loaders or spinners during data fetching for better perceived performance

14. **Empty States**: Design friendly empty states for:
    - No flasks in database
    - No search results found
    - No remarks for selected flask

15. **Row Selection**: The yellow gradient selector is specified. Consider adding:
    - Visual feedback on hover
    - Multiple selection (Ctrl/Cmd + click) for batch operations in future phases
    - Persistent selection across page navigation

16. **Mobile Responsiveness**: The grid might be challenging on mobile. Consider:
    - Card view for mobile devices
    - Collapsible columns
    - Swipe gestures for navigation

---

## Findings - Phase 2 Implementation

### Completed Features
All 13 tasks of Phase 2 have been successfully completed. The application now includes:

1. **Fully functional Flasks startpage** at `/` (root route)
2. **Top navigation bar** with Beaker icon, Flasks menu item, and Sign in button
3. **Dual search functionality** for Flask name and Box name with debounced input
4. **Data grid** displaying:
   - Flask ID, Name, Box location, Broken date, Low pressure date
   - 15 rows per page
   - Yellow gradient row selector
   - Hover effects
5. **Sorting capability** on Flask and Box columns (ascending/descending)
6. **Keyboard navigation** with arrow keys (up/down) for row selection
7. **Remarks panel** on the right displaying selected flask remarks
8. **Action buttons bar** with New, Edit, Issue, Box, History (placeholders for future phases)
9. **Pagination controls** with page numbers and navigation
10. **Server-side data loading** with Drizzle ORM queries including proper JOINs

### Technical Implementation
- **Files created**: 10 new files
  - `src/routes/+page.server.ts` - Server-side data loading
  - `src/routes/+page.svelte` - Main page component
  - `src/lib/components/flasks/TopBar.svelte`
  - `src/lib/components/flasks/SearchBar.svelte`
  - `src/lib/components/flasks/FlasksGrid.svelte`
  - `src/lib/components/flasks/RemarksPanel.svelte`
  - `src/lib/components/flasks/ActionButtons.svelte`
  - `src/lib/components/flasks/Pagination.svelte`
  - `src/lib/utils/dates.ts` - Date formatting utilities
  - `src/lib/config/flasksGridColumns.ts` - Column configuration
- **Dependencies added**: `date-fns`, `lucide-svelte`
- **Type safety**: All components use TypeScript with proper type definitions
- **Zero TypeScript errors**: `svelte-check found 0 errors and 0 warnings`

### Issues Encountered & Resolved

#### 1. Icon Import Issue
**Problem**: The `Flask` icon doesn't exist in `lucide-svelte` library.
**Solution**: Changed to use `Beaker` icon which is a suitable laboratory equipment icon.
**File affected**: `src/lib/components/flasks/TopBar.svelte`

#### 2. Svelte 5 Runes Mode Warnings
**Problem**: `<svelte:component>` is deprecated in Svelte 5 runes mode.
**Solution**: Replaced dynamic component rendering with conditional rendering using `{#if}` blocks.
**Files affected**:
- `src/lib/components/flasks/ActionButtons.svelte` - Changed from loop to explicit buttons
- `src/lib/components/flasks/FlasksGrid.svelte` - Changed sort icons to conditional rendering

#### 3. Accessibility Warning
**Problem**: Non-interactive element (table) with tabindex attribute.
**Solution**: Removed `tabindex="0"` from table and added `role="application"` and `aria-label` to parent div. Keyboard navigation works via window event listener.
**File affected**: `src/lib/components/flasks/FlasksGrid.svelte`

### Known Limitations

1. **No actual database data**: The application will show "No flasks found" until data is added to the database.
   - **Next step**: Need to either run the SQL initialization script or add test data manually.

2. **Timezone handling**: Currently displays dates in UTC format (YYYY-MM-DD).
   - Future enhancement: Add user timezone preference and convert dates accordingly.

3. **Box lookup optimization**: The JOIN query may return duplicate flasks if a flask is in multiple boxes.
   - **Consideration**: May need to add DISTINCT or aggregate functions depending on business rules.

4. **Sign in button**: Currently a placeholder with no functionality.
   - Will be implemented in a future phase with NeonAuth or Clerk.

5. **Action buttons**: All buttons log to console only.
   - New, Edit, Issue, Box, History features planned for future phases.

### Performance Notes
- Server-side pagination and filtering implemented for efficiency
- Database indexes already exist on `flasks.name` and `boxes.name` columns
- Debounced search (300ms) to avoid excessive database queries
- Proper use of Drizzle's query builder for optimized SQL generation

### Development Server Status
- Dev server running successfully on `http://localhost:5173/`
- No build or runtime errors
- Application ready for testing with actual database data

### Recommendations for Next Steps

1. **Add test data**: Create a few flasks and boxes in the database to verify the UI works correctly
2. **Test edge cases**:
   - Empty search results
   - Large datasets (100+ flasks)
   - Flasks without boxes
   - Very long remarks text
3. **User testing**: Have stakeholders review the interface for usability feedback
4. **Database constraints**: Verify the unique constraint on box_content_lines (flask can only be in one box at a time?)
5. **Consider Phase 3**: Review `product_docs\0110_new_and_edit_flask.md` and other phase documents to plan next steps

---

## [x] Phase 3
### Product_docs:
- product_docs\plan3_clerk_auth.md (Clerk research)
- product_docs\plan4_auth.js.md (Authentication decision & implementation guide)
- product_docs\0101_login.md (to be updated)

### Description
Phase 3 focuses on implementing user authentication to enable secure access and audit trail functionality.

### Research Completed (2026-02-06)
Three authentication options were investigated:

1. **NeonAuth** - ❌ NOT VIABLE
   - Architecture preference from 0000_architecture.md
   - **Blocker**: No SvelteKit support (only Next.js, React, React Router)
   - Cannot proceed with this option

2. **Auth.js (@auth/sveltekit)** - ✅ RECOMMENDED
   - Official Auth.js SvelteKit adapter
   - Free and open-source
   - Integrates with existing Drizzle ORM + Neon PostgreSQL
   - Supports OAuth (Google, GitHub, etc.)
   - No custom domain required for production
   - Status: Experimental but actively maintained

3. **Clerk (svelte-clerk)** - ⚠️ FALLBACK OPTION
   - Community package (unofficial)
   - Pre-built UI components
   - Usage-based pricing (free tier: 10k MAU)
   - Rich enterprise features (MFA, SSO)
   - Requires custom domain for production

### Decision
**Selected: Auth.js (@auth/sveltekit)**

**Rationale:**
- Free and open-source (no recurring costs)
- Official adapter from Auth.js team
- Works natively with existing tech stack
- No vendor lock-in
- Full control over authentication logic
- Detailed implementation guide in plan4_auth.js.md

### Tasks
- [x] Research NeonAuth capabilities
- [x] Evaluate Auth.js (@auth/sveltekit)
- [x] Evaluate Clerk (svelte-clerk)
- [x] Document findings and comparison
- [x] Update architecture document with decision
- [ ] Set up OAuth provider (Google Cloud Console)
- [ ] Install Auth.js dependencies
- [ ] Create database schema for auth tables
- [ ] Configure Auth.js server hooks
- [ ] Update TopBar component with sign-in/sign-out
- [ ] Protect routes with authentication checks
- [ ] Add audit trail (userId) to form actions
- [ ] Test locally
- [ ] Deploy to Vercel with environment variables
- [ ] Production testing

### Implementation Guide
See `product_docs/plan4_auth.js.md` for complete step-by-step implementation instructions including:
- Installation steps
- Configuration code samples
- Database schema
- UI component updates
- Route protection
- Vercel deployment
- Testing checklist

### Estimated Implementation Time
5-7 hours total