# Keystone - Cross-Platform Expense Tracking App

A full-stack, cross-platform monorepo built with React Native, Next.js, Tamagui, and Firebase, designed to deliver a consistent user experience across web, iOS, and Android platforms.

## 🏗️ Architecture Overview

This monorepo follows a shared-code architecture pattern that maximizes code reuse between platforms while maintaining platform-specific optimizations. The project consists of three main layers:

### **Applications Layer**

- **`apps/expo`** - React Native mobile application (iOS & Android)
- **`apps/next`** - Next.js web application with SSR/SSG capabilities

### **Shared Packages Layer**

- **`packages/app`** - Core business logic, features, and cross-platform components
- **`packages/ui`** - Design system and reusable UI components optimized by Tamagui
- **`packages/config`** - Shared Tamagui configuration, themes, and design tokens

### **Backend Layer**

- **`backend`** - Node.js/Express API server with PostgreSQL database
- **`backend/src`** - Source code for all backend services
- **`backend/src/controllers`** - Request handlers for different resources
- **`backend/src/routes`** - API route definitions
- **`backend/src/services`** - Business logic and external service integrations
- **`backend/src/middleware`** - Authentication and authorization middleware

### **Key Technologies & Their Roles**

| Technology                 | Purpose                                                  | Platform Support |
| -------------------------- | -------------------------------------------------------- | ---------------- |
| **Tamagui**                | Universal design system with compile-time optimizations  | Web + Native     |
| **Solito**                 | Type-safe, cross-platform navigation                     | Web + Native     |
| **Firebase**               | Authentication, real-time database, and file storage     | Web + Native     |
| **Expo**                   | Native mobile development platform with managed workflow | iOS + Android    |
| **Next.js**                | Production-ready React framework with SSR/SSG            | Web              |
| **React Query**            | Server state management and caching                      | Web + Native     |
| **Node.js/Express**        | Backend API server                                       | Server           |
| **PostgreSQL/Prisma**      | Primary database with ORM                                | Server           |
| **Google Cloud Vertex AI** | AI receipt processing                                    | Server           |

## 🎯 Project Features

This expense tracking application includes:

- **Authentication**: Google Sign-in and Apple Sign-in (iOS)
- **Expense Management**: Create, edit, and categorize expenses
- **Category Management**: Custom expense categories with hierarchical structure
- **User Profiles**: User account management and settings
- **Cross-Platform**: Shared codebase with platform-specific optimizations
- **Real-time Sync**: Firebase real-time database integration
- **Responsive Design**: Adaptive UI for all screen sizes
- **AI Receipt Processing**: Automatic expense data extraction from receipt images
- **Guest Access System**: Shareable links for expense submission and review
- **Role-Based Permissions**: Fine-grained access control for categories and workspaces
- **Reporting & Analytics**: Comprehensive expense reporting and visualization
- **File Storage**: Secure receipt storage with Firebase Storage

## 📁 Detailed Folder Structure

```
├── apps/
│   ├── expo/                    # React Native mobile app
│   │   ├── app/                 # Expo Router app directory
│   │   │   ├── _layout.tsx      # Root layout with navigation
│   │   │   ├── index.tsx        # Home screen
│   │   │   ├── settings.tsx     # App settings
│   │   │   ├── category/[id].tsx # Dynamic category routes
│   │   │   ├── expense/[id].tsx  # Dynamic expense routes
│   │   │   └── user/[id].tsx     # Dynamic user routes
│   │   ├── assets/              # App icons, splash screens, images
│   │   ├── ios/                 # iOS-specific native code
│   │   └── plugins/             # Expo config plugins
│   │
│   └── next/                    # Next.js web application
│       ├── app/                 # App Router directory (Next.js 13+)
│       │   ├── layout.tsx       # Root layout component
│       │   ├── page.tsx         # Home page
│       │   ├── category/[id]/   # Dynamic category pages
│       │   ├── expense/[id]/    # Dynamic expense pages
│       │   ├── settings/        # Settings page
│       │   └── user/[id]/       # Dynamic user pages
│       ├── pages/               # Legacy Pages Router (optional)
│       └── public/              # Static assets
│
├── packages/
│   ├── app/                     # Core application logic
│   │   ├── features/            # Feature-based organization
│   │   │   ├── auth/            # Authentication components & logic
│   │   │   ├── category/        # Category management
│   │   │   ├── expense/         # Expense tracking features
│   │   │   ├── home/            # Home screen components
│   │   │   └── user/            # User profile features
│   │   ├── provider/            # React Context providers
│   │   │   ├── AuthProvider.tsx # Firebase auth state management
│   │   │   ├── firebase.config.ts # Firebase configuration
│   │   │   └── safe-area/       # Safe area context providers
│   │   ├── components/          # Shared components
│   │   ├── utils/               # Utility functions
│   │   └── types/               # TypeScript type definitions
│   │
│   ├── ui/                      # Design system & UI components
│   │   └── src/
│   │       ├── CustomToast.tsx  # Custom toast notifications
│   │       ├── MyComponent.tsx  # Reusable UI components
│   │       └── index.tsx        # Component exports
│   │
│   └── config/                  # Tamagui configuration
│       └── src/
│           ├── tamagui.config.ts # Theme and design tokens
│           ├── animations.ts     # Animation configurations
│           └── fonts.ts          # Font definitions
│
├── backend/                     # Backend API server
│   ├── src/                     # Backend source code
│   │   ├── controllers/         # Request handlers
│   │   ├── routes/              # API route definitions
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Authentication middleware
│   │   ├── schemas/             # Data validation schemas
│   │   └── utils/               # Utility functions
│   ├── migrations/              # Database migrations
│   └── tests/                   # Backend tests
```

### 🧩 Package Details

#### `packages/app` - Core Application

- **Purpose**: Houses all business logic, feature implementations, and cross-platform components
- **Key directories**:
  - `features/`: Feature-based code organization (auth, expenses, categories, etc.)
  - `provider/`: React Context providers for state management
  - `components/`: Shared UI components that use the design system
  - `utils/`: Platform-agnostic utility functions
- **Dependencies**: Tamagui UI, React Query, Firebase, Solito

#### `packages/ui` - Design System

- **Purpose**: Provides the component library and design system used across all apps
- **Features**: Tamagui-optimized components with compile-time style extraction
- **Exports**: Reusable components, custom toasts, theme switchers
- **Benefits**: Consistent styling, performance optimization, type safety

#### `packages/config` - Configuration

- **Purpose**: Centralized Tamagui configuration, themes, and design tokens
- **Includes**: Color schemes, typography, spacing, animations, breakpoints
- **Usage**: Imported by both UI package and applications for consistent theming

#### `backend` - API Server

- **Purpose**: Provides RESTful API services for the application
- **Key directories**:
  - `controllers/`: Request handlers for different resources
  - `routes/`: API route definitions
  - `services/`: Business logic and external service integrations
  - `middleware/`: Authentication and authorization middleware
- **Dependencies**: Express.js, Prisma ORM, Firebase Admin, Google Cloud Vertex AI

## 🔄 How the Monorepo Works Together

### Code Sharing Strategy

1. **Feature Logic** (`packages/app/features/`)
   - Contains platform-agnostic business logic
   - Shared between Expo and Next.js apps
   - Includes hooks, utilities, and component logic

2. **UI Components** (`packages/ui/`)
   - Universal components that work on both web and native
   - Optimized by Tamagui for performance
   - Consistent design across platforms

3. **Navigation** (Solito)
   - Provides type-safe routing that works on both platforms
   - Next.js uses file-based routing
   - Expo uses Expo Router with shared navigation logic

4. **State Management**
   - React Query for server state (API calls, caching)
   - React Context for client state (auth, theme)
   - Firebase for real-time data synchronization

### Platform-Specific Adaptations

- **Web (Next.js)**: SSR/SSG optimization, SEO, web-specific APIs
- **Mobile (Expo)**: Native modules, device APIs, platform-specific UX patterns
- **Shared**: Core business logic, UI components, navigation structure

### Build Process

1. **Development**: Shared packages are built and watched for changes
2. **Tamagui Optimization**: Compile-time style extraction for performance
3. **Platform Builds**: Each app builds with its platform-specific optimizations
4. **Type Safety**: TypeScript ensures consistency across packages

## 🎨 Design System Architecture

### Tamagui Configuration Flow

```
packages/config/tamagui.config.ts
           ↓
packages/ui/src/ (UI Components)
           ↓
packages/app/features/ (Feature Components)
           ↓
apps/expo & apps/next (Applications)
```

### Theme System

- **Design Tokens**: Defined in `packages/config`
- **Component Variants**: Styled components with consistent API
- **Platform Optimization**: Automatic performance optimizations
- **Dark/Light Modes**: Built-in theme switching capabilities

## 🚀 Getting Started

### Prerequisites

- Node.js 22+ and Yarn 4.5+
- iOS: Xcode 15+ and iOS Simulator
- Android: Android Studio and Android Emulator
- Firebase project (see setup below)
- PostgreSQL database for backend

### Quick Start

1. **Install dependencies**

   ```bash
   yarn install
   ```

2. **Start development servers**

   ```bash
   # Web development (Next.js)
   yarn web

   # Mobile development (Expo)
   yarn native

   # Watch mode for packages
   yarn watch
   ```

3. **Build for production**

   ```bash
   # Build all packages
   yarn build

   # Build web app for production
   yarn web:prod

   # Build native apps
   yarn native:prebuild
   ```

### Available Scripts

| Script             | Description                                   |
| ------------------ | --------------------------------------------- |
| `yarn web`         | Start Next.js development server              |
| `yarn web:extract` | Start web dev with Tamagui extraction enabled |
| `yarn web:prod`    | Build and serve production web app            |
| `yarn native`      | Start Expo development server                 |
| `yarn ios`         | Run iOS app in simulator                      |
| `yarn android`     | Run Android app in emulator                   |
| `yarn build`       | Build all packages                            |
| `yarn test`        | Run test suite                                |
| `yarn watch`       | Watch mode for package development            |

## 📦 Dependency Management

### Adding Dependencies

#### Shared JavaScript Dependencies

For libraries used across platforms (utilities, state management, etc.):

```bash
cd packages/app
yarn add [package-name]
cd ../..
yarn
```

#### Native Dependencies

For React Native libraries with native code:

```bash
cd apps/expo
yarn add [react-native-package]
cd ../..
yarn
```

#### UI Dependencies

For design system components:

```bash
cd packages/ui
yarn add [ui-package]
cd ../..
yarn
```

### Updating Dependencies

```bash
# Interactive upgrade
yarn upgrade-interactive

# Update Tamagui packages
yarn upgrade:tamagui

# Update to canary versions
yarn upgrade:tamagui:canary
```

### Monorepo Best Practices

- **Version Consistency**: Keep package versions synchronized across workspaces
- **Dependency Placement**: Add dependencies to the most specific package that needs them
- **Peer Dependencies**: Use peer dependencies for React/React Native to avoid duplication
- **Resolution Management**: Use `resolutions` in root package.json for version conflicts

### Common Issues & Solutions

- **Module Resolution**: If you get "Cannot use import statement outside a module", add the package to `transpilePackages` in `next.config.js`
- **Version Conflicts**: Use `yarn why [package-name]` to debug dependency conflicts
- **Native Module Errors**: Ensure native dependencies are only installed in `apps/expo`

## 🚀 Deployment

### Web Deployment (Vercel)

- **Root Directory**: `apps/next`
- **Install Command**: `yarn set version stable && yarn install`
- **Build Command**: Use default (`yarn build`)
- **Output Directory**: Use default (`.next`)

### Mobile Deployment

```bash
# iOS
cd apps/expo
yarn expo build:ios

# Android
cd apps/expo
yarn expo build:android
```

## 🔥 Firebase Authentication Setup

This project includes Firebase Authentication with Google Sign-In for the Expo app. Follow these steps to configure it:

### 1. Firebase Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication and go to the "Sign-in method" tab
4. Enable "Google" as a sign-in provider

### 2. Android Configuration

1. In Firebase Console, add an Android app to your project
2. Use the package name: `com.thejunkyard.keystone` (or your custom package name from `app.json`)
3. Download the `google-services.json` file
4. Place it in `apps/expo/google-services.json` (already configured in app.json)

### 3. iOS Configuration

1. In Firebase Console, add an iOS app to your project
2. Use the bundle ID: `com.thejunkyard.keystone` (or your custom bundle ID from `app.json`)
3. Download the `GoogleService-Info.plist` file
4. Place it in `apps/expo/GoogleService-Info.plist` (already configured in app.json)

### 4. Configure Google Sign-In

1. Get your Web Client ID from Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration
2. Update the `webClientId` in `packages/app/provider/AuthProvider.tsx` with your actual Web Client ID
3. For iOS, update the `iosUrlScheme` in `apps/expo/app.json` with your reversed client ID from GoogleService-Info.plist

### 5. Update Firebase Config (Optional)

You can update `apps/expo/firebase.config.ts` with your actual Firebase configuration values, though this is not required for React Native Firebase as it reads from the JSON/plist files.

### 6. Test Authentication

1. Run the Expo app: `yarn native`
2. The app will show a login screen if the user is not authenticated
3. Tap "Sign in with Google" to test the authentication flow

**Note**: Google Sign-In is currently implemented only for the React Native/Expo app. Web authentication will be added separately using Firebase Web SDK.

## 🧠 AI Receipt Processing

Keystone features advanced AI-powered receipt processing that automatically extracts expense data from receipt images. This feature leverages Google Cloud Vertex AI to analyze receipt images and extract structured data.

### How It Works

1. **Receipt Upload**: Users upload a receipt image through the app
2. **Storage**: The image is stored in Firebase Storage
3. **AI Analysis**: The backend sends the image to Google Cloud Vertex AI for processing
4. **Data Extraction**: Vertex AI extracts key information including:
   - Total amount
   - Transaction date
   - Transaction summary (merchant name, category)
   - Individual items with descriptions and prices
5. **Confidence Scoring**: The system calculates a confidence score for the extracted data
6. **Data Presentation**: Extracted data is presented to the user for review and confirmation

### Backend Implementation

The AI receipt processing is implemented in the backend using:

- **Google Cloud Vertex AI**: For receipt analysis and data extraction
- **Structured Output Schema**: Ensures consistent data format from the AI
- **Error Handling**: Graceful handling of AI processing failures
- **Confidence Calculation**: Algorithm to determine data reliability

### Frontend Integration

The frontend integrates with the AI receipt processing through:

- **ReceiptParsingService**: Handles communication with the backend API
- **useReceiptProcessor Hook**: Orchestrates the receipt upload and parsing workflow
- **State Management**: Tracks parsing progress, errors, and results

### API Endpoints

- `POST /api/ai/parse-receipt`: Process a receipt image
  - **Headers**: Authorization: Bearer <firebase_id_token> (authenticated users) or token=<guest_token> (guest users)
  - **Body**:
    ```json
    {
      "gsUri": "gs://bucket/path/to/receipt.jpg",
      "mimeType": "image/jpeg"
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "data": {
        "totalAmount": 25.99,
        "transactionSummary": "Groceries at Store",
        "transactionDate": "2025-01-15",
        "items": [
          {
            "description": "Item 1",
            "price": 10.99
          }
        ],
        "confidence": 95
      }
    }
    ```

## 👥 Guest Access & Role-Based Permissions

Keystone implements a sophisticated guest access system that allows users to share expense categories with others who don't have accounts. This system provides fine-grained control over what guests can do.

### Guest Permission Levels

1. **SUBMIT_ONLY**: Guests can only submit new expenses to a category
   - Can upload receipts
   - Can submit expense details
   - Cannot view existing expenses
   - Cannot modify or delete expenses

2. **REVIEW_ONLY**: Guests can view and review expenses in a category
   - Can view all expenses in the category
   - Can approve or deny expenses
   - Cannot modify category settings
   - Cannot delete the category

### Share Links

Users can generate shareable links for categories with specific permission levels and expiration dates:

- **Link Generation**: Authenticated users can create share links through the permissions interface
- **Permission Control**: Links can be set to expire automatically
- **Revocation**: Links can be revoked at any time
- **Description**: Links can include descriptions for organizational purposes

### Backend Implementation

The guest access system is implemented through:

- **Guest Tokens**: Secure tokens that grant access to specific categories
- **Middleware**: Authentication and authorization middleware for guest routes
- **Permission Validation**: Hierarchical permission checking
- **Database Models**: Specialized models for guest tokens and permissions

### API Endpoints

- `GET /api/guest?token=...`: Fetch data for a guest based on their permission level
- `POST /api/guest?token=...`: Submit expense data as a guest
- `POST /api/guest/signed-upload-url?token=...`: Generate a signed URL for guest users to upload receipts
- `GET /api/guest/receipt-url/:filePath?token=...`: Generate a signed URL for a Firebase Storage receipt file
- `GET /api/guest/category/:categoryId?token=...`: Get specific category data for guests with REVIEW_ONLY permission
- `GET /api/guest/expenses/:expenseId?token=...`: Get specific expense details for guests with REVIEW_ONLY permission
- `PUT /api/guest/expenses/:expenseId?token=...`: Update expense status as a guest reviewer

### Role-Based Permissions

In addition to guest access, Keystone implements a role-based permission system for authenticated users:

1. **Category Owner**: The user who created a category or owns the workspace containing the category
   - Full access to all category features
   - Can grant/revoke permissions to other users
   - Can modify category settings

2. **ADMIN**: Users with administrative privileges on a category
   - Can manage category settings
   - Can grant/revoke permissions to other users
   - Can view and modify all expenses

3. **REVIEWER**: Users with review privileges on a category
   - Can view all expenses in the category
   - Can approve or deny expenses
   - Cannot modify category settings

## 📊 Reporting & Analytics

Keystone provides comprehensive reporting and analytics features to help users track and analyze their expenses.

### Workspace Structure

Workspaces in Keystone are organized hierarchically:

- **Workspaces**: Workspaces are owned by one person and serves as the base for subcategories
- **Categories**: Group expenses by type (e.g., Food, Transportation), and create subcategories. This can be used to budget spending.

### Reporting Features

1. **Expense Tracking**: View all expenses within a workspace or category
2. **Budget Monitoring**: Compare spending against category budgets
3. **Time-Based Analysis**: Filter expenses by date ranges
4. **Category Breakdown**: Visualize spending distribution across categories
5. **Trend Analysis**: Identify spending patterns over time

### Backend Implementation

The reporting system is implemented through:

- **Report Controllers**: Handle workspace creation, retrieval, and management
- **Expense Controllers**: Manage expense data and queries
- **Category Controllers**: Handle category hierarchy and budget tracking
- **Analytics Services**: Calculate spending trends and statistics

### API Endpoints

- `GET /api/reports`: Get all workspaces owned by the authenticated user
- `GET /api/reports/:reportId`: Get a specific workspace with detailed information
- `GET /api/reports/:reportId/expenses`: Get all expenses for a workspace with pagination
- `GET /api/reports/:reportId/categories`: Get all categories for a workspace
- `GET /api/reports/:reportId/root-category`: Get the root category for a workspace

### Data Visualization

The frontend provides visual representations of expense data:

- **Charts**: Spending trends over time
- **Pie Charts**: Category distribution
- **Progress Bars**: Budget utilization
- **Tables**: Detailed expense listings with sorting and filtering

## 🛠️ Development Workflow

### Technology Stack

**Frontend:**

- React Native (Expo) for mobile
- Next.js for web
- Tamagui for design system
- React Query for state management
- Firebase for authentication and storage

**Backend:**

- Node.js with Express.js
- PostgreSQL with Prisma ORM
- Firebase Admin SDK
- Google Cloud Vertex AI

### Code Organization Principles

#### Feature-Based Structure

The project follows a feature-based architecture in `packages/app/features/`:

- Each feature has its own directory (auth, expense, category, user, home)
- Features contain related components, hooks, utils, and types
- Features are self-contained and can be developed independently

#### Component Hierarchy

```
packages/ui/         → Design system components (Button, Input, etc.)
packages/app/        → Business logic components (ExpenseForm, etc.)
apps/expo & next/    → App-specific components (screens, layouts)
```

#### State Management Strategy

- **Server State**: React Query for API calls, caching, and synchronization
- **Client State**: React Context for app-wide state (auth, theme, settings)
- **Local State**: useState/useReducer for component-specific state
- **Form State**: Consider react-hook-form for complex forms

### Best Practices

#### TypeScript Usage

- Define interfaces in `types/` directories within each package
- Use strict TypeScript configuration
- Leverage type inference where possible
- Create shared types for API responses and common data structures

#### Performance Optimization

- **Tamagui**: Use Tamagui components for automatic style optimizations
- **React Query**: Implement proper caching strategies and background updates
- **Code Splitting**: Leverage dynamic imports for large features
- **Bundle Analysis**: Use `yarn web:prod` with bundle analyzer

#### Cross-Platform Considerations

- Test components on both web and native platforms
- Use platform-specific extensions (`.web.tsx`, `.native.tsx`) when needed
- Leverage Solito for navigation that works across platforms
- Consider different interaction patterns (hover vs touch)

## 🧪 Testing Strategy

### Testing Architecture

```
Unit Tests     → Individual components and utilities
Integration    → Feature workflows and API integration
E2E Tests      → Full user journeys across platforms
```

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests for specific package
cd packages/app && yarn test
```

### Testing Guidelines

- **Component Testing**: Test behavior, not implementation details
- **Hook Testing**: Use `@testing-library/react-hooks` for custom hooks
- **API Testing**: Mock Firebase and external API calls
- **Cross-Platform**: Test components on both web and native environments

## 🐛 Debugging & Troubleshooting

### Development Tools

#### Tamagui Debug

Add `// debug` at the top of any file to see Tamagui compilation output.

#### React Query DevTools

Development builds include React Query DevTools for inspecting cache state.

#### Firebase Debugging

Use Firebase Local Emulator Suite for development:

```bash
firebase emulators:start
```

### Common Issues

#### Build Errors

- **Metro bundler cache**: `npx expo start -c`
- **Next.js cache**: `rm -rf .next && yarn web`
- **Node modules**: `rm -rf node_modules && yarn install`
- **Yarn cache**: `yarn cache clean`

#### Platform-Specific Issues

- **iOS**: Check Xcode build logs, ensure certificates are valid
- **Android**: Verify Android SDK and build tools versions
- **Web**: Check browser console for hydration mismatches

#### Tamagui Issues

- **Style extraction**: Ensure `DISABLE_EXTRACTION=false` for production builds
- **Theme issues**: Verify theme provider wrapping and theme token usage
- **Animation problems**: Check if animations are properly configured

## 🔧 Configuration Management

### Environment Variables

#### Web (`apps/next/.env.local`)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
# ... other Firebase config
```

#### Native (`apps/expo/app.config.js`)

```javascript
export default {
  expo: {
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      // ... other config
    },
  },
}
```

### Configuration Files

#### Key Configuration Files

- `tamagui.config.ts` - Design system configuration
- `tsconfig.json` - TypeScript configuration
- `turbo.json` - Monorepo build orchestration
- `package.json` - Workspace and script definitions

## 📚 Learning Resources

### Core Technologies

- **[Tamagui Documentation](https://tamagui.dev)** - Design system and styling
- **[Solito Documentation](https://solito.dev)** - Cross-platform navigation
- **[Expo Documentation](https://docs.expo.dev/)** - Mobile development platform
- **[Next.js Documentation](https://nextjs.org/docs)** - Web framework
- **[Firebase Documentation](https://firebase.google.com/docs)** - Backend services

### Advanced Topics

- **[React Query Guide](https://tanstack.com/query/latest)** - Server state management
- **[Expo Router](https://docs.expo.dev/router/introduction/)** - File-based routing for React Native
- **[Yarn Workspaces](https://yarnpkg.com/features/workspaces)** - Monorepo package management

## 🤝 Contributing

### Development Workflow

1. **Feature Development**: Create feature branches from `main`
2. **Code Quality**: Ensure TypeScript compilation and tests pass
3. **Cross-Platform Testing**: Test on both web and native platforms
4. **Documentation**: Update relevant documentation for new features
5. **Pull Requests**: Submit PRs with clear descriptions and testing notes

### Code Style

- Use Prettier for code formatting
- Follow ESLint rules defined in the project
- Use meaningful commit messages following conventional commits
- Maintain consistent naming conventions across packages

---

## 📄 Additional Documentation

For more detailed information about specific aspects of the project:

- **[Firebase Setup Guide](./docs/firebase-setup.md)** - Complete Firebase configuration
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions
- **[Contributing Guidelines](./docs/contributing.md)** - Detailed contribution workflow
- **[API Documentation](./docs/api.md)** - Backend API endpoints and schemas

---

**Happy coding! 🚀**

_This monorepo architecture provides a solid foundation for building cross-platform applications with shared code, consistent design, and platform-specific optimizations._
