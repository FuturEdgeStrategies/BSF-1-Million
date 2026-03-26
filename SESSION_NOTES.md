# BSF 1 MILLION — Session Notes (March 23, 2026)

## Vercel Production URL
**https://bsf-1-million.vercel.app**

GitHub: https://github.com/FuturEdgeStrategies/BSF-1-Million.git
Branch: `main`

---

## Current State of the App

A real estate CRM / Deal Command Center for **Burley Sells Florida** (Sheba's brokerage). Dark, glassmorphic UI with gold accents. React 19 + Vite 8 frontend, Supabase backend, OpenAI GPT-4o-mini AI assistant.

### Tabs
1. **Dashboard** — KPI cards (active deals, pipeline volume, under contract, closing soon), pipeline distribution chart, client portfolio with expandable dossiers, agent filter (All / Sheba / Bob / Amber)
2. **Task Hub** — Sheba's personal workspace. Tasks grouped by client, KPI strip, priority/status filters, click-to-cycle status, edit pencil icons
3. **Bob Dean** — Bob's pipeline board. Buyers (includes investors with badge), sellers, under-contract deals, tasks
4. **Amber — TC** — Transaction coordinator board. Files grouped by stage (Received, Docs In Review, Pending Sigs, Compliance, Clear to Close, Closed)
5. **Command** — AI Command Center (AdminChat). Persistent chat with GPT-4o-mini, function calling for CRUD, voice input, brain-dump processing

### Floating AI Chat
Small chat bubble (bottom-right) available on all tabs. Same AI capabilities but non-persistent history.

---

## Files Modified Today (March 23, 2026)

### Commit `f04c533` — CRM Upgrade
| File | What Changed |
|------|-------------|
| `src/theme.js` | **NEW** — Design system: THEME colors, AGENTS array, SOP definitions, glassCard helper, formatCurrency, agentName |
| `src/supabaseClient.js` | **NEW** — Supabase client init using VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY |
| `src/Modals.jsx` | **NEW** — AddClientModal, AddTaskModal, EditClientModal, EditTaskModal with delete support |
| `src/TaskHub.jsx` | **NEW** — Sheba's personal task workspace, grouped by client, urgency sorting, KPI strip |
| `src/TeamBoards.jsx` | **NEW** — BobBoard, AmberBoard, ShebaBoard with expandable MiniClientRow dossiers |
| `src/AIChatWindow.jsx` | **NEW** — Floating AI chat with OpenAI function calling, voice input |
| `src/AdminChat.jsx` | **NEW** — Full-page persistent AI command center with brain-dump processing |
| `src/App.jsx` | Major rewrite — tab system, Supabase data fetching, realtime subscriptions, modals, all board integrations |
| `src/index.css` | Added 15+ animations, dark dropdown fix, date picker fix, scrollbar styling |
| `package.json` | Added `@supabase/supabase-js` dependency |
| `package-lock.json` | Updated lockfile |

### Commit `08c5857` — Pipeline Data Fixes
| Change | Details |
|--------|---------|
| `src/TeamBoards.jsx` | Merged Investors into Buyers section (filter: `type === "Buyer" \|\| type === "Investor"`), removed separate Investors category |
| Supabase data | Deleted Surfside Tower (seller, Active Marketing, bob), renamed "Patience Williams" → "Patience and Evan", changed Ryan & Angie type from Investor → Buyer, deleted Russell Rue and Dylan |

### Post-commit changes (Supabase data only, not in git)
- Deleted "1798 New Hampshire Ave NE" TC file from Amber's board (March 23)
- Restored "1798 New Hampshire Ave NE" as Seller / Active Marketing / amber (March 25)

### Vercel configuration (done via CLI, not in git)
- Added `VITE_SUPABASE_URL` env var to Vercel production
- Added `VITE_SUPABASE_ANON_KEY` env var to Vercel production
- `VITE_OPENAI_API_KEY` was already set
- Deployed fresh production build via `vercel --prod`

---

## Supabase Table Structure

**Project:** `zhdeyzqfowegfayavzdj`
**URL:** `https://zhdeyzqfowegfayavzdj.supabase.co`

### `clients` table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, auto-generated |
| name | TEXT | Required |
| type | TEXT | "Buyer", "Seller", "TC", "Investor" |
| agent | TEXT | "sheba", "bob", "amber" |
| stage | TEXT | Pipeline stage (Lead, Pre-Qualified, Active Search, Under Contract, etc.) |
| pre_approval | TEXT | "Approved", "Cash", "N/A", "Pending" |
| loan_type | TEXT | "FHA", "Conventional", "VA", "Cash", "N/A" |
| lender | TEXT | Lender name |
| loan_amt | NUMERIC | Loan amount |
| offer_price | NUMERIC | Offer price |
| closing_date | DATE | Target close date |
| sop_progress | INTEGER | Current SOP step (0-based) |
| notes | TEXT | Strategic notes |
| commission_rate | NUMERIC | Commission rate (e.g., 0.03) |
| projected_commission | NUMERIC | Calculated commission |
| phone | TEXT | Client phone number |
| created_at | TIMESTAMPTZ | Auto-timestamp |

### `tasks` table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, auto-generated |
| title | TEXT | Required |
| client_id | UUID | FK to clients (nullable for general tasks) |
| assigned_to | TEXT | "sheba", "bob", "amber" |
| priority | TEXT | "high", "medium", "low" |
| due_date | DATE | Task deadline |
| status | TEXT | "pending", "in_progress", "completed" |
| created_at | TIMESTAMPTZ | Auto-timestamp |

### `chat_messages` table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, auto-generated |
| role | TEXT | "user" or "assistant" |
| content | TEXT | Message text |
| tool_calls | JSONB | OpenAI tool calls (unused currently) |
| tool_call_id | TEXT | Tool call reference (unused currently) |
| created_at | TIMESTAMPTZ | Auto-timestamp, indexed ASC |

---

## Current Supabase Data (as of March 25, 2026)

### Clients (9 total)

**Amber's Board (1 client)**
| Name | Type | Stage | Agent |
|------|------|-------|-------|
| 1798 New Hampshire Ave NE, St Petersburg, FL 33703 | Seller | Active Marketing | amber |

**Bob's Board (7 clients)**
| Name | Type | Stage | Agent |
|------|------|-------|-------|
| Sheryl Wojciechowski | Buyer | Active Search | bob |
| Patience and Evan | Buyer | Pre-Qualified | bob |
| Ryan & Angie | Buyer | Closed | bob |
| Brian Hughes | Buyer | Lead | bob |
| Kathy | Buyer | Lead | bob |
| Martin | Buyer | Lead | bob |
| Doug | Buyer | Lead | bob |

**Sheba's Clients (1 client)**
| Name | Type | Stage | Agent |
|------|------|-------|-------|
| Marisa Crispell | Buyer | Lead | sheba |

### Tasks
None currently in the database.

---

## What's Working

- Dashboard with KPI cards, pipeline chart, and expandable client dossiers
- Task Hub (Sheba's workspace) with filters, grouped by client, status cycling
- Bob Dean's board with all 7 buyers, expandable dossiers, task list, SOP progress
- Amber's TC board (renders correctly, just empty)
- Add Client / Add Task modals with Supabase persistence
- Edit Client / Edit Task modals with delete functionality
- Command Center (AdminChat) — persistent chat history, multiline input (Shift+Enter to send)
- Floating AI chat bubble on all tabs
- Voice input (Web Speech API) on Command Center
- Dark dropdown styling (no more white backgrounds)
- Vercel deployment with correct environment variables
- Realtime data sync (Supabase channel subscriptions)
- All animations and glassmorphic styling

---

## What's Still Broken / Untested

1. **AI Command Center responses** — The OpenAI integration has comprehensive error handling but has NOT been verified end-to-end in production. The API key is set on Vercel but the AI chat may show errors if the key is expired or rate-limited. Needs manual testing on both localhost and Vercel.

2. **OpenAI API key exposed in client-side code** — `VITE_OPENAI_API_KEY` is embedded in the JS bundle. Anyone can view-source and steal the key. Should be moved to a serverless function (Vercel API route) for production use.

3. **Brain dump task extraction** — The system prompt instructs GPT to extract tasks, but this hasn't been tested with real brain dumps. May need prompt tuning.

4. **No authentication** — Anyone with the URL can access the full CRM and modify data. No login, no RLS beyond the open policy.

5. **Supabase `.catch()` pattern** — Was fixed in AdminChat.jsx (lines 315, 323) but other files (AIChatWindow.jsx, Modals.jsx) should be audited for the same pattern.

---

## TODO — Next Session

### Data Fixes
- [x] **Re-add "1798 New Hampshire Ave NE, St Petersburg, FL 33703" to Supabase** — Restored on March 25, 2026 as `type: "Seller"`, `agent: "amber"`, `stage: "Active Marketing"`. Shows under "Other Files" on Amber's TC board.

### Testing
- [ ] Test AI Command Center on Vercel — send a message and confirm GPT responds
- [ ] Test brain dump processing — type a paragraph about a client and verify tasks are created
- [ ] Test voice input on Vercel (requires HTTPS, which Vercel provides)
- [ ] Test edit/delete modals on Vercel
- [ ] Verify all boards display correctly on Vercel

### Security (Important)
- [ ] Move OpenAI API key to a Vercel serverless function (`/api/chat.js`) so it's not exposed in the client bundle
- [ ] Add basic authentication (even a simple password gate) to prevent unauthorized access
- [ ] Review Supabase RLS policies — current "Allow all" policy is wide open

### Features
- [ ] Add more clients to the pipeline (Sheba's clients, Amber's TC files)
- [ ] Create actual tasks for existing clients
- [ ] Test and refine SOP progress tracking
- [ ] Consider adding a "Notes" tab or per-client note history
- [ ] Mobile responsiveness (currently desktop-optimized)

### Code Quality
- [ ] Audit all Supabase calls for proper `const { data, error } = await` pattern (no `.catch()` chains)
- [ ] Consider code-splitting (bundle is 800KB+ gzipped to 228KB — Vite warns about chunk size)
- [ ] Add error boundaries for graceful failure handling

---

## Environment Variables

Required in both `.env` (local) and Vercel dashboard (production):

```
VITE_SUPABASE_URL=https://zhdeyzqfowegfayavzdj.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase anon key>
VITE_OPENAI_API_KEY=<openai api key>
```

Also in `.env` but NOT needed on Vercel:
```
SUPABASE_ACCESS_TOKEN=<supabase management token>
```

---

## Quick Resume Commands

```bash
# Start dev server
cd "c:\Users\sheba\OneDrive\Desktop\BSF 1 MILLION"
npm run dev

# Deploy to Vercel
npx vercel --prod --scope futuredgestrategies-projects --yes

# Check Vercel env vars
npx vercel env ls --scope futuredgestrategies-projects

# 1798 New Hampshire has been restored (March 25) — no action needed
```
