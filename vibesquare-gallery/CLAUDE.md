# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VibeSquare Gallery** is an Angular 21 application that analyzes websites/galleries and generates Product Requirement Documents (PRDs) through a sophisticated multi-agent pipeline. It features authentication, subscription management, token-based quota system, and real-time analysis updates via Server-Sent Events (SSE).

**Key Current Work (v2.5):** Advanced PRD generation pipeline with agent confidence scores, clarification dialogs, model fallback approval, and expanded analysis details.

## Development Commands

### Setup & Installation
```bash
npm install              # Install dependencies (npm 10.8.2+, Node 20+)
```

### Development Server
```bash
npm start               # Run dev server at http://localhost:4200 (auto-reload on changes)
npm run watch          # Build in watch mode for debugging
```

### Building
```bash
npm run build          # Compile for production
```

### Testing
```bash
npm test               # Run unit tests with Vitest
npm test -- --ui      # Run tests with UI dashboard
```

### Code Quality
- No dedicated linting command configured; use editor with Prettier support
- Prettier config in `package.json`: 100 char printWidth, single quotes
- HTML files use `angular` parser for formatting

## Architecture Overview

### Standalone Components Architecture
The application uses Angular's **standalone components** (no NgModules). Every component includes its own dependencies via the `imports` array.

### Core Directory Structure

```
src/app/
├── app.ts                    # Root component with Header/Sidebar/Footer/RouterOutlet
├── app.config.ts            # Application-wide configuration (HTTP client, router, interceptors)
├── app.routes.ts            # Route definitions with lazy loading and guards
├── core/                     # Core business logic (non-UI)
│   ├── api.service.ts        # HTTP wrapper with automatic token injection
│   ├── auth/                 # Authentication module
│   │   ├── guards/           # authGuard, guestGuard for route protection
│   │   ├── interceptors/     # auth.interceptor (token injection, 401 handling, token refresh)
│   │   └── services/         # auth.service, user.service
│   ├── constants/            # API endpoints and constants
│   ├── models/               # TypeScript interfaces and types
│   └── services/             # Domain business services (analysis, prd, project, quota, etc.)
├── features/                 # Lazy-loaded feature modules (one component per route)
│   ├── explore/              # Main gallery/analysis page
│   ├── project-details/      # Individual project view
│   ├── auth/                 # Login, register, password reset
│   ├── profile/              # User profile with tabs
│   ├── collections/          # User collections
│   ├── history/              # Analysis history
│   ├── subscription/         # Billing/subscription
│   └── [other features]/     # About, privacy, terms, notifications
├── layout/                   # Shared layout components
│   ├── header/               # Top navigation
│   ├── sidebar/              # Left navigation
│   └── footer/               # Footer
└── shared/                   # Reusable components
    ├── components/           # Modal, dialog, badge, card, toast, button components
    └── [feature-specific]/   # Components for specific features (analysis, prd, etc.)
```

### State Management Pattern: Angular Signals

The application uses **Angular Signals** for reactive state management (no Redux/Ngrx).

```typescript
// Pattern used throughout services:
private stateSignal = signal<State>('initial');
readonly state = this.stateSignal.asReadonly();  // Public read-only version

// Computed derived state
readonly isLoading = computed(() => this.stateSignal() === 'loading');

// Update state
this.stateSignal.set(newValue);
this.stateSignal.update(current => ({ ...current, field: value }));
```

**Key Signals Used:**
- `PrdService`: `state`, `currentResult`, `analysisStatus`, `confidence`, `clarificationQuestions`, `fallbackRequest`
- `AuthService`: `isAuthenticated`, `currentUser`, `isLoading`
- `ProjectService`: `filteredProjects`, `selectedProject`, `filters`

### HTTP Communication Pattern

**ApiService** (`src/app/core/api.service.ts`) is the centralized HTTP wrapper:

```typescript
// Guest endpoints (unauthenticated)
this.apiService.postGuest<T>(endpoint, body);

// Authenticated endpoints (auto-injects Authorization header)
this.apiService.post<T>(endpoint, body);
this.apiService.get<T>(endpoint, options?);
this.apiService.patch<T>(endpoint, body);
this.apiService.delete<T>(endpoint);
this.apiService.getFile<Blob>(endpoint);  // For file downloads
```

**Token Injection & Refresh:**
- JWT token stored in localStorage
- `auth.interceptor` automatically injects `Authorization: Bearer <token>` header
- On 401 response, automatically refreshes token via refresh token cookie
- Failed requests are retried after token refresh

**API Response Format:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
}
```

### Authentication & Route Guards

**Route Protection:**
- `authGuard`: Requires authenticated user, redirects to `/auth/login`
- `guestGuard`: Prevents authenticated users from accessing auth pages (e.g., login)
- All protected routes use `canActivate: [authGuard]`

**OAuth Flow:**
- User redirects to OAuth provider
- Provider redirects back with code
- Backend exchanges code for tokens
- Tokens stored in localStorage and cookies

### V2.5 PRD Generation Pipeline

Current focus includes advanced features:

**Analysis Stages:**
1. **Request**: User selects `pipelineType` (visual/technical/both) and `detailLevel` (basic/detailed/comprehensive)
2. **Processing**: Multi-agent pipeline executes in sequence
3. **Confidence Tracking**: Real-time agent completion and confidence score updates via SSE
4. **Clarification**: Backend may request user clarifications for ambiguous requirements
5. **Fallback**: If agent fails, backend proposes alternative model with cost comparison
6. **Completion**: Final PRD markdown delivered with validation metadata

**Key V2.5 Models:**
- `AnalysisV25Request`: Pipeline and detail level selection
- `ConfidenceData`: Agent confidence scores with low confidence areas
- `ClarificationQuestion`: Questions for user with priority levels
- `FallbackRequest`: Model fallback proposal with cost estimates
- `PipelineUpdate`: Real-time status updates (via SSE)

**Services Managing Pipeline:**
- `PrdService`: Core analysis orchestration with signal-based state
- `SseService`: Server-Sent Events for real-time updates (confidence, agent progress)
- `QuotaService`: Token quota tracking and validation

### Modal & Dialog System

Uses **Angular CDK Overlay** with **Portal** system for dynamic modals:

```typescript
// Services for modals:
import { DialogService } from '@angular/cdk/dialog';

// Create modal with custom component
const dialogRef = this.dialog.open(MyModalComponent, {
  width: '500px',
  data: { /* pass data */ }
});

// Modals in this app:
- AnalysisConfirmModal: Pipeline/detail level selection
- AnalysisProcessingModal: Real-time progress with agent status
- PrdResultModal: Final PRD display with download/share
- ClarificationModal: User responses to clarification questions
- FallbackApprovalDialog: Model fallback approval with cost comparison
```

### Component Communication

- **Service Signals**: Components subscribe to service signals for reactive updates
- **Input/Output**: Parent-child communication via `@Input()` and `@Output()`
- **Route Parameters**: Feature components access route params via `ActivatedRoute`
- **Service Injection**: Use `inject()` function for dependency injection

```typescript
// Pattern used throughout:
export class MyComponent {
  private prdService = inject(PrdService);

  // Subscribe to service signals
  protected result = this.prdService.currentResult;
  protected isLoading = this.prdService.loading;
}
```

## Key Services Reference

### Core Services

| Service | Location | Purpose |
|---------|----------|---------|
| **ApiService** | `core/api.service.ts` | HTTP wrapper with token injection |
| **AuthService** | `core/services/auth.service.ts` | Authentication, session, OAuth |
| **PrdService** | `core/services/prd.service.ts` | PRD generation, V2.5 pipeline state |
| **ProjectService** | `core/services/project.service.ts` | Gallery data, filtering |
| **QuotaService** | `core/services/quota.service.ts` | Token quota management |
| **SseService** | `core/services/sse.service.ts` | Real-time updates for analysis progress |
| **SubscriptionService** | `core/services/subscription.service.ts` | Subscription/billing management |
| **NotificationService** | `core/services/notification.service.ts` | Toast notifications |
| **UserProfileService** | `core/services/user-profile.service.ts` | User profile data |

### Service Injection Pattern

All services use `providedIn: 'root'` for singleton pattern:

```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  private apiService = inject(ApiService);  // Inject dependencies
}
```

## Key Data Models

Located in `src/app/core/models/`:

| Model | Key Types |
|-------|-----------|
| **prd.model.ts** | `AnalysisV25Request`, `ConfidenceData`, `PipelineUpdate`, `ClarificationQuestion`, `FallbackRequest`, `AnalysisV25Result` |
| **analysis.model.ts** | Analysis request/response/state types |
| **project.model.ts** | Gallery/project data structures |
| **quota.model.ts** | Token quota tracking |
| **subscription.model.ts** | Subscription tier data |
| **user-profile.model.ts** | User profile information |

## Environment Configuration

**Files:**
- `src/environments/environment.ts`: Development (API: `http://localhost:3000/api`)
- `src/environments/environment.production.ts`: Production configuration

**Build Targets:**
- Default production build with optimizations
- Budget limits: 500kB initial, 4kB component styles
- Source maps enabled in development

## Styling & UI

- **Tailwind CSS 3.4.18**: Primary styling framework
- **Lucide Angular**: Icon library (`lucide-angular`)
- **highlight.js**: Code syntax highlighting
- **Masonry Layout**: Gallery grid layout
- **PostCSS**: CSS processing
- Global styles in `src/styles.css`

**Tailwind Customization:**
- See `tailwind.config.js` for custom theme extensions
- Component-level styles use Tailwind utility classes
- Dark mode support available

## Testing

- **Test Framework**: Vitest (configured via Angular build)
- **Location**: Tests co-located with source files (`.spec.ts`)
- **Pattern**: Standalone components require importing dependencies in test setup

```bash
npm test                    # Run all tests
npm test -- --ui           # Open test UI
npm test -- src/app/...    # Run specific test file
```

## Build & Deployment

- **Build Output**: `dist/` directory
- **Production Build**: `npm run build` (default configuration)
- **Deployment**: Configured for Vercel (see `vercel.json`)
- **Output Hashing**: Enabled for production (cache busting)

## Common Development Patterns

### Creating a New Feature Component

1. Generate standalone component: `ng generate component features/my-feature --standalone`
2. Create feature route in `app.routes.ts` with lazy loading
3. Use guards if authentication needed: `canActivate: [authGuard]`
4. Inject required services with `inject()`
5. Subscribe to service signals in template with async pipe or direct signal access

### Adding a New API Endpoint

1. Add method to appropriate service in `core/services/`
2. Use `ApiService` (post/get/patch/delete)
3. Handle response with `tap()` and `catchError()` operators
4. Update service signals with response data
5. Return `Observable<T>` from service method

### Creating a Modal Dialog

1. Create standalone component for modal content
2. Inject `DialogService` from `@angular/cdk/dialog`
3. Open with `this.dialog.open(MyModalComponent, { data, width, ... })`
4. Use `@Input()` for modal data, `@Output()` for close events
5. Import in component using modal and in modal component itself

## Important Files to Know

- **app.ts**: Root component structure
- **app.config.ts**: Global configuration, interceptors, HTTP client setup
- **app.routes.ts**: Complete routing configuration
- **environment files**: API endpoint configuration
- **tailwind.config.js**: Theme and custom styling
- **package.json**: Dependencies and scripts

## Git & Version Control

Recent changes focus on v2.5 pipeline with confidence scoring and clarification flow. Modified files track the PRD service, models, and UI components for the new pipeline features.

## Architecture Decisions

1. **Standalone Components**: No NgModules, simpler dependency tree
2. **Signal-based State**: Modern Angular reactivity, better performance
3. **Centralized HTTP Service**: Single point for token injection and error handling
4. **Lazy Loading**: Features loaded on demand for better performance
5. **CDK Overlay for Modals**: Flexible, non-blocking modal system
6. **Service-driven State**: Business logic in services, components are presentation
7. **RxJS Operators**: Reactive programming with tap, catchError, switchMap


- When coding Angular if you wanna use signals use One-Way Data Binding + Event Binding (example : [ngModel]="signal()" (ngModelChange)="signal.set($event)")

## Plan Mode / Planning Phase

When the user initiates a "Plan Mode" or asks for planning/architecture design:

1.  **Ask 10 Deep/Probing Questions**: You must strictly ask 10 deep, probing, or ambiguous questions to uncover hidden requirements and ambiguities. Do not proceed until these are discussed.
2.  **Step-by-Step Execution**: Execute the agreed plan rigorously step-by-step. Do not combine multiple major steps. 