# Booking concurrency hardening plan

## Scope and constraints

- This is an analysis-only plan. No application files, database data, or indexes have been changed.
- The configured MongoDB database is `local_services_marketplace`. Per the supplied Atlas verification it is empty, has no `bookings` collection yet, and its replica-set deployment does **not** support multi-document transactions.
- The implementation must therefore use single-document atomic MongoDB operations and database constraints. It must not use Mongoose sessions, `startTransaction()`, `withTransaction()`, or any transaction-dependent design.

## Current architecture

- Express mounts booking routes at `/api/bookings` in `server/src/app.js`; every route uses `protect`, which verifies the JWT and loads an active user. `authorize` then limits cancellation/rescheduling to customers and provider booking views/status updates to providers.
- `Booking` stores a customer `User` reference, a provider `ProviderProfile` reference, date, one of three time slots, address/details, and status. The status states are `pending`, `accepted`, `rejected`, `in_progress`, `completed`, and `cancelled`.
- `createBooking` checks an approved/available provider and offered service, checks for a slot conflict, then creates a pending booking. It catches Mongo duplicate-key error `11000` and maps it to HTTP 409. It subsequently creates a notification.
- Customers can cancel or reschedule only pending/accepted bookings. Providers can transition `pending -> accepted|rejected`, `accepted -> in_progress`, and `in_progress -> completed`. Completion currently uses a conditional `findOneAndUpdate`, then independently increments `ProviderProfile.completedJobs`.
- Provider availability is stored on both `User.isAvailable` and `ProviderProfile.isAvailable`; booking creation consults only the profile. Availability changes update the two documents separately.
- `ProviderProfile` persists `completedJobs`, `ratingAverage`, and `reviewCount`. Review creation has a unique `Review.booking` constraint but recalculates its provider aggregates with a read-modify-save sequence.
- Configuration is read with `dotenv` in `server/src/config/env.js`; `MONGODB_URI` must include a database name. Existing local environment keys include `MONGODB_URI` and JWT settings. No secret values were read or recorded.
- `server/package.json` has no test script or test dependencies at present.

## Existing indexes and their status

`server/src/models/Booking.js` declares:

1. `{ customer: 1, createdAt: -1 }` for a customer's booking history.
2. A unique partial index on `{ provider: 1, date: 1, timeSlot: 1 }` for records whose status is `pending`, `accepted`, or `in_progress`.

The second index is the correct database-level invariant for one active reservation per provider/date/slot. The pre-insert `findOne` check is only a friendly fast path; it is not the concurrency protection. Because the Atlas database is new and has no collections, the index must be explicitly verified/created before booking traffic is enabled; relying solely on Mongoose automatic index creation is not an operational guarantee.

## Identified race conditions and root causes

| Flow | Current race / failure | Root cause |
| --- | --- | --- |
| Two customers create the same slot | The two conflict reads can both report no booking. The unique partial index permits only one insert, and the loser is currently mapped to 409, so duplicate active reservations are prevented **only if the index exists**. | Check-then-insert is non-atomic. |
| Customer cancel vs provider accept/start | Both handlers read an allowed pre-state and later call `save()`. Each can succeed; the later write overwrites the other terminal/current status. Both can emit notifications that do not describe the final state. | Read-modify-write status changes are not compare-and-set operations. |
| Provider accept vs reject, or duplicate accept/start requests | Concurrent requests can each read `pending`/`accepted`, pass validation, save, and return success even though only one transition should occur. | State validation is separated from the write. |
| Customer reschedule vs cancel/provider transition | Reschedule reads a cancellable booking, checks a target slot, then saves only date/time. A simultaneous status change can be overwritten or reschedule a booking no longer eligible. The unique index protects the destination slot but not the booking's required source status. | Separate reads followed by an unconditional document save. |
| Completion vs duplicate completion request | The booking state change is already conditional on `in_progress`, so at most one request reaches the following `$inc`; duplicate increments from two successful completion requests are not expected. However the booking completion and provider counter increment are separate documents/operations. A crash or transient error after completion can leave `completedJobs` under-counted, and a retry cannot safely infer whether an earlier increment happened. | Cross-document state/counter update cannot be atomically committed without transactions. |
| Provider review aggregates (adjacent provider statistics) | Two reviews for different completed bookings can both read the same average/count and save computed values, losing one review's contribution. `Review.booking` stops duplicate reviews only at insert time. | Read-modify-write aggregate update on `ProviderProfile`. |
| Create-booking role guard | The create route has `protect` but no `authorize("customer")`; an authenticated provider/admin can currently create a booking. This is an authorization defect rather than a race, but it weakens the booking invariant. | Missing route-level role middleware. |

## Transaction-free implementation design

### 1. Treat the active-slot unique partial index as the booking authority

- Keep the existing partial unique index unchanged: active statuses are `pending`, `accepted`, and `in_progress`; `rejected`, `cancelled`, and `completed` release the slot.
- Retain a preflight slot lookup only for a clearer early error, but always attempt the insert/update and translate duplicate-key `11000` to the same 409 response.
- Add an explicit, repeatable index verification/synchronization command for deployment/bootstrap. It will create the collection/index before traffic and fail loudly if an incompatible index already exists. This command is intentionally not run during the present analysis.

### 2. Make every status mutation a single conditional update (compare-and-set)

- Replace document reads followed by `booking.save()` with `Booking.findOneAndUpdate`/`findOneAndDelete`-style conditional updates that include `_id`, owner/provider identity, and the permitted current status in the filter.
- Customer cancellation: filter on `{ _id, customer, status: { $in: ["pending", "accepted"] } }`, then `$set: { status: "cancelled" }`.
- Provider transitions: use a fixed transition map and include the source status in the filter: `pending -> accepted`, `pending -> rejected`, `accepted -> in_progress`, and `in_progress -> completed`. A null result means the request lost the race or is invalid; return a conflict/state-transition response and do not create a notification.
- Customer reschedule: issue one conditional update whose filter includes customer ownership and eligible source status, and whose `$set` changes date/time. Handle duplicate-key error as a target-slot conflict. This preserves source-state correctness as well as the unique-slot invariant.
- Send status/cancel/reschedule notifications only after the conditional mutation returned a document. Thus exactly one winning state transition creates the corresponding notification for normal concurrent requests. Notification persistence itself remains best-effort under the current notification service.

### 3. Remove cross-document completed-job counter mutation from the critical path

- Make `Booking.status === "completed"` the sole source of truth for completed work. Remove the `$inc` of `ProviderProfile.completedJobs` from booking completion.
- Project `completedJobs` when serving provider data using a single aggregation/count query over completed bookings (batched by provider IDs for the provider list, and a single count for profile/detail views). This count has no duplicate-increment or partial-commit failure mode because it is derived from the completed booking records.
- Retain the existing schema field temporarily only for backward compatibility, but stop treating it as authoritative. A later, separately approved cleanup can remove/backfill the obsolete cache after consumers are migrated.

### 4. Harden review-derived provider statistics using the same principle

- Replace the provider profile read-modify-save in review creation with a provider-scoped aggregation/read projection (preferred, to make rating and count correct after retries/crashes), or explicitly use one atomic update pipeline if a cached statistic is required for performance. The chosen implementation should treat `Review` as the source of truth and calculate `reviewCount` and rounded `ratingAverage` from reviews for a provider.
- Keep `Review.booking` unique; create and duplicate-key handling are the authoritative duplicate-review guard, not the pre-check. This is adjacent to completed booking statistics and should be covered in the same hardening work.

### 5. Availability consistency

- Keep booking creation's atomic slot reservation independent of availability; availability is an admission rule, not a reservation lock. A provider becoming unavailable immediately after its eligibility read may still receive one booking, which is an accepted consistency boundary without transactions.
- In the planned code, document that boundary and make the booking route customer-only. Do not claim cross-document `User`/`ProviderProfile` availability updates are atomic; reconciling the duplicate availability fields is a separate data-model change.

## Indexes required

| Collection | Index | Purpose |
| --- | --- | --- |
| `bookings` | `{ customer: 1, createdAt: -1 }` | Existing customer history query. |
| `bookings` | unique partial `{ provider: 1, date: 1, timeSlot: 1 }`, filter `status in [pending, accepted, in_progress]` | Authoritative prevention of duplicate active provider slots. |
| `bookings` | `{ provider: 1, status: 1 }` | Efficient batched `completedJobs` projection and provider status queries. |
| `reviews` | unique `{ booking: 1 }` | Existing authoritative one-review-per-booking rule. |
| `reviews` | `{ provider: 1, createdAt: -1 }` (existing) | Provider review reads; retain. |
| `reviews` | `{ provider: 1, rating: 1 }` is **not required** | Aggregating rating/count only needs the provider filter; do not add speculative indexes. |

## Exact files to modify after approval

| File | Planned change | Race prevention |
| --- | --- | --- |
| `server/src/controllers/booking.controller.js` | Convert cancel, reschedule, and all provider transitions to conditional updates; remove completed-jobs `$inc`; centralize transition filters/error mapping; notify only after winning mutation. | Eliminates check-then-save races and duplicate transition effects. |
| `server/src/routes/booking.routes.js` | Add `authorize("customer")` to booking creation. | Restricts booking-state creation to the intended actor. |
| `server/src/models/Booking.js` | Preserve active-slot index; add provider/status read index and ensure index names/options are explicit for verification. | Keeps database enforcement and supports derived stats efficiently. |
| `server/src/controllers/provider.controller.js` | Batch/project completed booking counts into provider responses rather than reading `completedJobs` cache. | Makes completed-job statistics idempotent and derived from authoritative booking state. |
| `server/src/controllers/review.controller.js` | Make review stats derived (or an explicitly documented atomic cached projection) and catch `11000` as a duplicate review conflict. | Prevents lost updates and duplicate review effects. |
| `server/src/models/ProviderProfile.js` | Mark `completedJobs`, `ratingAverage`, and `reviewCount` as deprecated cached fields or remove their write responsibility once API projections are in place. | Prevents future code from treating cross-document caches as transactional truth. |
| `server/package.json` | Add test scripts/dependencies required for isolated integration tests and index bootstrap verification. | Makes concurrency checks repeatable. |
| `server/src/scripts/sync-booking-indexes.js` (new) | Explicitly connect using the existing environment configuration, run Booking index synchronization/verification, report results, disconnect. | Ensures the critical unique index exists before production writes. |
| `server/test/booking.concurrency.test.js` and supporting test setup (new) | Integration tests against a disposable MongoDB instance, without transactions. | Reproduces parallel API/database operations deterministically. |

No change is planned for `server/.env` or its credentials. Existing `server/.env.example`, `server/src/config/env.js`, and `server/src/config/db.js` have uncommitted work from before this task and will be preserved.

## Testing strategy

1. Add a server test command and an isolated test database configuration. Tests must never point at the configured Atlas URI; use a disposable local/containerized MongoDB or a dedicated explicitly named test URI.
2. Assert schema/index readiness first: the active-slot index exists, is unique, and has the exact partial filter.
3. Concurrent create test: issue 10+ simultaneous creates for the same provider/date/time slot with different customers. Expect exactly one 201, all remaining requests 409, and exactly one active booking in the database.
4. Slot-release tests: after `rejected`, `cancelled`, and `completed`, a new booking for the slot succeeds; after `pending`, `accepted`, and `in_progress`, it fails with 409.
5. Concurrent status tests: race `accepted` vs `rejected`, duplicate `accepted`, duplicate `in_progress`, and duplicate `completed`. Assert exactly one request wins each source state, the final status is valid, and one matching notification is produced for the winning mutation.
6. Cancel/reschedule races: run customer cancel/reschedule against provider accept/start in parallel. Assert no operation reports success unless its source-status predicate held, no invalid final state is written, and a destination slot never has two active bookings.
7. Completed-stat test: complete a booking concurrently many times; assert one completed booking exists and the provider response's derived completed count is exactly one. Repeat with multiple different completed bookings for one provider.
8. Review-stat test: submit reviews for two completed bookings concurrently, plus duplicate submissions for one booking. Assert one review per booking and provider projections equal the exact review count/average derived from `reviews`.
9. Failure-path tests: force duplicate-key errors during create/reschedule and verify 409 responses, no extra active booking, and no winning-transition notification emitted on a lost race.

## Approval gate

After approval, implementation will be limited to the files and behavior above, will not introduce transactions, and will run only the isolated test database—not the configured Atlas database—for automated tests.
