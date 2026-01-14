import session from "express-session";
import type { Express, RequestHandler, Request } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { loginSchema, registerSchema, type LoginData, type RegisterData, type InsertOrganization } from "@shared/schema";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
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
    req.orgId = user.organizationId || undefined;
    
    if (user.organizationId) {
      const org = await storage.getOrganization(user.organizationId);
      req.organization = org;
    }
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  if (!req.user || (req.user as any).role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
};

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}

export function getOrgId(req: Request): string {
  const orgId = req.orgId || (req.user as any)?.organizationId;
  if (!orgId) {
    throw new Error("Organization ID not found in request");
  }
  return orgId;
}

export async function loginUser(loginData: LoginData) {
  const validatedData = loginSchema.parse(loginData);
  const user = await storage.validateUserCredentialsByEmail(validatedData.email, validatedData.password);
  
  if (!user) {
    throw new Error("Email o contraseña incorrectos");
  }
  
  if (!user.isActive) {
    throw new Error("La cuenta está desactivada");
  }
  
  return user;
}

export async function registerUser(registerData: RegisterData & { organizationId?: string }) {
  const validatedData = registerSchema.parse(registerData);
  
  // Check email uniqueness
  const existingUser = await storage.getUserByEmail(validatedData.email);
  if (existingUser) {
    throw new Error("Ya existe una cuenta con este email");
  }
  
  const { confirmPassword, ...userData } = validatedData;
  return await storage.createUser({
    ...userData,
    organizationId: registerData.organizationId || null,
  });
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

export async function registerUserWithOrganization(
  registerData: RegisterData,
  orgData: { name: string; slug?: string; logoUrl?: string | null }
) {
  const validatedData = registerSchema.parse(registerData);
  
  // Check email uniqueness
  const existingUser = await storage.getUserByEmail(validatedData.email);
  if (existingUser) {
    throw new Error("Ya existe una cuenta con este email");
  }
  
  const baseSlug = orgData.slug || generateSlug(orgData.name);
  let slug = baseSlug;
  let counter = 1;
  
  while (await storage.getOrganizationBySlug(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  const organization = await storage.createOrganization({
    ...orgData,
    slug,
  });
  
  const { confirmPassword, ...userData } = validatedData;
  const user = await storage.createUser({
    ...userData,
    organizationId: organization.id,
    role: 'admin',
  });
  
  await storage.updateTeamConfig({
    teamName: organization.name,
  }, organization.id);
  
  return { user, organization };
}
