import express from "express";
import { createServer as createViteServer } from "vite";
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

import { getDeliveryFee } from "./deliveryService.ts";

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
  const PORT = 3000;

  // MongoDB Connection
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/burger-station";
  
  // Disable buffering to prevent the app from hanging when DB is unavailable
  mongoose.set('bufferCommands', false);

  let isDbConnected = false;

  console.log("Connecting to MongoDB...");
  try {
    // In production, we might want to wait for DB before serving any traffic
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, 
    });
    console.log("Connected to MongoDB");
    isDbConnected = true;
  } catch (err) {
    console.error("CRITICAL: MongoDB connection failed:", err);
    console.warn("Notice: Starting in degraded mode (No database).");
  }

  app.use(cors());
  app.use(helmet({
    contentSecurityPolicy: false, // CSP can break the preview environment
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: isDbConnected ? "ok" : "degraded", 
      message: isDbConnected ? "Burger Station API is running" : "Burger Station API is running (Database disconnected)"
    });
  });

  // Menu Schema
  const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    nameAr: { type: String },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    category: { type: String, required: true, enum: ["Burger", "Meals", "Fries", "Drinks"] },
    image: { type: String },
    imagePublicId: { type: String },
    description: { type: String },
    descriptionAr: { type: String },
    isAvailable: { type: Boolean, default: true },
    variants: [{
      id: String,
      name: String,
      nameAr: String,
      price: Number
    }]
  });

  const MenuItem = mongoose.model("MenuItem", menuItemSchema);

  // Schema for Orders
  const orderSchema = new mongoose.Schema({
    items: [{
      name: String,
      price: Number,
      quantity: Number
    }],
    subtotal: Number,
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: Number,
    selectedArea: String,
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
    areas: [{
      id: String,
      name: String,
      nameAr: String,
      fee: { type: Number, default: 0 },
      _id: false
    }]
  }, { _id: false });

  const settingsSchema = new mongoose.Schema({
    storeName: { type: String, default: "Abu Ali Fried Chicken" },
    storeNameAr: { type: String, default: "أبو علي فرايد تشيكن" },
    defaultDeliveryFee: { type: Number, default: 0 },
    freeDeliveryThreshold: { type: Number, default: 0 },
    socialLinks: {
      facebook: String,
      instagram: String,
      whatsapp: String,
      tiktok: String,
    },
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
    if (!isDbConnected) {
      console.log("Seeding skipped: Database not connected.");
      return;
    }

    try {
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
        },
        {
          name: "Family Bucket (12 Pieces)",
          nameAr: "باكيت العائلة (١٢ قطعة)",
          price: 380,
          category: "Meals",
          image: "https://images.unsplash.com/photo-1541944743827-e04bb645f946?auto=format&fit=crop&q=80&w=800",
          description: "12 pieces of original or spicy chicken, large fries, large coleslaw, and 6 bread.",
          descriptionAr: "١٢ قطعة دجاج (عادي أو حار)، بطاطس عائلية، كول سلو عائلي، و٦ خبز."
        }
      ];
      await MenuItem.insertMany(initialItems);
      console.log("Seeding complete.");
    }
  } catch (err) {
    console.error("Seeding database error:", err);
  }
};
seedData();

// Hardcoded fallback items for when database is unavailable
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
  },
  {
    _id: "fb2",
    name: "Mushroom Swiss",
    nameAr: "مشروم سويس",
    price: 145,
    category: "Burger",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800",
    description: "Smashed beef patties, melted swiss cheese, and caramelized mushrooms.",
    descriptionAr: "قطع لحم مفروم، جبنة سويسرية، ومشروم مكرمل.",
    isAvailable: true
  }
];

// Get all menu items
app.get("/api/menu", async (req, res) => {
  if (!isDbConnected) {
    return res.json(fallbackItems);
  }
  try {
      const items = await MenuItem.find({ isAvailable: true });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  // Customer endpoints
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
        { 
          name, 
          address, 
          notes, 
          favoriteBranchId: branchId, 
          favoriteAreaId: areaId, 
          updatedAt: new Date() 
        },
        { upsert: true, new: true }
      );
      res.json(customer);
    } catch (err) {
      res.status(500).json({ error: "Failed to save customer" });
    }
  });

  // Order endpoints
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
      const { items, subtotal, discount, deliveryFee, total, selectedArea, customerName, phone, address, notes } = req.body;
      
      // Basic validation
      if (!items || items.length === 0) return res.status(400).json({ error: "Empty cart" });

      const order = new Order({
        items,
        subtotal: subtotal || items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
        discount: discount || 0,
        deliveryFee: deliveryFee || 0,
        total: total || 0,
        selectedArea,
        customerName,
        phone,
        address,
        notes
      });
      
      await order.save();
      res.json(order);
    } catch (err) {
      console.error("Order save error:", err);
      res.status(500).json({ error: "Failed to save order" });
    }
  });

  // Delivery fee endpoint
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

  // Admin: Update order (status, delivery fee, etc.)
  app.put("/api/admin/orders/:id", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      const { status, deliveryFee, cancelReason } = req.body;
      const order = await Order.findById(req.params.id);
      
      if (!order) return res.status(404).json({ error: "Order not found" });

      if (status) order.status = status;
      if (cancelReason) order.cancelReason = cancelReason;
      
      if (typeof deliveryFee === 'number') {
        order.deliveryFee = deliveryFee;
        order.total = order.subtotal + deliveryFee;
      }

      await order.save();
      res.json(order);
    } catch (err) {
      res.status(400).json({ error: "Failed to update order" });
    }
  });

  // Admin routes
  app.post("/api/admin/login", (req, res) => {
    const { adminId, password } = req.body;
    const expectedId = process.env.ADMIN_ID || "admin66";
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    if (adminId === expectedId && password === expectedPassword) {
      res.json({ token: "admin-session-token" });
    } else {
      res.status(401).json({ error: "Invalid ID or password" });
    }
  });

  // Admin Menu Management
  app.get("/api/admin/menu", async (req, res) => {
    if (!isDbConnected) return res.json(fallbackItems);
    try {
      const items = await MenuItem.find().sort({ category: 1, name: 1 });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch admin menu" });
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

  // Admin Order Management
  app.get("/api/admin/orders", async (req, res) => {
    if (!isDbConnected) return res.json([]);
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch all orders" });
    }
  });

  app.get("/api/admin/orders/:id", async (req, res) => {
    if (!isDbConnected) return res.status(404).json({ error: "Not found" });
    try {
      const order = await Order.findById(req.params.id);
      res.json(order);
    } catch (err) {
      res.status(404).json({ error: "Order not found" });
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

  // Admin Customer Management
  app.get("/api/admin/customers", async (req, res) => {
    if (!isDbConnected) return res.json([]);
    try {
      const customers = await Customer.find().sort({ updatedAt: -1 });
      res.json(customers);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch all customers" });
    }
  });

  app.delete("/api/admin/customers/:id", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      await Customer.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Failed to delete customer" });
    }
  });

  app.post("/api/admin/upload", upload.single('image'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ 
      url: req.file.path,
      public_id: req.file.filename // For Cloudinary, filename is usually the public_id or contains it
    });
  });

  app.post("/api/admin/remove-image", async (req, res) => {
    const { public_id } = req.body;
    if (!public_id) return res.status(400).json({ error: "No public_id provided" });
    try {
      await cloudinary.uploader.destroy(public_id);
      res.json({ success: true });
    } catch (err) {
      console.error("Cloudinary destroy error:", err);
      res.status(500).json({ error: "Failed to remove image" });
    }
  });

  app.post("/api/admin/menu", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      const newItem = new MenuItem(req.body);
      await newItem.save();
      res.status(201).json(newItem);
    } catch (err) {
      res.status(400).json({ error: "Failed to create menu item" });
    }
  });

  // Settings endpoints
  app.get("/api/settings", async (req, res) => {
    if (!isDbConnected) {
      return res.json({
        storeName: "Abu Ali Fried Chicken",
        storeNameAr: "أبو علي فرايد تشيكن",
        defaultDeliveryFee: 0,
        areas: [],
        socialLinks: { facebook: "", instagram: "", whatsapp: "", tiktok: "" },
        branches: []
      });
    }
    try {
      let settings = await Settings.findOne();
      if (!settings) {
        settings = new Settings({
          storeName: "Abu Ali Fried Chicken",
          storeNameAr: "أبو علي فرايد تشيكن",
          defaultDeliveryFee: 0,
          areas: [],
          socialLinks: { facebook: "", instagram: "", whatsapp: "", tiktok: "" },
          branches: []
        });
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
      let settings = await Settings.findOne();
      if (settings) {
        settings = await Settings.findByIdAndUpdate(settings._id, { ...req.body, updatedAt: new Date() }, { new: true });
      } else {
        settings = new Settings(req.body);
        await settings.save();
      }
      res.json(settings);
    } catch (err) {
      res.status(400).json({ error: "Failed to update settings" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    if (!isDbConnected) return res.status(500).json({ error: "Database disconnected" });
    try {
      let settings = await Settings.findOne();
      if (settings) {
        settings = await Settings.findByIdAndUpdate(settings._id, { ...req.body, updatedAt: new Date() }, { new: true });
      } else {
        settings = new Settings(req.body);
        await settings.save();
      }
      res.json(settings);
    } catch (err) {
      res.status(400).json({ error: "Failed to update settings" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
