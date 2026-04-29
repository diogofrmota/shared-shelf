1. Public homepage discovery - A visitor opens `/`, reads the product pitch, uses navigation links, and can move to login, registration, legal pages, or bug reporting.
2. Public legal pages - A visitor opens `/privacy-policy` or `/terms-of-service`, reads the static policy/terms content, and can navigate back home or into the app.
3. Public bug report - A visitor opens `/report-a-bug`, fills a title, description, optional reproduction steps and contact email, previews the report, sends it through their email client, or copies the generated report.
4. Unknown route recovery - A visitor opens an unsupported path, sees a not-found screen, and can go home/go to dashboards or report a bug.
5. Sign in - A user opens `/login`, enters email or username plus password, optionally enables Remember me, submits, and is routed to their existing dashboard or dashboard creation/join.
6. Register account - A user opens `/login?mode=signup` or switches to Register, enters name, username, email, and password, sees username availability feedback, submits, and is asked to confirm their email.
7. Confirm new account email - A user opens `/login?confirm_token=...`, the app validates the token, shows success or a used/expired/invalid link message, and routes the user back to sign in actions.
8. Forgot password - A user clicks Forgot password, enters their email, submits, and sees a generic reset-email confirmation message.
9. Reset password - A user opens `/login?reset_token=...`, the app validates the token, lets them enter a new password, shows success, or offers recovery for expired/used/invalid links.
10. Confirm account email change - A user opens `/login?confirm_email_change=...`, the app confirms the pending email change and shows success or a link error.
11. Private route gate - A signed-out visitor opens dashboard selection or a dashboard URL, sees a private-page message, and can sign in or go home.
12. Session restore - A returning user with a stored auth token loads the app, the app checks `/api/auth/me`, restores the user, or clears an invalid token.
13. Logout - A signed-in user logs out from account controls, pending dashboard saves are flushed, auth tokens are cleared, dashboard state closes, and the user returns home.
14. Create dashboard - A signed-in user with no dashboard opens dashboard selection, enters a dashboard name, chooses enabled shared sections, creates the dashboard, and enters it as owner.
15. Join dashboard by code - A signed-in user with no dashboard opens Join, enters dashboard ID and join code, submits, and enters the dashboard as a member.
16. Join dashboard by invite link - A user opens `/dashboard-selection/?inviteDashboard=...&inviteCode=...`; if signed out they are prompted to sign in, then the join form is pre-filled.
17. Dashboard access check - A signed-in user opens `/dashboard/<id>/`; the app checks membership, opens the dashboard if allowed, or shows access denied if not.
18. Dashboard data loading - A dashboard member opens a dashboard, sees cached local data quickly if available, then receives normalized cloud data when the API returns.
19. Dashboard autosave and offline fallback - A member changes dashboard data; the app caches locally immediately, debounces cloud saves, flushes pending saves before unload/logout, and falls back to cache on read failures.
20. Navigate dashboard sections - A member uses desktop tabs or the mobile menu to switch between Calendar, Tasks, Locations, Trips, Recipes, and Watchlist, limited by enabled dashboard sections.
21. Customize dashboard sections - An owner opens settings, edits the dashboard name and enabled shared sections, saves, and navigation updates to match the selected sections.
22. Share dashboard - An owner opens share/settings, generates a one-time join code or invite link, copies the dashboard ID, join code, or invite link, and can regenerate a new code.
23. Read share state as member - A non-owner opens share/settings surfaces and can see read-only share information, while invite generation is blocked.
24. Leave dashboard - A member or owner confirms leaving a dashboard; the backend removes membership, deletes the dashboard if no members remain, or promotes another member if the owner leaves.
25. Edit account name or username - A signed-in user opens account controls, edits name or username, sees username availability feedback, saves, and the app updates the current user display.
26. Change account email - A signed-in user opens account controls, enters a new email, submits, and receives a confirmation-link message.
27. Change password - A signed-in user opens the full account modal, expands Change password, enters current and new password, submits, and receives success or validation errors.
28. Manage dashboard profile people - A dashboard profile can contain people with names and colors used for task assignment.
29. Add calendar activity - A member opens Add activity, enters title, date, optional end date, time, repeat rule, repeat-until date, and description, then saves it to the shared calendar.
30. Browse calendar - A member views the current month, moves between months, jumps to Today, selects a date, sees a day or month agenda, and sees recurring/multi-day occurrences rendered.
31. Edit calendar activity - A member clicks an agenda item, edits title/date/end date/time/recurrence/description, saves, and the whole series is updated for recurring activities.
32. Delete calendar activity - A member deletes an activity, confirms the destructive action, and recurring activity deletion removes the whole series.
33. Add task - A member opens Add task, enters title and optional description, assignment, due date, and recurrence, then saves it to the shared task list.
34. Browse and filter tasks - A member views active/completed counts, filters All/Active/Completed, expands completed tasks, and sees due dates, overdue state, assignee, recurrence, and last completion labels.
35. Complete task - A member checks a one-off task as complete or incomplete; for recurring tasks, checking records one occurrence and keeps the task active.
36. Edit task - A member edits a task inline, changes title, description, and recurrence, then saves or cancels.
37. Reorder task - A member drags a task or uses move up/down controls to reorder tasks within active or completed groups.
38. Delete task - A member deletes a task, confirms, and the task is removed from the shared list.
39. Add location - A member opens Add location, enters name, category, address, website, notes, and favourite state; the app geocodes the address and saves the place.
40. Browse locations map and cards - A member sees saved places on a Leaflet/OpenStreetMap map, filters by category, favourites, or visited, and focuses a card/marker.
41. Update location state - A member marks a place as favourite/unfavourite, visited/not visited, rates it with stars, adds/changes/removes a photo, opens website/map links, or deletes the place.
42. Add trip - A member opens Add trip, chooses past/next trip, enters destination, year, dates, itinerary items, bookings, notes, packing items, photo URL, and accommodation URL, then saves.
43. Browse trips - A member sees upcoming and past trips grouped by date/type, opens accommodation links, and sees itinerary/bookings/packing summary pills.
44. View trip details - A member opens a trip detail modal, reviews photo, dates, itinerary, bookings, notes, accommodation links, and packing list.
45. Edit trip - A member edits trip destination, year, dates, itinerary, bookings, notes, packing list, trip type, photo URL, and accommodation URL, then saves.
46. Delete trip - A member deletes a trip, confirms, and the trip is removed.
47. Add recipe - A member opens Add recipe, enters name, prep time, photo URL, source link, ingredients, and instructions, then saves.
48. Browse and search recipes - A member searches recipes by name or ingredients and browses recipe cards sorted by creation time.
49. View recipe details - A member opens a recipe card, views photo, prep time, source link, ingredients, and instructions.
50. Edit recipe - A member edits recipe name, photo URL, prep time, source link, ingredients, and instructions, then saves.
51. Delete recipe - A member deletes a recipe, confirms, and the recipe is removed.
52. Choose watchlist media type - A member opens Watchlist, switches between TV Shows, Movies, and Books, and returns to the media type tiles.
53. Search and add watchlist item - A member searches TMDB/Jikan/Open Library for a TV show, movie, anime, or book, selects a result, and adds it with the default status.
54. Browse watchlist by status - A member sees media cards grouped by Watching/Planned/Completed or Reading/To be read/Read, with empty states per section.
55. Change watchlist status - A member opens a media card options menu and moves the item to another status.
56. Remove watchlist item - A member chooses Remove from the media card menu, confirms, and the item is removed.
57. Track TV/anime progress - A member opens progress on a watching TV show, selects season/episode or episode number, and saves progress.
58. Track book progress - A member opens progress on a book, enters current page and total pages, and sees a progress bar.
59. Dashboard settings modal fallback - A member can open full-screen modal versions of dashboard settings/share/account flows from mobile or callback controls.
60. Unsaved dialog navigation guard - A member with an open dashboard modal/dialog attempts to navigate away, and the app prompts before discarding unsaved form state.
