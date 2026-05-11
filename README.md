# أبو علي فرايد تشيكن | Abu Ali Fried Chicken 🍗

Welcome to the official repository for **Abu Ali Fried Chicken**, a high-performance, mobile-first ordering application designed for the modern food industry. This system combines the power of React, Node.js, and MongoDB to deliver a seamless customer experience from browsing to checkout.

---

## 🏛 Project Identity & Branding

The application has been fully customized for the **Abu Ali** brand:
- **Brand Name**: Abu Ali Fried Chicken (أبو علي فرايد تشيكن).
- **Core Aesthetic**: Professional food catalog design with high-contrast typography and fluid motion.
- **Visuals**: Features the custom "Abu Ali" logo and branding throughout the app, including loading screens and PWA icons.

---

## 🚀 Key Features

### 🛒 Ordering & Checkout
- **Real-time Cart**: Instant calculation of subtotals, delivery fees, and promotional discounts.
- **WhatsApp Integration**: Orders are formatted and sent directly to the branch's WhatsApp, ensuring zero-latency communication.
- **Multilingual (L10n)**: Full support for **Arabic (RTL)** and **English (LTR)** with instant language switching.
- **Profile System**: Saves customer details (Phone, Address) locally for faster future orders.

### 🍱 Dynamic Menu Catalog
- **Category Filtering**: Seamlessly switch between Burgers, Meals, Fries, and Drinks.
- **Variants & Add-ons**: Support for different sizes and options for each menu item.
- **Visual Excellence**: Images managed via Cloudinary for blazing-fast load times through a Global CDN.

### 🛡️ Management Dashboard
- **Menu Management**: Full CRUD (Create, Read, Update, Delete) for menu items.
- **Live Orders**: Real-time order monitoring with status updates (Pending, Out for Delivery, Completed).
- **Global Settings**: Control branch locations, delivery fees per area, social links, and operating hours.
- **Promotional Engine**: Complex logic for "Buy X Get Y" or percentage-based discounts.

### 📱 Progressive Web App (PWA)
- **Installable**: Users can add the app to their home screen on iOS and Android.
- **Offline Support**: Core assets are cached via Service Workers for availability even in poor network conditions.
- **Native Look**: Includes a custom manifest, theme colors, and splash screens for a native app feel.

---

## 📂 System Architecture

```text
├── server.ts            # Express server (API routes, DB models, Vite middleware)
├── deliveryService.ts   # Logic for calculating area-based delivery fees
├── public/              # Static assets (logo, manifest, service worker)
├── src/
│   ├── App.tsx          # Main routing and global state (Cart, User, Settings)
│   ├── components/      # Reusable UI components (Navbar, Cart, Profile)
│   │   ├── Admin.tsx    # Secure management panel
│   │   ├── About.tsx    # Location and branch info
│   │   └── ...
│   ├── context/         # React Context (Language, Notifications)
│   ├── translations.ts  # Multilingual dictionary
│   └── types.ts         # TypeScript definitions
```

---

## ⚡ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **Backend** | Node.js, Express |
| **Database** | MongoDB (Mongoose) |
| **Media** | Cloudinary (Image Hosting & Optimization) |
| **Icons** | Lucide React |

---

## 🛠 Installation & Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account (or local MongoDB)
- Cloudinary Account (for image uploads)

### 2. Quick Start
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## ⚙️ Environment Variables

The following variables must be configured in your `.env` file or hosting provider:

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | Your MongoDB connection string. |
| `ADMIN_ID` | The username for the admin dashboard (Default: `admin66`). |
| `ADMIN_PASSWORD` | The password for the admin dashboard. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |
| `PORT` | The server port (Default: `3000`). |

---

## 🔒 Security & Performance
- **Optimized Loading**: Code-splitting ensures that the heavy Admin dashboard is only downloaded when needed.
- **Secure API**: Admin routes are protected via authenticated session checks.
- **Data Integrity**: Uses Mongoose schemas to ensure consistent data storage for orders and settings.
- **Image CDN**: Automated resizing and WebP conversion via Cloudinary to minimize bandwidth usage.

---

## 👨‍💻 Maintenance & SEO
- **SEO Ready**: Optimized meta tags and `robots.txt` for search engine visibility.
- **Logging**: Detailed backend logs for order tracking and database health monitoring.
- **Scalable**: Built to handle multi-branch operations with ease.

---
© 2026 Abu Ali Fried Chicken. Crafted for flavor and performance.
