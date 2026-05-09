# Burger Station - Enterprise Ordering System

A premium, full-stack smashed burger online ordering system built for speed, conversion, and operational efficiency. This application features a custom promotional engine, localized multilingual support (Arabic/English), and a secure admin dashboard for real-time menu and site management.

---

## 🏗 System Architecture

The application is built as a full-stack JavaScript application using the following architecture:

- **Frontend**: A Single Page Application (SPA) built with React and Vite. It uses Tailwind CSS for utility-first styling and Framer Motion for high-quality animations.
- **Backend**: A Node.js Express server that handles API requests, database interactions, and production static file serving.
- **Database**: MongoDB (Mongoose ODM) for persistent storage of menu items, orders, customers, and settings.
- **Media Storage**: Cloudinary for optimized image delivery and management.

---

## 📂 Project Structure

```text
├── server.ts            # Main application entry point (Express + Vite + DB)
├── deliveryService.ts   # Logic for calculating complex delivery fees
├── vercel.json          # Vercel deployment configuration
├── .env.example         # Template for environment variables
├── src/
│   ├── main.tsx         # Frontend entry point
│   ├── App.tsx          # Root React component (Routing, State Management)
│   ├── types.ts         # Centralized TypeScript interfaces
│   ├── translations.ts  # English/Arabic translation dictionary
│   ├── components/      # Modular React components
│   │   ├── Admin.tsx    # Comprehensive management dashboard
│   │   ├── Navbar.tsx   # Responsive navigation with cart trigger
│   │   ├── Cart.tsx     # Order management and checkout flow
│   │   ├── About.tsx    # Location and branch information
│   │   └── ...          # Atomic UI components (MenuCard, etc.)
│   ├── context/         # React Context stores (Language, Notifications)
│   └── lib/             # Utilities and helpers (utils.ts)
```

---

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

## 📡 API Documentation

All API routes start with `/api`.

### Menu
- `GET /api/menu`: Returns all available items (Cached/Seeded fallback if DB is down).
- `GET /api/admin/menu`: Returns all items including hidden ones (Admin only).

### Orders
- `POST /api/orders`: Submits a new order.
- `GET /api/orders/:phone`: Fetches order history for a specific customer.
- `GET /api/admin/orders`: List all orders in the system.

### Settings
- `GET /api/settings`: Returns public site configuration.
- `PUT /api/settings`: Updates global settings (Store name, Social, Hours).

### Support
- `GET /api/health`: Provides system status (DB connection status and uptime).

---

## 🗄 Database Design

### MenuItem Schema
Items displayed in the menu. Support for categories, variants (sizes), and availability toggles.

### Order Schema
Captures snapshots of items at purchase time, customer details, delivery location, and order status (Pending, Confirmed, Cancelled).

### Settings Schema
A singleton document storing:
- Multi-branch configurations.
- Delivery areas and fees.
- Promotional banners and logic.
- Operating hours (including 24h toggle).

---

## ⚡ Performance Optimizations

### 1. Lazy Loading (Code Splitting)
Significant parts of the application are loaded only when needed:
- `Admin Panel`: Only downloaded when the user accesses the management routes.
- `Profile`: User history is loaded on demand.
- `About`: Non-critical static content is deferred.

### 2. Backend Efficiency
- **Compression**: Gzip compression is enabled for all responses to reduce payload size.
- **Helmet**: Secure headers are applied to mitigate XSS and other common threats.
- **Fast Startup**: The app starts even if the database is lagging, using local fallbacks until a connection is established.

### 3. Image Optimization
Images are served through Cloudinary, which automatically:
- Converts images to modern formats (WebP/AVIF).
- Resizes images based on device requirements.
- Provides a global CDN for low-latency delivery.

---

## 🚀 Deployment Guide

### Vercel Deployment (Recommended)
1.  **Repository**: Push the code to a GitHub/GitLab repository.
2.  **Project Creation**: Link the repository in Vercel.
3.  **Environment Variables**:
    - Add `MONGODB_URI` from MongoDB Atlas.
    - Add `CLOUDINARY_*` keys from your Cloudinary dashboard.
    - Set `ADMIN_ID` and `ADMIN_PASSWORD`.
    - Set `NODE_ENV=production`.
4.  **Automatic Build**: Vercel will use the `vercel.json` and `npm run build` to deploy the server and assets.

### Scaling Configuration
For high-traffic environments:
- Use **MongoDB Atlas** for managed scaling and automated backups.
- Scale **Vercel Functions** to professional tier for longer timeout limits if processing large datasets.
- Enable **Vercel Analytics** to monitor user performance in real-time.

---

## 🛠 Maintenance & SEO

- **Robots.txt**: Located in `/public/robots.txt` to guide search engine crawlers.
- **Meta Tags**: Optimized in `index.html` for social sharing (OpenGraph) and local SEO.
- **Logs**: Backend logs provide visibility into database connection attempts and order processing status.

---

## ⚙️ Quick Start

1. **Install**: `npm install`
2. **Configure**: Copy `.env.example` to `.env` and provide your secrets.
3. **Run Dev**: `npm run dev`
4. **Build**: `npm run build`
5. **Start**: `npm start`
