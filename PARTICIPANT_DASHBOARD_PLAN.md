# Participant Dashboard Planning

## Matching Flow Overview
- Admins generate candidate volunteers via `/matching/{user_id}` (already implemented).
- Admins curate a subset and create match records for the participant.
- Participant dashboard must show those matches, allow scheduling exactly one call at a time, request alternate time slots, request new volunteers, and cancel engagements.

## Backend State (2025-09-12)

### Existing Support
- `MatchingService.get_matches` (`backend/app/services/implementations/matching_service.py:26`) returns ranked volunteer suggestions for admins.
- Data model already covers `matches`, `match_status`, `time_blocks`, and the `suggested_times` bridge (`backend/app/models/Match.py:9`, `backend/app/models/MatchStatus.py:6`, `backend/app/models/TimeBlock.py:7`, `backend/app/models/SuggestedTime.py:7`).
- Participants can confirm a time through `POST /matches/confirm-time` (`backend/app/routes/match.py:15`).
- Suggested time blocks can be created (`backend/app/routes/suggested_times.py:27`).

### Gaps / Issues
1. **No admin API to create/update match records.** There’s no mechanism for admins to persist the selected volunteers they send to a participant.
2. **No participant match read API.** The dashboard cannot fetch assigned volunteers, status, chosen time, or suggested blocks.
3. **Match status semantics off.** Confirming a time currently sets status id `6` (“rescheduled”) (`backend/app/services/implementations/match_service.py:31`). We need clear statuses aligned with the UX.
4. **Suggested time visibility.** `/suggested-times` GET is restricted to admins/volunteers (`backend/app/routes/suggested_times.py:43`), so participants can’t read their options without a new path.
5. **Time block granularity conflict.** `SuggestedTimesService` generates 30-minute blocks every 15 minutes (`backend/app/services/implementations/suggested_times_service.py:53`), but `TimeRange` validator enforces on-the-hour inputs (`backend/app/schemas/time_block.py:6`).
6. **Cancellation/request flows missing.** No endpoints exist for participant cancellation, volunteer cancellation, or “request new volunteers/times.”
7. **Single-active-match rule unenforced.** Current services allow multiple matches per participant despite the one-at-a-time business rule.

## Planned Match Statuses
(Replace seeds and logic to use these values; keep `no_show` and `rescheduled` available for future use.)
- `pending` – admin has assigned volunteers, participant has not picked a time.
- `confirmed` – participant selected a time block (current “scheduled” state).
- `cancelled_by_participant` – participant cancelled the call.
- `cancelled_by_volunteer` – volunteer/admin cancelled on their side.
- `completed` – call finished successfully.
- `requesting_new_times` – participant asked for alternative times.
- `requesting_new_volunteers` – participant wants new volunteer suggestions.
- `rescheduled` – reserved for future support.
- `no_show` – reserved for future support.

## Step-by-Step Backend Plan
1. **Standardize match statuses** ✅
   - Updated seed data to include the new lifecycle statuses and confirmed that `MatchService.submit_time` sets `confirmed`.

2. **Admin match management API** ✅
   - Added create/update routes and service logic so admins can assign volunteers, preload suggested time blocks from volunteer availability, and adjust statuses.

3. **Participant match read API** ✅
   - Implemented participant (`GET /matches/me`) and admin (`GET /matches/participant/{id}`) endpoints returning volunteer snapshots, chosen slot, and suggested blocks.

4. **Scheduling & reschedule endpoints** ✅
   - Participant `POST /matches/{id}/schedule` to choose a suggested time and automatically drop other matches.
   - Participant `POST /matches/{id}/request-new-times` clears existing suggestions, stores new time blocks, and marks the match as `requesting_new_times`.

5. **Cancellation endpoints**
   - Participant `POST /matches/{id}/cancel` -> status `cancelled_by_participant`.
   - Admin/volunteer `POST /matches/{id}/cancel-volunteer` -> status `cancelled_by_volunteer`.

6. **Request new volunteers endpoint**
   - Participant action (e.g., `POST /matches/{id}/request-new-volunteers`) should clear all existing matches for that participant (hard delete is acceptable for now) and set the status for any remaining workflow to `requesting_new_volunteers`.

7. **Time block consistency**
   - Decide on granularity (hourly vs 30/15 combinations) and update both the `TimeRange` validator and `SuggestedTimesService` generator accordingly.

8. **Frontend implementation**
   - Replace placeholder dashboard with data-driven layout aligned to the Figma frame (`6244:128292`).
   - Build scheduling modal, cancellation, request-new-volunteers flows using the new API surface.

## Open Questions (answered)
- Volunteer confirmation is not required once the participant selects a slot; volunteers only react when new times are requested.
- Cancellation does not need a reason field for now.
- Requesting new volunteers should flag the match but leaves cleanup to admins (no auto removal yet).

## Next Actions
- Start with Step 1 (status cleanup) and proceed sequentially through the backend tasks before moving to the frontend work.
- Defer end-to-end testing until after Steps 3–6 land; at that point, plan to seed the DB, hit the new admin endpoints (create/update/request-new-volunteers), and verify participant scheduling flows via the confirm-time endpoint.
