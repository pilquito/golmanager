import { User, Organization } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      organization?: Organization;
      orgId?: string;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    organizationId?: string;
  }
}

export {};
