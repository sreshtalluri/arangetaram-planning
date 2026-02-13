# Navbar & Dashboard Cleanup Design

**Date:** 2026-02-13

## Summary

Two cleanup changes to remove dead-end navigation and redundant UI.

## Change 1: "Plan Event" Navbar Link → Create Event Page

The "Plan Event" navbar link and "Start Planning" button both point to `/plan`, which renders an empty stub page (`PlanEventPage.jsx`). These should point directly to `/events/create` instead.

### Changes

- **Navbar.jsx:** Update both `/plan` links (line 45 nav link, line 95 unauthenticated CTA) to `/events/create`
- **App.js:** Remove `PlanEventPage` import and `/plan` route
- **Delete** `PlanEventPage.jsx` — empty stub, no longer needed

### Notes

`/events/create` is already wrapped in `<ProtectedRoute>`, so unauthenticated users will be redirected to login first.

## Change 2: Remove Quick Actions from User Dashboard

The Quick Actions section on the user dashboard (Create Event, Browse All Vendors, Get Recommendations) duplicates navigation available elsewhere in the app. Remove it entirely.

### Changes

- **UserDashboard.jsx:** Remove the Quick Actions `<section>` block and the `QuickActionCard` component definition
- **UserDashboard.jsx:** Clean up unused imports (`Search`, `ArrowRight`, `Sparkles`)
- **UserDashboard.jsx:** Update column comment to reflect remaining content
