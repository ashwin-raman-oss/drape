# Drape

### Your personal wardrobe, curated by AI

**[drape-psi.vercel.app](https://drape-psi.vercel.app)**

---

## The Problem

Most men with good wardrobes still wear the same five outfits on rotation. Not because their wardrobe is bad, but because combining clothes with confidence is genuinely hard. What's appropriate for a casual Friday at the office versus dinner with a client? Does this jacket work with those trousers? What reads as smart-casual versus just casual?

Decision fatigue around getting dressed is real and daily. Existing wardrobe apps try to solve this by giving you a digital catalogue to browse. That doesn't solve anything. You still have to make the call.

Drape solves it by making the call for you.

---

## The Product

Drape is an AI-powered outfit assistant. You tell it the occasion, it tells you what to wear. Two complete outfit recommendations, both drawn from your actual wardrobe, both with a plain-English explanation of why they work for that specific context.

What makes Drape different from other wardrobe apps is the design philosophy: this is not a catalogue. You are never browsing your clothes hoping inspiration strikes. Every session starts with the occasion you're dressing for, and everything flows from there.

The second thing that makes it different is that it gets smarter over time. Every thumbs up, thumbs down, or comment you leave on a recommendation feeds back into the next one. Over time, Drape builds a picture of your taste and your patterns. It knows what you've worn recently and won't repeat it. It knows what you consistently skip and why.

---

## Key Product Decisions

These are the deliberate design choices made during development, and the reasoning behind each one.

**Occasion-first home screen, not a wardrobe browser**
The home screen shows eight occasion presets and a free text field. There is no "my wardrobe" button on the main flow. This forces the right framing from the start. You are here to get dressed for something, not to admire your clothes.

**Two recommendations, not three**
Three options recreates the decision fatigue the product is trying to eliminate. Two is enough contrast to feel like a real choice without being overwhelming. The constraint also forces the AI to be more deliberate.

**Manual wear logging over automatic**
Automatic detection sounds appealing but produces unreliable data. A shirt pulled out and put back is not a wear. Manual logging is one tap and takes two seconds. The data quality is worth the small friction.

**Weather as four real conditions, not seasons**
"Winter" and "summer" mean different things depending on where you live and how you run. Hot, warm, cool, and cold are conditions anyone can accurately self-report and that map directly to layering decisions. Seasons would have required location data and assumption-heavy logic.

**Soft delete with an archive status, not hard delete**
Deleting a wardrobe item would corrupt the history of any outfit it appeared in. Items that leave your wardrobe are archived, not removed. Active history stays intact. This was a data integrity decision, not a storage one.

**Lifestyle onboarding to solve cold start**
A recommendation engine with no data is useless. Rather than launching to an empty wardrobe and asking users to wait, onboarding collects lifestyle context upfront: formality of work, how often you go out, personal style, climate. The first recommendation is informed even before the first item is uploaded.

**Rotation logic on tops only, 7-day window**
Tops are the most visible and most memorable piece of any outfit. Trousers and shoes can repeat without anyone noticing. Tracking recency on tops within a rolling 7-day window prevents visible repetition without being so restrictive it limits valid options.

---

## How It Works

Drape uses two distinct AI agents, both powered by Claude.

**Vision Agent: wardrobe upload**
When you add a new item, you take two photos of it. Those photos go to Claude's vision model, which returns a structured tag object: category, colour, formality, fit, fabric, and any notable details. You review and confirm the tags before saving. What would otherwise take two minutes of manual tagging takes about ten seconds.

**Reasoning Agent: outfit recommendations**
When you request an outfit, the app assembles a context payload: your occasion and weather input, your full active wardrobe with tags, your lifestyle profile from onboarding, and your recent wear and feedback history. That payload goes to Claude's reasoning model, which returns two complete outfits, each with an explanation of why it works for the occasion. The response is structured JSON, so the UI renders item photos directly alongside the reasoning.

---

## Features

- Wardrobe upload with Claude vision auto-tagging (2 photos per item)
- Occasion-driven outfit recommendations with 8 preset occasions and free text
- Weather context across 4 conditions: hot, warm, cool, cold
- Lifestyle onboarding to solve cold start and personalise from day one
- Rotation logic that deprioritises tops worn in the last 7 days
- Feedback loop: thumbs up or down plus optional comment on every recommendation
- Wear logging with date stamps
- Outfit history, browsable by month
- Saved looks for outfits you want to revisit
- Full wardrobe management: edit tags, archive, restore, and delete items
- PWA: installable on your phone home screen, works without an app store

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Tailwind CSS |
| State | Zustand (flow state) + TanStack Query (server state) |
| Backend / DB | Supabase (Postgres + Storage + Auth) |
| AI | Claude claude-sonnet-4-6 via Anthropic API (vision + reasoning) |
| API Proxy | Vercel serverless function with JWT verification |
| Deployment | Vercel |

---

## Architecture Decisions

**Vercel proxy with JWT verification**
The Claude API key never touches the client. Every AI request goes through a Vercel serverless function that extracts the Supabase JWT from the request header, verifies it, and only then forwards the call to Anthropic. This prevents unauthenticated users from consuming API credits.

**Soft delete with a status field (active / archived / deleted)**
The wardrobe items table has a `status` column rather than a boolean `is_deleted` flag. This was a forward-looking schema decision. V2 seasonal rotation, where items are automatically surfaced and hidden by season, requires no schema changes at all. It is just a new status value and a new filter.

**Image compression before vision API calls**
Photos taken on a modern phone are between 3MB and 8MB. The Anthropic API has a payload limit that rejects anything over 1MB. All images are compressed client-side before upload and before the vision call. This also keeps storage costs reasonable at scale.

**Zustand for flow state, TanStack Query for server state**
The recommendation flow has several transient UI steps: occasion selection, weather selection, loading, and results. That state doesn't belong in the server cache. Zustand handles the in-session flow state cleanly. TanStack Query handles everything that lives in Supabase: wardrobe items, outfits, history. Mixing the two in one place would have been messy and harder to debug.

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/drape.git
cd drape

# Set up environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and ANTHROPIC_API_KEY

# Install dependencies
npm install

# Start the development server
npm run dev
```

**Database setup**

Run the following in the Supabase SQL Editor, in order:

1. `docs/schema.sql` — creates all tables and indexes
2. `docs/storage-policy-fix.sql` — sets up storage bucket RLS policies

---

## Roadmap

These are the post-MVP features worth building next, in rough priority order.

**Partner / share mode**
Send a look to someone for a second opinion before you commit to it. Useful for anyone who wants a sanity check on a big meeting outfit or a first date.

**Event and travel planner**
Input a trip or multi-day event and get a full packing list built from your actual wardrobe. "Pack for 5 days in Milan in October" is a solvable problem with the data already in the system.

**Wardrobe gap analysis**
Show the user what categories they own nothing in, what they consistently avoid wearing, and what a single purchase would unlock in terms of new combinations. This turns Drape from a daily tool into a shopping advisor.

**Weather auto-detect**
Pull current conditions from a weather API based on location rather than requiring manual input. The 4-condition model stays. The user just stops having to tap it every morning.

**Athletic wear category**
A separate wardrobe section and occasion set for gym, running, and active use. Different tagging schema, different recommendation logic.

---

## About

Built by Ashwin Raman, a Group Product Manager with 9 years of experience across consumer and enterprise products. Drape is a portfolio project built to demonstrate end-to-end AI product thinking: from problem definition and design rationale through technical architecture and production deployment. It is not a prototype. It is actively used daily as a personal tool.
