
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { tenderScraper } from "./tenderScraper";
import { z } from "zod";
import { insertTenderSchema, insertSavedTenderSchema, insertConsortiumSchema, insertConsortiumMemberSchema, insertServiceProviderSchema, insertAiAnalysisSchema } from "@shared/schema";

interface AuthenticatedRequest extends Express.Request {
  user?: {
    claims: {
      sub: string;
    };
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // PayPal payment routes
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Social media and loyalty points routes
  app.post("/api/social/follow-twitter", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.markTwitterFollowed(userId);
      res.json({ 
        success: true, 
        message: "Twitter follow confirmed! You earned 50 loyalty points.",
        points: user.loyaltyPoints,
        twitterUrl: "https://x.com/Supply_ChainKe"
      });
    } catch (error) {
      console.error("Error marking Twitter follow:", error);
      res.status(500).json({ message: "Failed to process Twitter follow" });
    }
  });

  app.post("/api/referral/use", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const { referralCode } = req.body;
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const referrer = await storage.getUserByReferralCode(referralCode);
      if (!referrer) {
        return res.status(404).json({ message: "Invalid referral code" });
      }
      
      await storage.addLoyaltyPoints(referrer.id, 100);
      await storage.addLoyaltyPoints(userId, 50);
      
      res.json({ 
        success: true, 
        message: "Referral applied! You both earned bonus points." 
      });
    } catch (error) {
      console.error("Error processing referral:", error);
      res.status(500).json({ message: "Failed to process referral" });
    }
  });

  app.get("/api/user/loyalty", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      const discount = Math.floor((user?.loyaltyPoints || 0) / 100) * 5;
      
      res.json({
        loyaltyPoints: user?.loyaltyPoints || 0,
        discountPercentage: Math.min(discount, 50),
        referralCode: user?.referralCode,
        isEarlyUser: user?.isEarlyUser,
        subscriptionType: user?.subscriptionType
      });
    } catch (error) {
      console.error("Error fetching loyalty info:", error);
      res.status(500).json({ message: "Failed to fetch loyalty info" });
    }
  });

  // AdMob integration for free subscription through ads
  app.get("/api/ads/status", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      
      // Calculate ad watch data
      const today = new Date().toDateString();
      const thisMonth = new Date().getMonth();
      
      // Mock data for now - in production this would track real ad watches
      const dailyAdsWatched = 3; // Example: user watched 3 ads today
      const monthlyAdsWatched = 45; // Example: user watched 45 ads this month
      const freeSubscriptionDays = monthlyAdsWatched >= 300 ? 30 : 0;
      
      res.json({
        dailyAdsWatched,
        monthlyAdsWatched,
        freeSubscriptionDays,
        lastAdWatchDate: today,
        canWatchAd: dailyAdsWatched < 10
      });
    } catch (error) {
      console.error("Error fetching ad status:", error);
      res.status(500).json({ message: "Failed to fetch ad status" });
    }
  });

  app.post("/api/ads/watch", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Award points for watching ad (10 points per ad)
      await storage.addLoyaltyPoints(userId, 10);
      
      res.json({
        success: true,
        pointsEarned: 10,
        message: "Ad completed successfully!",
        freeSubscriptionMessage: "Keep watching to earn your free month!"
      });
    } catch (error) {
      console.error("Error processing ad watch:", error);
      res.status(500).json({ message: "Failed to process ad watch" });
    }
  });

  // Tender routes
  app.get('/api/tenders', async (req, res) => {
    try {
      const { category, location, search } = req.query;
      const tenders = await storage.getTenders({
        category: category as string,
        location: location as string,
        search: search as string,
      });
      res.json(tenders);
    } catch (error) {
      console.error("Error fetching tenders:", error);
      res.status(500).json({ message: "Failed to fetch tenders" });
    }
  });

  app.get('/api/tenders/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tender = await storage.getTender(id);
      if (!tender) {
        return res.status(404).json({ message: "Tender not found" });
      }
      res.json(tender);
    } catch (error) {
      console.error("Error fetching tender:", error);
      res.status(500).json({ message: "Failed to fetch tender" });
    }
  });

  app.post('/api/tenders', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTenderSchema.parse(req.body);
      const tender = await storage.createTender(validatedData);
      res.json(tender);
    } catch (error) {
      console.error("Error creating tender:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tender data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tender" });
    }
  });

  // Saved tenders routes
  app.get('/api/saved-tenders', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const savedTenders = await storage.getSavedTenders(userId);
      res.json(savedTenders);
    } catch (error) {
      console.error("Error fetching saved tenders:", error);
      res.status(500).json({ message: "Failed to fetch saved tenders" });
    }
  });

  app.post('/api/saved-tenders', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { tenderId } = req.body;
      
      const validatedData = insertSavedTenderSchema.parse({
        userId,
        tenderId: parseInt(tenderId),
      });
      
      const savedTender = await storage.saveTender(validatedData);
      res.json(savedTender);
    } catch (error) {
      console.error("Error saving tender:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save tender" });
    }
  });

  app.delete('/api/saved-tenders/:tenderId', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const tenderId = parseInt(req.params.tenderId);
      
      await storage.unsaveTender(userId, tenderId);
      res.json({ message: "Tender unsaved successfully" });
    } catch (error) {
      console.error("Error unsaving tender:", error);
      res.status(500).json({ message: "Failed to unsave tender" });
    }
  });

  app.get('/api/saved-tenders/:tenderId/check', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const tenderId = parseInt(req.params.tenderId);
      
      const isSaved = await storage.isTenderSaved(userId, tenderId);
      res.json({ isSaved });
    } catch (error) {
      console.error("Error checking saved tender:", error);
      res.status(500).json({ message: "Failed to check saved tender" });
    }
  });

  // Consortium routes
  app.get('/api/consortiums', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const consortiums = await storage.getConsortiums(userId);
      res.json(consortiums);
    } catch (error) {
      console.error("Error fetching consortiums:", error);
      res.status(500).json({ message: "Failed to fetch consortiums" });
    }
  });

  app.get('/api/consortiums/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const consortium = await storage.getConsortium(id);
      if (!consortium) {
        return res.status(404).json({ message: "Consortium not found" });
      }
      res.json(consortium);
    } catch (error) {
      console.error("Error fetching consortium:", error);
      res.status(500).json({ message: "Failed to fetch consortium" });
    }
  });

  app.post('/api/consortiums', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertConsortiumSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      
      const consortium = await storage.createConsortium(validatedData);
      
      // Add creator as admin member
      await storage.joinConsortium({
        consortiumId: consortium.id,
        userId,
        role: 'admin',
      });
      
      res.json(consortium);
    } catch (error) {
      console.error("Error creating consortium:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid consortium data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create consortium" });
    }
  });

  app.post('/api/consortiums/:id/join', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const consortiumId = parseInt(req.params.id);
      
      const validatedData = insertConsortiumMemberSchema.parse({
        consortiumId,
        userId,
        role: 'member',
      });
      
      const member = await storage.joinConsortium(validatedData);
      res.json(member);
    } catch (error) {
      console.error("Error joining consortium:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to join consortium" });
    }
  });

  app.get('/api/consortiums/:id/members', async (req, res) => {
    try {
      const consortiumId = parseInt(req.params.id);
      const members = await storage.getConsortiumMembers(consortiumId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching consortium members:", error);
      res.status(500).json({ message: "Failed to fetch consortium members" });
    }
  });

  // Service provider routes
  app.get('/api/service-providers', async (req, res) => {
    try {
      const { specialization, search } = req.query;
      const providers = await storage.getServiceProviders({
        specialization: specialization as string,
        search: search as string,
      });
      res.json(providers);
    } catch (error) {
      console.error("Error fetching service providers:", error);
      res.status(500).json({ message: "Failed to fetch service providers" });
    }
  });

  app.get('/api/service-providers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const provider = await storage.getServiceProvider(id);
      if (!provider) {
        return res.status(404).json({ message: "Service provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error fetching service provider:", error);
      res.status(500).json({ message: "Failed to fetch service provider" });
    }
  });

  app.post('/api/service-providers', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const validatedData = insertServiceProviderSchema.parse({
        ...req.body,
        userId,
      });
      
      const provider = await storage.createServiceProvider(validatedData);
      res.json(provider);
    } catch (error) {
      console.error("Error creating service provider:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service provider" });
    }
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // AI Analysis routes
  app.get('/api/ai-analysis/:tenderId', async (req, res) => {
    try {
      const tenderId = parseInt(req.params.tenderId);
      const analysis = await storage.getAiAnalysis(tenderId);
      
      if (!analysis) {
        // Create mock AI analysis if none exists
        const mockAnalysis = {
          tenderId,
          estimatedValueMin: Math.floor(Math.random() * 50000000) + 10000000, // 10M - 60M
          estimatedValueMax: Math.floor(Math.random() * 50000000) + 60000000, // 60M - 110M
          winProbability: Math.floor(Math.random() * 40) + 40, // 40% - 80%
          recommendations: [
            "Focus on local partnership opportunities",
            "Highlight previous similar project experience",
            "Consider consortium formation for better competitiveness"
          ],
          confidenceScore: Math.floor(Math.random() * 30) + 70, // 70% - 100%
        };
        
        const newAnalysis = await storage.createAiAnalysis(mockAnalysis);
        return res.json(newAnalysis);
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      res.status(500).json({ message: "Failed to fetch AI analysis" });
    }
  });

  // Mock data seeding endpoint (development only)
  app.post('/api/seed-data', async (req, res) => {
    try {
      // Create sample categories
      const categories = [
        { name: "Construction", description: "Building and infrastructure projects" },
        { name: "IT Services", description: "Technology and software solutions" },
        { name: "Consultancy", description: "Professional advisory services" },
        { name: "Supplies", description: "Goods and materials procurement" },
        { name: "Healthcare", description: "Medical and health services" },
        { name: "Education", description: "Educational services and materials" },
      ];

      for (const category of categories) {
        await storage.createCategory(category);
      }

      // Create sample tenders
      const sampleTenders = [
        {
          title: "Construction of Modern Primary School in Kiambu County",
          description: "Seeking qualified contractors for the construction of a modern 16-classroom primary school facility with administrative block, library, and playground in Kiambu County.",
          organization: "Ministry of Education",
          category: "Construction",
          location: "Kiambu County",
          budgetEstimate: 48500000,
          deadline: "2024-03-15",
          status: "active" as const,
          requirements: ["Valid construction license", "Previous school construction experience", "Financial capacity of KSh 50M"],
          documents: ["Technical specifications", "Bill of quantities", "Site plans"],
        },
        {
          title: "Digital Transformation Platform for County Operations",
          description: "Implementation of comprehensive digital platform for county service delivery including citizen portal, document management system, and mobile applications.",
          organization: "Machakos County Government",
          category: "IT Services",
          location: "Machakos County",
          budgetEstimate: 22000000,
          deadline: "2024-03-22",
          status: "active" as const,
          requirements: ["ISO 27001 certification", "Previous government project experience", "Local partnership"],
          documents: ["Technical requirements", "System architecture", "Security specifications"],
        },
        {
          title: "Environmental Impact Assessment for Infrastructure Development",
          description: "Comprehensive environmental impact assessment and mitigation planning for proposed highway expansion project connecting Nairobi to Western Kenya.",
          organization: "Kenya National Highways Authority (KeNHA)",
          category: "Consultancy",
          location: "Multi-County",
          budgetEstimate: 9800000,
          deadline: "2024-03-28",
          status: "active" as const,
          requirements: ["Environmental consultant license", "NEMA certification", "Highway project experience"],
          documents: ["Project scope", "Environmental guidelines", "Assessment framework"],
        },
      ];

      for (const tender of sampleTenders) {
        await storage.createTender(tender);
      }

      // Create sample service providers with proper rating as string
      const sampleProviders = [
        {
          userId: "sample-user-1",
          name: "David Kariuki",
          email: "david@legalconsult.co.ke",
          phone: "+254712345678",
          specialization: "Legal & Compliance Consultant",
          description: "Specialized in tender documentation, compliance auditing, and legal review services for construction and consultancy projects.",
          experience: 8,
          rating: "4.90",
          reviewCount: 127,
          hourlyRate: 5000,
          availability: "available" as const,
          certifications: ["LSK Advocate", "Certified Compliance Officer"],
          portfolio: ["Tender documentation for 50+ projects", "Legal compliance for government contracts"],
        },
        {
          userId: "sample-user-2",
          name: "Grace Wanjiku",
          email: "grace@techwriting.co.ke",
          phone: "+254723456789",
          specialization: "Technical Writing Specialist",
          description: "Expert in crafting winning tender proposals, technical specifications, and project documentation for government contracts.",
          experience: 6,
          rating: "4.70",
          reviewCount: 89,
          hourlyRate: 7500,
          availability: "available" as const,
          certifications: ["Certified Technical Writer", "Project Management Professional"],
          portfolio: ["200+ successful tender proposals", "Technical documentation for IT projects"],
        },
        {
          userId: "sample-user-3",
          name: "Michael Ochieng",
          email: "michael@qsservices.co.ke",
          phone: "+254734567890",
          specialization: "Quantity Surveying & Estimation",
          description: "Professional quantity surveyor providing accurate cost estimates, bill of quantities, and project valuation services.",
          experience: 12,
          rating: "5.00",
          reviewCount: 156,
          hourlyRate: 10000,
          availability: "busy" as const,
          certifications: ["Registered Quantity Surveyor", "IQSK Member"],
          portfolio: ["Cost estimation for 100+ construction projects", "BOQ preparation for government tenders"],
        },
      ];

      for (const provider of sampleProviders) {
        await storage.createServiceProvider(provider);
      }

      res.json({ message: "Sample data seeded successfully" });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  // Start tender scraping on server startup
  console.log('Starting tender scraping service...');
  tenderScraper.startPeriodicScraping();

  const httpServer = createServer(app);
  return httpServer;
}
