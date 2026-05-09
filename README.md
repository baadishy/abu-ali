# Burger Station - Enterprise Ordering System

A premium, full-stack smashed burger online ordering system built for speed, conversion, and operational efficiency. This application features a custom promotional engine, localized multilingual support (Arabic/English), and a secure admin dashboard for real-time menu and site management.

## 🚀 Key Features

### 🛒 Ordering Experience
- **Fluid UI**: Built with React and Framer Motion for smooth transitions and high-end feel.
- **Dynamic Cart**: Real-time subtotal calculation with automatic discount application.
- **WhatsApp Integration**: Seamlessly sends formatted orders directly to the restaurant's WhatsApp business account.
- **Variant Support**: Support for different sizes (e.g., Single, Double, Triple) with automatic price adjustments.
- **Area-based Delivery**: Selectable delivery areas with different fees and free-delivery thresholds.

### 🏷️ Advanced Promotional Engine
A specialized logic layer (`promoUtils.ts`) that handles:
- **Buy X Get Y Free**: Automatically applies "Cheapest Item Free" logic within specified categories.
- **Fixed Discounts**: Flat-rate EGP deductions based on eligibility.
- **Percentage Discounts**: Relative savings calculated on eligible cart items.
- **Category Constraints**: Limit offers to specific categories (e.g., "Burger", "Sides").

### 🛡️ Admin Dashboard
- **Secure Access**: Protected via Admin ID and Password (configurable via env).
- **Menu Management**: Create, edit, and delete items with Cloudinary-backed image uploads.
- **Offer Creator**: Full UI to configure the promotional engine without touching code.
- **Site Settings**: Customize store name, social links, and translation directly from the panel.

### 🌐 Localization & Accessibility
- **Dual Language**: Fully translated in English and Arabic with localized font fallback (Inter/Inter-Arabic).
- **RTL Support**: The entire layout mirrors for Arabic users, including the cart, menu, and notifications.
- **Skeleton Loading**: Custom skeleton screens prevent layout shifts during initial data fetching.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Framer Motion, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js (Express), MongoDB (Mongoose), Helmet.js (Security), Compression (Performance).
- **Images**: Cloudinary (Automatic resizing and optimization).
- **Deployment**: Vercel-ready with `vercel.json` configuration.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure the following:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Admin Security
ADMIN_ID=admin_identifier
ADMIN_PASSWORD=secure_password_here

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=unsigned_preset_name
```

---

## 📦 Getting Started

### Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server (runs Vite + Express):
   ```bash
   npm run dev
   ```

### Production Build
1. Build the frontend assets:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

---

## 📐 Architecture Details

### Data Flow
- **Menu State**: Fetched once at app root and distributed via props.
- **Promotion Integrity**: Discounts are calculated on the frontend for UX and re-calculated on the backend during order processing to ensure price integrity.
- **Lazy Loading**: `Admin` and `Profile` components are code-split to reduce initial bundle size by ~40%.

### Security Measures
- **Helmet**: Adds secure HTTP headers to prevent common web vulnerabilities.
- **ID/Password Auth**: Server-side validation for admin panel access.
- **Sensitive Data Isolation**: API keys are strictly server-side; client only interacts via proxies.
