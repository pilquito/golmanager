import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { loginSchema, registerSchema, type LoginData, type RegisterData } from "@shared/schema";

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "fallback-secret-for-dev",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Admin-only middleware
export const isAdmin: RequestHandler = async (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
};

// Setup authentication system
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}

// Login function
export async function loginUser(loginData: LoginData) {
  const validatedData = loginSchema.parse(loginData);
  const user = await storage.validateUserCredentials(validatedData.username, validatedData.password);
  
  if (!user) {
    throw new Error("Invalid username or password");
  }
  
  if (!user.isActive) {
    throw new Error("Account is deactivated");
  }
  
  return user;
}

// Register function
export async function registerUser(registerData: RegisterData) {
  const validatedData = registerSchema.parse(registerData);
  
  // Check if username already exists
  const existingUser = await storage.getUserByUsername(validatedData.username);
  if (existingUser) {
    throw new Error("Username already exists");
  }
  
  // Check if email already exists (if provided)
  if (validatedData.email) {
    // We could add email uniqueness check here if needed
  }
  
  const { confirmPassword, ...userData } = validatedData;
  return await storage.createUser(userData);
}