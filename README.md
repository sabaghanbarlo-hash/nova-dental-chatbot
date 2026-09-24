# Nova Dental Clinic · AI Customer-Service Chatbot (Portfolio Demo)

A free, zero-dependency chatbot demo with booking capture, lead qualification and an analytics dashboard. **Nova Dental Clinic is fictional. No real appointments are made and no external AI service is connected.**

**Live demo:** https://sabaghanbarlo-hash.github.io/nova-dental-chatbot/

## What it does
- Floating chat widget with typing animation, timestamps, suggested questions and "New chat"
- Answers services, pricing, hours, location and emergency questions, and handles varied wording
- Detects booking intent, then collects name, phone/email, service, date and time
- Asks lead-qualification questions (new patient, urgency, contact method) and tags each lead **Hot / Warm / General inquiry**
- Dashboard: conversations, leads, appointment requests, common questions, lead status, transcripts
- Light/dark mode, mobile-responsive (full-screen chat on phones)

## How the free demo works
Everything runs in the browser (HTML, CSS, vanilla JS). Bookings and conversations are saved in `localStorage` (key `novaDemo1`), so nothing leaves your device. The dashboard shows realistic sample data plus whatever you create in the chat; "Reset my demo data" clears your entries.

The "AI" is a local intent engine in `script.js`: phrase matching plus typo-tolerant fuzzy matching (Levenshtein distance) over a structured knowledge base (`KB`). Lead status is a simple score: booking, new patient, urgency, emergencies and pricing/service interest add points (4+ = Hot, 2+ = Warm).

## What a real AI API would replace
- `getReply()` in `script.js` is the single seam. Swap `localReply()` for a call to your backend/LLM endpoint (send the KB and conversation history, return `{id, text}`).
- `localStorage` becomes a database (e.g. Postgres/Supabase) and the dashboard reads from it.
- Bookings would sync to a real calendar/practice-management system, with email/SMS confirmations.
- API keys must live on a server, never in this static front end.

## Customising for another business
1. Edit `KB` (answers + keywords), `SERVICES` and `SUGG` in `script.js`
2. Edit `STEPS` to change the fields collected, and `status()` to change lead scoring
3. Change brand colours via the CSS variables at the top of `styles.css`
4. Update the name, address and hours in `index.html` and the KB

## Deploy for free
Push to GitHub, then Settings → Pages → deploy from `main` / root. Cloudflare Pages works the same way.
