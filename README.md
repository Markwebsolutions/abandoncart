# Shopify Cart Manager

A comprehensive abandoned cart management system for Shopify stores with follow-up tracking, customer response management, and analytics.

## 🏗️ Project Structure

\`\`\`
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Main page (renders AbandonedCartManager)
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── abandoned-cart/          # Abandoned cart feature
│   │   └── AbandonedCartManager.tsx
│   ├── ui/                      # Reusable UI components (shadcn/ui)
│   └── [other-features]/        # Future feature components
├── lib/                         # Utility libraries
│   ├── abandoned-cart/          # Abandoned cart utilities
│   │   ├── constants.ts         # Constants and configurations
│   │   ├── database.ts          # Database operations
│   │   ├── mock-data.ts         # Mock data for development
│   │   └── utils.ts             # Utility functions
│   ├── config/                  # Configuration files
│   │   └── env.ts               # Environment variable management
│   └── utils.ts                 # Global utilities
├── types/                       # TypeScript type definitions
│   └── abandoned-cart.ts        # Abandoned cart types
├── .env.local                   # Local environment variables
├── .env.development             # Development environment
└── .env.production              # Production environment
\`\`\`

## 🚀 Getting Started

### 1. Environment Setup

Copy the appropriate environment file:

\`\`\`bash
# For local development
cp .env.local.example .env.local

# For development environment
cp .env.development.example .env.development

# For production environment
cp .env.production.example .env.production
\`\`\`

### 2. Configure Environment Variables

Edit your `.env.local` file with your actual credentials:

\`\`\`env
# Shopify Configuration
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token

# Database Configuration
DATABASE_URL=your_database_url

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
\`\`\`

### 3. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

## 📁 Adding New Components

### 1. Create Feature Directory

\`\`\`bash
mkdir components/[feature-name]
mkdir lib/[feature-name]
mkdir types/[feature-name].ts
\`\`\`

### 2. Example: Adding Inventory Management

\`\`\`typescript
// types/inventory.ts
export interface Product {
  id: string
  name: string
  sku: string
  quantity: number
  price: number
}

// lib/inventory/database.ts
export const inventoryDatabase = {
  async getProducts() {
    // Implementation
  }
}

// components/inventory/InventoryManager.tsx
export default function InventoryManager() {
  // Component implementation
}

// app/inventory/page.tsx
import InventoryManager from '@/components/inventory/InventoryManager'

export default function InventoryPage() {
  return <InventoryManager />
}
\`\`\`

## 🔧 Environment Management

### Development
- Uses `.env.development`
- Mock data enabled
- Debug logging enabled
- Local database

### Production
- Uses `.env.production`
- Real API connections
- Error tracking enabled
- Production database

### Feature Flags
Control features through environment variables:

\`\`\`env
ENABLE_REAL_TIME_SYNC=true
ENABLE_AI_INSIGHTS=false
ENABLE_BULK_ACTIONS=true
\`\`\`

## 🛠️ Available Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
\`\`\`

## 📦 Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: shadcn/ui + Tailwind CSS
- **TypeScript**: Full type safety
- **State Management**: React hooks
- **Styling**: Tailwind CSS with Geist font
- **Icons**: Lucide React

## 🔐 Security

- Environment variables are properly separated
- Sensitive data is never committed to git
- API keys are validated on startup
- Production builds exclude development tools

## 📈 Future Features

The modular structure supports easy addition of:
- Inventory Management
- Customer Analytics
- Email Campaign Manager
- Order Processing
- Product Recommendations
- Sales Reports
