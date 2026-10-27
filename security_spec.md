# LifeTrack Firestore Security Specification

## 1. Data Invariants
1. **Strict Tenant Isolation**: Every document under `/users/{userId}` and all subcollections (`security`, `studySessions`, `workoutLogs`, `words`, `books`, `readingLogs`, `expenses`, `habitLogs`, `chapterProgress`, `routines`, `domainState`) can ONLY be read, listed, created, updated, or deleted when `request.auth != null && request.auth.uid == userId` and `uid == request.auth.uid`.
2. **Master Gate**: Subcollection writes require the parent `/users/{userId}` document to exist (`exists(/databases/$(database)/documents/users/$(userId))`).
3. **Verified Identity**: Standard writes require verified user credentials (`request.auth.token.email_verified == true || request.auth.token.firebase.sign_in_provider == 'phone'`).
4. **Monotonic Lockout Protection**: `/users/{userId}/security/{lockId}` prevents resetting `failedAttempts` to `0` while `request.time <= resource.data.lockedUntil`. Clients may only increment `failedAttempts` by 1 during active attempts, or reset `failedAttempts` to 0 after `lockedUntil` has expired.
5. **Chapter Tracker Bounds**: `completedClasses >= 0 && completedClasses <= totalClasses`.
6. **Temporal & Identity Immutability**: `createdAt == request.time` on create, `updatedAt == request.time` on update, and `uid` and `createdAt` are immutable across updates.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Return `PERMISSION_DENIED`)
1. **Cross-Tenant PII Read**: User A (`uid: "user_a"`) calls `get(/users/user_b)`.
2. **Unverified Email Write**: User with `email_verified: false` attempts `create(/users/user_a)`.
3. **Identity Spoofing in Payload**: User A creates `/users/user_a/expenses/tx_1` with `{ uid: "user_b", ... }`.
4. **Shadow Ghost Field Injection**: User A updates `/users/user_a` adding `{ isAdmin: true }`.
5. **Orphan Subcollection Write**: User A creates `/users/user_a/studySessions/s1` before `/users/user_a` exists.
6. **ID Poisoning**: User A creates `/users/user_a/words/` with a 500-char non-alphanumeric ID.
7. **Denial-of-Wallet Oversized String**: User A creates `/users/user_a/expenses/tx_1` with a 50,000-char `note`.
8. **Client Timestamp Forgery**: User A sets `createdAt` to `2020-01-01T00:00:00Z` instead of `request.time`.
9. **Immortal Field Mutation**: User A updates `/users/user_a/routines/r1` modifying `createdAt` or `uid`.
10. **PIN Lockout Bypass**: User A updates `/users/user_a/security/pinLock` setting `failedAttempts: 0` while `request.time < lockedUntil`.
11. **Tracker Invariant Violation**: User A sets `completedClasses: 15` when `totalClasses: 10` in `chapterProgress`.
12. **Blanket List Query Scraping**: User A attempts `list(/users/user_b/expenses)` without ownership.
