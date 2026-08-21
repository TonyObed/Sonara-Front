import { describe, expect, it } from "vitest";
import { getAnalysisQuality, measureConversationLatency } from "@/lib/call-quality";

describe("call quality", () => {
  it("mesure la latence entre le client et l'assistante", () => {
    expect(measureConversationLatency([
      { role: "assistant", time: 0, endTime: 1 },
      { role: "user", time: 2, endTime: 3.2 },
      { role: "assistant", time: 4, endTime: 5 },
      { role: "user", time: 6, endTime: 6.5 },
      { role: "assistant", time: 8, endTime: 9 },
    ])).toEqual({ averageResponseMs: 1150, p95ResponseMs: 1500, samples: 2 });
  });

  it("ignore les silences aberrants et indique une analyse partielle", () => {
    expect(measureConversationLatency([
      { role: "user", time: 0, endTime: 1 },
      { role: "assistant", time: 40 },
    ])).toEqual({ averageResponseMs: null, p95ResponseMs: null, samples: 0 });
    expect(getAnalysisQuality({ summary: "Résumé", structuredData: null, transcriptEntries: 2 })).toBe("PARTIAL");
  });
});
