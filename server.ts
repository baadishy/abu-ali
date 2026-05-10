import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

import { getDeliveryFee } from "./deliveryService.js";

dotenv.config();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'burger-station',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  } as any,
});

const upload = multer({ storage: storage });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // MongoDB Connection
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI && process.env.NODE_ENV === "production") {
    console.error("FATAL: MONGODB_URI is not defined in production environment.");
    process.exit(1);
  }
  const dbUri = MONGODB_URI || "mongodb://localhost:27017/burger-station";
  
  mongoose.set('bufferCommands', false);
  let isDbConnected = false;

  const connectWithRetry = async () => {
    console.log("Connecting to MongoDB...");
    try {
      await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 10000 });
      console.log("Successfully connected to MongoDB");
      isDbConnected = true;
    } catch (err) {
      console.error("MongoDB connection failed:", err);
      if (process.env.NODE_ENV === "production") {
        console.warn("Retrying connection in 5 seconds...");
        setTimeout(connectWithRetry, 5000);
      } else {
        console.warn("Notice: Starting in degraded mode (No database).");
      }
    }
  };

  app.use(cors());
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());
  app.use(express.json());

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: isDbConnected ? "ok" : "degraded", 
      message: isDbConnected ? "Burger Station API is running" : "Burger Station API is running (Database disconnected)",
      timestamp: new Date().toISOString()
    });
  });

  // Category Schema
  const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    nameAr: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    order: { type: Number, default: 0 },
  }, { timestamps: true });
  
  const Category = mongoose.model('Category', categorySchema);

  // Menu Schema
  const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    nameAr: { type: String },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    category: { type: String, required: true },
    image: { type: String },
    imagePublicId: { type: String },
    description: { type: String },
    descriptionAr: { type: String },
    isAvailable: { type: Boolean, default: true },
    variants: [{ id: String, name: String, nameAr: String, price: Number }]
  });

  const MenuItem = mongoose.model("MenuItem", menuItemSchema);

  // Schema for Orders
  const orderSchema = new mongoose.Schema({
    items: [{ name: String, price: Number, quantity: Number }],
    subtotal: Number,
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: Number,
    selectedArea: String,
    branchId: String,
    branchName: String,
    branchNameAr: String,
    areaId: String,
    areaName: String,
    areaNameAr: String,
    customerName: String,
    phone: String,
    address: String,
    notes: String,
    status: { type: String, default: "Pending" },
    cancelReason: String,
    createdAt: { type: Date, default: Date.now },
  });

  const Order = mongoose.model("Order", orderSchema);

  // Schema for Website Settings
  const branchSchema = new mongoose.Schema({
    id: String,
    name: String,
    nameAr: String,
    address: String,
    addressAr: String,
    phones: [String],
    mapUrl: String,
    deliveryFee: { type: Number, default: 0 },
    areas: [{ id: String, name: String, nameAr: String, fee: { type: Number, default: 0 }, _id: false }]
  }, { _id: false });

  const settingsSchema = new mongoose.Schema({
    storeName: { type: String, default: "Abu Ali Fried Chicken" },
    storeNameAr: { type: String, default: "أبو علي فرايد تشيكن" },
    defaultDeliveryFee: { type: Number, default: 0 },
    freeDeliveryThreshold: { type: Number, default: 0 },
    socialLinks: { facebook: String, instagram: String, whatsapp: String, tiktok: String },
    branches: [branchSchema],
    offers: [{
      id: String,
      title: String,
      titleAr: String,
      description: String,
      descriptionAr: String,
      image: String,
      imagePublicId: String,
      isActive: { type: Boolean, default: true },
      type: { type: String, enum: ['buy_x_get_y', 'fixed_discount', 'percentage_discount', 'manual'], default: 'manual' },
      buyQuantity: Number,
      getQuantity: Number,
      categoryLimit: String,
      discountValue: Number,
      branchIds: [String]
    }],
    featuredItemId: String,
    hotlineNumbers: [String],
    openingTime: { type: String, default: "11:00 AM" },
    closingTime: { type: String, default: "02:00 AM" },
    isOpen24Hours: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
  });

  const Settings = mongoose.model("Settings", settingsSchema);

  // Schema for Customers
  const customerSchema = new mongoose.Schema({
    name: String,
    phone: { type: String, unique: true },
    address: String,
    notes: String,
    favoriteBranchId: String,
    favoriteAreaId: String,
    updatedAt: { type: Date, default: Date.now },
  });

  const Customer = mongoose.model("Customer", customerSchema);

  // Seed initial data
  const seedData = async () => {
    if (!isDbConnected) return;
    try {
      const categoryCount = await Category.countDocuments();
      if (categoryCount === 0) {
        console.log("Seeding initial category data...");
        const initialCategories = [
          { name: "Burger", nameAr: "برجر", slug: "Burger", order: 1 },
          { name: "Meals", nameAr: "وجبات", slug: "Meals", order: 2 },
          { name: "Fries", nameAr: "بطاطس", slug: "Fries", order: 3 },
          { name: "Drinks", nameAr: "مشروبات", slug: "Drinks", order: 4 },
        ];
        await Category.insertMany(initialCategories);
      }

      const count = await MenuItem.countDocuments();
      if (count === 0) {
        console.log("Seeding initial menu data...");
        const initialItems = [
          {
            name: "Original Fried Chicken Meal",
            nameAr: "وجبة الدجاج المقلي الأصلية",
            price: 150,
            category: "Meals",
            image: "https://images.unsplash.com/photo-1626645738196-c2a7c8d08f58?auto=format&fit=crop&q=80&w=800",
            description: "4 pieces of our signature original recipe fried chicken, served with fries, coleslaw, and bread.",
            descriptionAr: "٤ قطع من الدجاج المقلي بخلطتنا الأصلية، تقدم مع البطاطس، كول سلو، وخبز."
          },
          {
            name: "Spicy Zinger Burger",
            nameAr: "زنجر برجر حار",
            price: 95,
            category: "Burger",
            image: "https://images.unsplash.com/photo-1610614819513-58e3524cc44a?auto=format&fit=crop&q=80&w=800",
            description: "Crispy spicy chicken breast, lettuce, tomato, and spicy mayo.",
            descriptionAr: "صدر دجاج مقرمش حار، خس، طماطم، ومايونيز حار."
          }
        ];
        await MenuItem.insertMany(initialItems);
      }
    } catch (err) {
      console.error("Seeding database error:", err);
    }
  };

  const fallbackItems = [
    {
      _id: "fb1",
      name: "Classic Smash Burger",
      nameAr: "كلاسيك سماش برجر",
      price: 120,
      category: "Burger",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
      description: "Double smashed beef patties, cheddar cheese, pickles, and our signature sauce.",
      descriptionAr: "قطعتين لحم مفروم، جبنة شيدر، خيار مخلل، وصوص ستايشن المميز.",
      isAvailable: true
    }
  ];

  // API Endpoints
  app.get("/api/categories", async (req, res) => {
    if (!isDbConnected) return res.json([
      { name: "Burger", nameAr: "برجر", slug: "Burger", order: 1 },
      { name: "Meals", nameAr: "وجبات", slug: "Meals", order: 2 },
      { name: "Fries", nameAr: "بطاطس", slug: "Fries", order: 3 },
      { name: "Drinks", nameAr: "مشروبات", slug: "Drinks", order: 4 },
    ]);
    try {
      const categories = await Category.find().sort({ order: 1 });
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/menu", async (req, res) => {
    if (!isDbConnected) return res.json(fallbackItems);
    try {
      const items = await MenuItem.find({ isAvailable: true });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  app.get("/api/customer/:phone", async (req, res) => {
    if (!isDbConnected) return res.status(200).json({});
    try {
      const customer = await Customer.findOne({ phone: req.params.phone });
      res.json(customer || {});
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customer", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      const { phone, name, address, notes, branchId, areaId } = req.body;
      const customer = await Customer.findOneAndUpdate(
        { phone },
        { name, address, notes, favoriteBranchId: branchId, favoriteAreaId: areaId, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      res.json(customer);
    } catch (err) {
      res.status(500).json({ error: "Failed to save customer" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    if (!isDbConnected) return res.json([]);
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:phone", async (req, res) => {
    if (!isDbConnected) return res.json([]);
    try {
      const orders = await Order.find({ phone: req.params.phone }).sort({ createdAt: -1 });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      const order = new Order(req.body);
      await order.save();
      res.json(order);
    } catch (err) {
      res.status(500).json({ error: "Failed to save order" });
    }
  });

  app.get("/api/delivery-fee", async (req, res) => {
    if (!isDbConnected) return res.json({ deliveryFee: 0 });
    try {
      const areaName = req.query.area as string;
      const deliveryFee = await getDeliveryFee(areaName);
      res.json({ deliveryFee });
    } catch (err) {
      res.status(500).json({ error: "Failed to calculate delivery fee" });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    if (!isDbConnected) return res.json([]);
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.put("/api/admin/orders/:id", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(order);
    } catch (err) {
      res.status(400).json({ error: "Failed to update order" });
    }
  });

  app.delete("/api/admin/orders/:id", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      await Order.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Failed to delete order" });
    }
  });

  app.post("/api/admin/login", (req, res) => {
    const { adminId, password } = req.body;
    if (adminId === (process.env.ADMIN_ID || "admin66") && password === (process.env.ADMIN_PASSWORD || "admin123")) {
      res.json({ token: "admin-session-token" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/admin/menu", async (req, res) => {
    if (!isDbConnected) return res.json(fallbackItems);
    try {
      const items = await MenuItem.find().sort({ category: 1, name: 1 });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch admin menu" });
    }
  });

  app.post("/api/admin/menu", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      const item = new MenuItem(req.body);
      await item.save();
      res.json(item);
    } catch (err) {
      res.status(400).json({ error: "Failed to create menu item" });
    }
  });

  app.put("/api/admin/menu/:id", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(item);
    } catch (err) {
      res.status(400).json({ error: "Failed to update menu item" });
    }
  });

  app.delete("/api/admin/menu/:id", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      await MenuItem.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Failed to delete menu item" });
    }
  });

  app.get("/api/admin/categories", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      const categories = await Category.find().sort({ order: 1 });
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      const category = new Category(req.body);
      await category.save();
      res.json(category);
    } catch (err) {
      res.status(400).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(category);
    } catch (err) {
      res.status(400).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      await Category.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Failed to delete category" });
    }
  });

  app.get("/api/admin/customers", async (req, res) => {
    if (!isDbConnected) return res.json([]);
    try {
      const customers = await Customer.find().sort({ updatedAt: -1 });
      res.json(customers);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.post("/api/admin/upload", upload.single('image'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: req.file.path, public_id: req.file.filename });
  });

  app.post("/api/admin/remove-image", async (req, res) => {
    try {
      const { public_id } = req.body;
      if (!public_id) return res.status(400).json({ error: "No public_id provided" });
      await cloudinary.uploader.destroy(public_id);
      res.json({ success: true });
    } catch (err) {
      console.error("Cloudinary Error:", err);
      res.status(500).json({ error: "Failed to remove image" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    if (!isDbConnected) return res.json({ storeName: "Abu Ali Fried Chicken", branches: [] });
    try {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings({});
        await settings.save();
      }
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      const settings = await Settings.findOneAndUpdate({}, req.body, { upsert: true, new: true });
      res.json(settings);
    } catch (err) {
      res.status(400).json({ error: "Failed to update settings" });
    }
  });
  
  app.post("/api/admin/settings", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      const settings = await Settings.findOneAndUpdate({}, req.body, { upsert: true, new: true });
      res.json(settings);
    } catch (err) {
      res.status(400).json({ error: "Failed to update settings" });
    }
  });

  // Basic 404 handler for API
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API Route not found" });
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Error Handler:", err);
    res.status(err.status || 500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message
    });
  });

  // Database Connection
  await connectWithRetry();
  if (isDbConnected) await seedData();

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
