# Navbar & Dashboard Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove dead-end "Plan Event" page and redundant Quick Actions from user dashboard.

**Architecture:** Two independent cleanup changes — navbar route fix and dashboard UI removal. No new features or components.

**Tech Stack:** React, React Router, Lucide icons

---

### Task 1: Redirect navbar links from `/plan` to `/events/create`

**Files:**
- Modify: `frontend/src/components/Navbar.jsx:45` (nav link)
- Modify: `frontend/src/components/Navbar.jsx:95` (unauthenticated CTA button)

**Step 1: Update the "Plan Event" nav link**

In `Navbar.jsx`, change line 45 from `to="/plan"` to `to="/events/create"`:

```jsx
<Link
  to="/events/create"
  className="text-[#4A4A4A] hover:text-[#800020] font-medium transition-colors"
>
  Plan Event
</Link>
```

**Step 2: Update the "Start Planning" button link**

In `Navbar.jsx`, change line 95 from `to="/plan"` to `to="/events/create"`:

```jsx
<Link to="/events/create">
  <Button className="bg-[#0F4C5C] hover:bg-[#093642] text-white rounded-full px-6">
    Start Planning
  </Button>
</Link>
```

**Step 3: Verify**

Run: `cd frontend && npm start`

- Click "Plan Event" in navbar while logged in → should go to `/events/create` (event wizard)
- Log out, click "Start Planning" → should redirect to login, then to `/events/create` after auth

**Step 4: Commit**

```bash
git add frontend/src/components/Navbar.jsx
git commit -m "fix: point Plan Event navbar links to /events/create"
```

---

### Task 2: Remove PlanEventPage and its route

**Files:**
- Modify: `frontend/src/App.js:16` (remove import)
- Modify: `frontend/src/App.js:36` (remove route)
- Delete: `frontend/src/pages/PlanEventPage.jsx`

**Step 1: Remove PlanEventPage import from App.js**

Delete line 16:
```js
import PlanEventPage from "./pages/PlanEventPage";
```

**Step 2: Remove the `/plan` route from App.js**

Delete line 36:
```jsx
<Route path="/plan" element={<PlanEventPage />} />
```

**Step 3: Delete PlanEventPage.jsx**

```bash
rm frontend/src/pages/PlanEventPage.jsx
```

**Step 4: Verify**

- App compiles without errors
- Navigating to `/plan` directly in browser shows no match (blank or 404 — expected)

**Step 5: Commit**

```bash
git add frontend/src/App.js
git rm frontend/src/pages/PlanEventPage.jsx
git commit -m "refactor: remove unused PlanEventPage stub and /plan route"
```

---

### Task 3: Remove Quick Actions from User Dashboard

**Files:**
- Modify: `frontend/src/pages/UserDashboard.jsx:11` (clean imports)
- Modify: `frontend/src/pages/UserDashboard.jsx:109` (update comment)
- Modify: `frontend/src/pages/UserDashboard.jsx:129-154` (remove Quick Actions section)
- Modify: `frontend/src/pages/UserDashboard.jsx:189-210` (remove QuickActionCard component)

**Step 1: Remove unused imports**

Change the lucide-react import on line 11 from:
```js
import {
  Calendar, Plus, Loader2, Search, ArrowRight, Sparkles, MessageSquare
} from "lucide-react";
```
To:
```js
import {
  Calendar, Plus, Loader2, MessageSquare
} from "lucide-react";
```

Remove `Search`, `ArrowRight`, `Sparkles` — they are only used by QuickActionCard.

**Step 2: Update column comment**

Change line 109 from:
```jsx
{/* Right Column - Saved Vendors + Quick Actions */}
```
To:
```jsx
{/* Right Column - Saved Vendors + Inquiries */}
```

**Step 3: Remove the Quick Actions section**

Delete lines 129-154 (the entire Quick Actions `<section>` block):
```jsx
{/* Quick Actions Section */}
<section>
  <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
    Quick Actions
  </h2>
  <div className="space-y-3">
    <QuickActionCard ... />
    <QuickActionCard ... />
    <QuickActionCard ... />
  </div>
</section>
```

**Step 4: Remove the QuickActionCard component**

Delete lines 189-210 (the entire `QuickActionCard` function and its JSDoc comment).

**Step 5: Verify**

- App compiles without errors
- User dashboard loads correctly — right column shows Saved Vendors and My Inquiries only
- No Quick Actions section visible

**Step 6: Commit**

```bash
git add frontend/src/pages/UserDashboard.jsx
git commit -m "refactor: remove redundant Quick Actions from user dashboard"
```
