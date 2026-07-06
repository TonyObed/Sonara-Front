import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getContacts } from "@/app/api/contacts/route";
import { GET as getLiveCalls } from "@/app/api/calls/live/route";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    contact: { findMany: vi.fn() },
    blacklist: { findMany: vi.fn() },
    call: { findMany: vi.fn() }
  },
}));

vi.mock("@/lib/auth", () => ({
  authenticateRequest: vi.fn(),
}));

describe("Endpoints Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/contacts", () => {
    it("retourne 401 si non authentifié", async () => {
      vi.mocked(authenticateRequest).mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/contacts");
      
      const res = await getContacts(req);
      expect(res.status).toBe(401);
    });
  
    it("retourne l'annuaire dédupliqué si authentifié", async () => {
      vi.mocked(authenticateRequest).mockResolvedValueOnce({
        companyId: "comp-1",
        role: "ADMIN",
        sub: "user-1",
      });
  
      vi.mocked(db.contact.findMany).mockResolvedValueOnce([
        { phone: "0708", firstName: "Jean", lastName: "K", city: "Abidjan", segment: null, status: "ACTIVE", lastCalledAt: new Date("2026-07-06T10:00:00Z"), campaignId: "c1" },
        { phone: "0708", firstName: "Jean", lastName: "K", city: "Abidjan", segment: null, status: "ACTIVE", lastCalledAt: new Date("2026-07-05T10:00:00Z"), campaignId: "c2" }, // doublon téléphonique
        { phone: "0505", firstName: null, lastName: null, city: null, segment: null, status: "BLACKLISTED", lastCalledAt: null, campaignId: "c1" }
      ] as any);
  
      vi.mocked(db.blacklist.findMany).mockResolvedValueOnce([
        { phone: "0708" } // 0708 est dans la blacklist globale
      ] as any);
  
      const req = new NextRequest("http://localhost/api/contacts");
      const res = await getContacts(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(2);
      
      const jean = json.data.find((c: any) => c.phone === "0708");
      expect(jean.campaigns).toBe(2); // a participé à 2 campagnes
      expect(jean.optout).toBe(true); // car dans blacklist
  
      const inconnu = json.data.find((c: any) => c.phone === "0505");
      expect(inconnu.optout).toBe(true); // car statut BLACKLISTED
    });
  });

  describe("GET /api/calls/live", () => {
    it("retourne les appels en cours formatés", async () => {
        vi.mocked(authenticateRequest).mockResolvedValueOnce({
          companyId: "comp-1",
          role: "ADMIN",
          sub: "user-1",
        });

        const now = Date.now();
        // Un appel commencé il y a 10 secondes
        const startedAt = new Date(now - 10000);
    
        vi.mocked(db.call.findMany).mockResolvedValueOnce([
            {
                startedAt: startedAt,
                contact: { firstName: "Ali", lastName: "Bamba", phone: "0102" },
                campaign: { name: "Campagne Test" }
            }
        ] as any);
    
        const req = new NextRequest("http://localhost/api/calls/live");
        const res = await getLiveCalls(req);
        const json = await res.json();
        
        expect(res.status).toBe(200);
        expect(json.data.length).toBe(1);
        expect(json.data[0].name).toBe("Ali Bamba");
        expect(json.data[0].campaign).toBe("Campagne Test");
        // On accepte une légère tolérance due à l'exécution asynchrone (devrait être proche de 10s)
        expect(json.data[0].startedSecondsAgo).toBeGreaterThanOrEqual(9);
        expect(json.data[0].startedSecondsAgo).toBeLessThanOrEqual(11);
      });
  });
});
