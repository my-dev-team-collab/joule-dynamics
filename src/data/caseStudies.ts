export type CaseStudyStatus = "Available Now" | "In Development" | "On Request" | "Illustrative example, not delivered work";

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  status: CaseStudyStatus;
  challenge: string;
  solutionLabel?: string;
  solution: string;
  beforeAfter: {
    before: string;
    after: string;
  };
  resultsLabel?: string;
  results: string[];
}

export const caseStudies: Record<string, CaseStudy> = {
  // ── Pulse / "Available Now" Case Studies ──
  "pulse-market-intelligence": {
    id: "pulse-market-intelligence",
    title: "Real Estate Market Intelligence",
    description: "Ask plain-language questions about the live market data on this page—trends, spikes, comparisons, anything in the dashboard—and get real answers, grounded in the actual data.",
    status: "Available Now",
    challenge: "A dashboard full of numbers still takes real effort to actually use — finding a specific comparison, spotting a trend, understanding what a spike means takes digging, even when all the data is right there on the page.",
    solutionLabel: "HOW THIS WORKS",
    solution: "Pulse answers plain-language questions directly from the live data on this page — real trends, real comparisons, real explanations of the methodology — instead of making a visitor hunt through charts and tables themselves.",
    beforeAfter: {
      before: "hunting through charts, tweaking filters, and exporting CSVs just to find a simple metric.",
      after: "getting a direct, mathematically accurate answer in seconds."
    },
    resultsLabel: "TRY IT",
    results: [
      "Scroll up and ask it something like 'what's Miami trending right now' or 'explain the 7-day average' — the answers come from the actual live data on this page, not a script."
    ]
  },
  "pulse-str-concierge": {
    id: "pulse-str-concierge",
    title: "Short-Term Rental Guest Concierge",
    description: "24/7 guest communication grounded in unit-specific house manuals.",
    status: "Illustrative example, not delivered work",
    challenge: "Short-term rental hosts and boutique operators get inundated 24/7 with the exact same repetitive guest questions—WiFi access, smart lock troubleshooting, parking restrictions, trash days, early check-in pricing, and checkout rules. Missing a message at 11 PM or 6 AM leads to frustrated guests and lower review ratings.",
    solutionLabel: "HOW THIS COULD WORK",
    solution: "The Pulse pattern connected directly to a property manager’s internal database of unit-specific house manuals, lockbox codes, and local vendor guides. Guests ask questions in plain English and get immediate, unit-accurate answers 24/7, keeping host inboxes clear for genuine emergencies.",
    beforeAfter: {
      before: "hosts waking up to answer a WiFi password question at 2 AM.",
      after: "guests receiving an instant, friendly answer without waking anyone up."
    },
    resultsLabel: "WHAT YOU'D GET",
    results: [
      "24/7 instant replies to routine guest questions.",
      "Responses restricted strictly to your approved house manual facts.",
      "Escalation pathways to a real human for emergencies."
    ]
  },
  "pulse-multifamily-leasing": {
    id: "pulse-multifamily-leasing",
    title: "Multifamily Leasing Assistant",
    description: "Instant clarity on building policies, amenities, and lease addendums.",
    status: "Illustrative example, not delivered work",
    challenge: "Leasing agents at apartment complexes and residential property management firms spend hours every week re-answering basic policy questions for prospective tenants—pet weight limits, deposit structures, parking stall availability, utility inclusions, and income qualification ratios.",
    solutionLabel: "HOW THIS COULD WORK",
    solution: "The Pulse pattern grounded directly in a building’s lease addendums, community guidelines, floor plan specs, and HOA rules. Prospective tenants get instant, accurate clarity on building policies before booking a tour, speeding up application turnaround without pulling leasing staff away from tours.",
    beforeAfter: {
      before: "leasing agents answering the same pet policy question ten times a week.",
      after: "agents focusing strictly on tours, applications, and closing deals."
    },
    resultsLabel: "WHAT YOU'D GET",
    results: [
      "An automated pre-tour assistant answering all building policy FAQs.",
      "Guaranteed accuracy based strictly on your uploaded lease documents.",
      "Faster application turnarounds for highly qualified leads."
    ]
  },

  // ── Custom Builds ──
  "unified-triage-engine": {
    id: "unified-triage-engine",
    title: "Unified Inquiry Triage Engine",
    description: "An AI system that reads incoming questions across email, WhatsApp, Instagram, and Facebook, answers the routine ones instantly using real data, and brings in a human the moment something needs real judgment.",
    status: "In Development",
    challenge: "Every inquiry that goes unanswered outside business hours is a lead that might go to a competitor first. Real estate teams get flooded with the same repetitive questions — availability, pricing, basic details — that eat the same amount of time as the handful of conversations that actually need a real person's judgment.",
    solutionLabel: "HOW THIS WORKS",
    solution: "An AI system reads inbound messages across email, WhatsApp, Instagram, and Facebook, answers routine questions instantly using real listing and market data, and hands anything involving negotiation, pricing judgment, or a genuinely qualified lead straight to a person — with a full summary attached, so nothing has to be re-explained. Multi-channel by design.",
    beforeAfter: {
      before: "after-hours inquiries wait until morning, and a lead's context has to be rebuilt from scratch every time they switch how they're reaching out.",
      after: "routine questions get answered in seconds at any hour, and the moment a human is genuinely needed, they get the full picture in one place, no matter which channel the conversation started on."
    },
    resultsLabel: "WHAT YOU'D GET",
    results: [
      "Instant answers to routine questions, 24/7, across email, WhatsApp, Instagram, and Facebook",
      "One connected conversation thread per lead, even across multiple channels",
      "A full context summary handed to a human the moment real judgment is needed",
      "Nothing sent to a real client without a review step, ever"
    ]
  },
  "owner-acquisition-reports": {
    id: "owner-acquisition-reports",
    title: "Owner Acquisition Reports",
    description: "Revenue potential analysis to help you win new property management contracts.",
    status: "On Request",
    challenge: "When a property management company pitches a homeowner on switching to them, they need real numbers to prove they can earn more than the owner is currently making. Pulling that data by hand from multiple listing sites takes hours per pitch, and it goes stale fast.",
    solutionLabel: "HOW THIS WORKS",
    solution: "The system would pull comparable properties in the owner's exact neighborhood from tracked market data and build a clean, branded one-page revenue-potential report the property manager can hand straight to the prospective owner.",
    beforeAfter: {
      before: "hours of manual research per pitch, and the numbers are outdated by the time the meeting happens.",
      after: "a data-backed report ready in minutes, easy to refresh as the market moves."
    },
    resultsLabel: "WHAT YOU'D GET",
    results: [
      "A one-page revenue potential report per property, branded to your company",
      "Pulled from real, currently-tracked comparable listings, not generic city averages",
      "Ready to hand to a prospective owner the same day you meet them"
    ]
  },
  "investor-yield-data": {
    id: "investor-yield-data",
    title: "Investor Yield Data",
    description: "Occupancy and rate trend analysis to support real estate deals with investors.",
    status: "On Request",
    challenge: "Agents selling to out-of-state or international investors need to prove real cash-flow potential before the investor commits — but that kind of data is usually scattered across different tools the agent doesn't have time to pull together.",
    solutionLabel: "HOW THIS WORKS",
    solution: "The system would pull rate and occupancy trends for comparable properties in the exact market and package it as an investor-ready data sheet the agent can attach directly to a listing.",
    beforeAfter: {
      before: "agents rely on gut feel or generic averages that don't hold up to a serious investor's questions.",
      after: "a specific number tied to real comparable properties, ready to defend in the conversation."
    },
    resultsLabel: "WHAT YOU'D GET",
    results: [
      "An investor-ready yield summary per listing",
      "Based on real comparable properties in the same market, not broad estimates",
      "Formatted to attach directly to a listing or send to a prospective investor"
    ]
  },
  "cross-market-arbitrage": {
    id: "cross-market-arbitrage",
    title: "Cross-Market Arbitrage Targeting",
    description: "Identifying long-term rentals with strong short-term rental upside.",
    status: "On Request",
    challenge: "Agents looking for an angle to convince a long-term rental owner to sell often don't have an easy way to spot which specific properties are leaving real money on the table by not operating as short-term rentals.",
    solutionLabel: "HOW THIS WORKS",
    solution: "The system would cross-reference long-term rental listings against tracked short-term rental performance in the same area, flagging properties where the difference is large enough to be worth a phone call.",
    beforeAfter: {
      before: "manually comparing listings one at a time, hoping to spot an opportunity.",
      after: "a short, ranked list of the properties actually worth calling first."
    },
    resultsLabel: "WHAT YOU'D GET",
    results: [
      "A ranked shortlist of long-term rentals with strong short-term rental upside",
      "Comparison built from real tracked market data, not assumptions",
      "A concrete opening line for outreach ('this property could be earning X more')"
    ]
  },
  "cma-automation": {
    id: "cma-automation",
    title: "Comparable Market Analysis (CMA) Automation",
    description: "Automated comps pulled from tracked listings to support pricing and valuation decisions.",
    status: "On Request",
    challenge: "Building a comparable market analysis by hand — pulling comps, checking recent activity, adjusting for differences — is one of the most repetitive parts of pricing or valuing a property, and it eats time that could go toward actual client work.",
    solutionLabel: "HOW THIS WORKS",
    solution: "The system would automatically pull relevant comps from tracked listings matching a property's market, bedroom count, and platform, assembling them into a ready-to-use comp sheet.",
    beforeAfter: {
      before: "an hour or more of manual comp-pulling per property.",
      after: "a comp sheet ready in minutes, built from real tracked listings."
    },
    resultsLabel: "WHAT YOU'D GET",
    results: [
      "An automated comp sheet for any tracked property or market",
      "Filtered by bedroom count, platform, and location automatically",
      "Ready to use in a pricing conversation the same day"
    ]
  },
  "off-market-deal-sourcing": {
    id: "off-market-deal-sourcing",
    title: "Off-Market Deal Sourcing",
    description: "Flagging listings with distress signals (repeated price drops, extended time-on-market) for investors seeking deals.",
    status: "On Request",
    challenge: "Investors looking for deals often miss properties that are quietly struggling — repeated price drops, sitting unsold or unrented for months — because nobody is watching for that pattern across a whole market at once.",
    solutionLabel: "HOW THIS WORKS",
    solution: "The system would flag listings showing distress signals (repeated price cuts, unusually long time on market) so an investor's outreach list writes itself.",
    beforeAfter: {
      before: "manually scanning listings hoping to notice a struggling property before someone else does.",
      after: "a short, ranked list of properties already showing real distress signals."
    },
    resultsLabel: "WHAT YOU'D GET",
    results: [
      "A regularly refreshed list of properties showing real distress signals",
      "Built from tracked price history, not guesswork",
      "A head start on outreach before a property gets noticed by everyone else"
    ]
  },
  "portfolio-performance-dashboards": {
    id: "portfolio-performance-dashboards",
    title: "Portfolio Performance Dashboards",
    description: "A consolidated view across a property manager's full portfolio instead of one listing at a time.",
    status: "On Request",
    challenge: "A property manager juggling many units usually has to check each one individually to understand how the portfolio as a whole is actually performing.",
    solutionLabel: "HOW THIS WORKS",
    solution: "The system would build one consolidated view across a manager's full portfolio, instead of clicking through listings one at a time to piece the picture together.",
    beforeAfter: {
      before: "piecing portfolio health together from many separate tabs and spreadsheets.",
      after: "one dashboard, one glance, the whole portfolio."
    },
    resultsLabel: "WHAT YOU'D GET",
    results: [
      "A single dashboard covering every property in the portfolio",
      "Built on the same live tracking already running for individual properties",
      "One place to spot which units need attention, instead of checking each one"
    ]
  }
};
