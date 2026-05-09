# Burger Station - Enterprise Ordering System

A premium, full-stack smashed burger online ordering system built for speed, conversion, and operational efficiency. This application features a custom promotional engine, localized multilingual support (Arabic/English), and a secure admin dashboard for real-time menu and site management.

---

## 📖 Documentation
A complete technical guide is available in [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).

## 🚀 Key Features

### 🛒 Ordering Experience
- **Fluid UI**: Built with React and Framer Motion for smooth transitions and high-end feel.
- **Dynamic Cart**: Real-time subtotal calculation with automatic discount application.
- **WhatsApp Integration**: Seamlessly sends formatted orders directly to the restaurant's WhatsApp business account.
- **Lazy Loading**: Code splitting used for non-critical modules (Admin, Profile, About) resulting in ~40% faster initial loads.

### 🏷️ Advanced Promotional Engine
A specialized logic layer (`promoUtils.ts`) that handles:
- **Buy X Get Y Free**: Automatically applies "Cheapest Item Free" logic.
- **Fixed & Percentage Discounts**: Automated savings calculated on eligible cart items.

### 🛡️ Admin Dashboard
- **Secure Access**: Protected via environmental authentication.
- **Menu Management**: CRUD operations with Cloudinary-backed image optimization.
- **Site Settings**: Customize operating hours (including 24/7 support), store name, and branch details.

---

## ⚡ Production Readiness
This application is finalized with production-grade optimizations:
- **Resilient DB Connection**: Automatic retry logic for MongoDB connection.
- **Performance Pack**: Integrated Gzip compression and secure Helmet headers.
- **Vercel Native**: Pre-configured `vercel.json` for serverless deployment of the Express + Vite stack.
- **Health Monitoring**: `/api/health` endpoint for monitoring system stability.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Framer Motion, Tailwind CSS.
- **Backend**: Node.js (Express), MongoDB (Mongoose), Multer/Cloudinary.
- **Security**: Helmet, CORS, Environment isolation.

---

## ⚙️ Quick Start

1. **Install**: `npm install`
2. **Configure**: Copy `.env.example` to `.env` and provide your secrets.
3. **Run Dev**: `npm run dev`
4. **Build**: `npm run build`
5. **Start**: `npm start`


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
