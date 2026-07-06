import { describe, it, expect } from "vitest";
import { mapApiCallToRow, mapApiCampaignToFront } from "@/lib/dashboard-adapters";
import type { Campaign, Call } from "@/lib/api-client";

describe("Dashboard Adapters", () => {
  describe("mapApiCallToRow", () => {
    it("convertit un appel API vers le format du tableau frontend (avec nom complet)", () => {
      const apiCall: Call = {
        id: "call-1",
        campaignId: "camp-1",
        contactId: "contact-1",
        contact: {
          id: "contact-1",
          phone: "+2250708234567",
          firstName: "Jean",
          lastName: "Kouassi",
          city: "Abidjan"
        },
        status: "COMPLETED",
        durationSec: 125, // 2 minutes 5 secondes
        startedAt: "2026-07-06T10:00:00Z",
        endedAt: "2026-07-06T10:02:05Z",
        summary: "Client intéressé",
        recordingUrl: null,
        transcript: null
      };
      
      const row = mapApiCallToRow(apiCall);
      expect(row.id).toBe("call-1");
      expect(row.name).toBe("Jean Kouassi");
      expect(row.city).toBe("Abidjan");
      expect(row.dur).toBe("2:05");
      expect(row.status).toBe("completed");
      expect(row.summary).toBe("Client intéressé");
    });

    it("utilise le numéro de téléphone si le nom n'est pas fourni", () => {
        const apiCall: Call = {
            id: "call-2",
            campaignId: "camp-1",
            contactId: "contact-1",
            contact: {
              id: "contact-1",
              phone: "+2250708234567",
              firstName: null,
              lastName: null,
              city: null
            },
            status: "VOICEMAIL",
            durationSec: 10,
            startedAt: null,
            endedAt: null,
            summary: null,
            recordingUrl: null,
            transcript: null
          };
          
          const row = mapApiCallToRow(apiCall);
          expect(row.name).toBe("+2250708234567");
          expect(row.city).toBe("—");
          expect(row.dur).toBe("0:10");
          expect(row.status).toBe("voicemail");
          expect(row.time).toBe("—");
    });
  });

  describe("mapApiCampaignToFront", () => {
    it("convertit une campagne API au format frontend de liste", () => {
      const apiCamp: Campaign = {
        id: "camp-1",
        companyId: "comp-1",
        name: "Sondage Satisfaction",
        sector: "Finance",
        brief: "...",
        aiVoice: "eleven_monolingual_v1",
        aiPrompt: "prompt",
        language: "fr-FR",
        status: "RUNNING",
        createdAt: "2026-07-06T10:00:00Z",
        updatedAt: "2026-07-06T10:00:00Z",
        startedAt: null,
        scheduledAt: null,
        completedAt: null,
        stats: {
          totalContacts: 100,
          totalCalls: 50,
          completedCalls: 40,
          failedCalls: 10,
          totalDurationMin: 120,
          responseRate: 80
        }
      };

      const front = mapApiCampaignToFront(apiCamp);
      expect(front.id).toBe("camp-1");
      expect(front.name).toBe("Sondage Satisfaction");
      expect(front.status).toBe("live");
      expect(front.done).toBe(50);
      expect(front.total).toBe(100);
      expect(front.responseRate).toBe("80%");
      expect(front.date).not.toBeNull();
    });
  });
});
