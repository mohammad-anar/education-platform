# Schema Architecture Notes & Duplicate Entity Audit

> **Document:** `docs/schema-notes.md`  
> **Status:** Active Review  
> **Target:** Education ERP & LMS Schema Optimization  

---

## 1. Overview
During Step 1 audit and schema hardening, several duplicate fields, overlapping progress-tracking models, and unreferenced enum values were identified across the LMS and Digital Learning domain (`prisma/schema/lms.prisma` and `prisma/schema/enums.prisma`). Per project rules, these entities are **not automatically dropped** to maintain full backward compatibility with any inflight integrations. Instead, this document analyzes the architectural impacts and provides actionable recommendations.

---

## 2. Identified Schema Overlaps & Duplicates

### 2.1. `Lesson.accessType` / `isPreview` vs. `LearningItem.accessType` / `isPreview`

* **Source Locations:**
  * `LearningItem` in [`prisma/schema/lms.prisma`](file:///e:/Anar/PR/Education-Platform/prisma-starter/prisma/schema/lms.prisma#L295):
    ```prisma
    accessType  AccessType @default(LOCKED)
    isPreview   Boolean    @default(false)
    ```
  * `Lesson` in [`prisma/schema/lms.prisma`](file:///e:/Anar/PR/Education-Platform/prisma-starter/prisma/schema/lms.prisma#L327-L336):
    ```prisma
    accessType  AccessType @default(LOCKED)
    isPreview   Boolean    @default(false)
    ```
  * `LessonVideo` in [`prisma/schema/lms.prisma`](file:///e:/Anar/PR/Education-Platform/prisma-starter/prisma/schema/lms.prisma#L361):
    ```prisma
    accessType  AccessType @default(LOCKED)
    ```

* **Architectural Problem:**
  * In the curriculum hierarchy, `LearningItem` is the polymorphic parent container (`type: LESSON | QUIZ | ASSIGNMENT`) linked to `Module`.
  * The access decision middleware (`GET /learning-items/:id/access`) and enrollment gates evaluate `LearningItem.accessType`.
  * Having identical `accessType` and `isPreview` fields on `Lesson` creates a dual-source-of-truth problem: a `LearningItem` may be configured as `FREE` while the child `Lesson` or `LessonVideo` is marked `LOCKED`.
* **Recommendation:**
  1. Designate **`LearningItem.accessType`** and **`LearningItem.isPreview`** as the single canonical source of truth for access resolution and free-preview eligibility.
  2. Deprecate `Lesson.accessType`, `Lesson.isPreview`, and `LessonVideo.accessType`. Keep them read-only in the ORM or synchronize them via a Prisma extension/service hook on item update.
  3. Schedule column removal for V2 schema cleanup once frontend components exclusively query `learningItem.accessType`.

---

### 2.2. `LessonProgress` vs. `LearningItemProgress`

* **Source Locations:**
  * `LearningItemProgress` in [`prisma/schema/lms.prisma`](file:///e:/Anar/PR/Education-Platform/prisma-starter/prisma/schema/lms.prisma#L476):
    ```prisma
    model LearningItemProgress {
      id              String                 @id @default(uuid()) @db.Uuid
      enrollmentId    String                 @db.Uuid
      learningItemId  String                 @db.Uuid
      instituteId     String                 @db.Uuid
      status          LearningProgressStatus @default(NOT_STARTED)
      progressPercent Decimal                @default(0) @db.Decimal(5, 2)
      startedAt       DateTime?
      completedAt     DateTime?
      lastPositionSec Int?
      score           Decimal?               @db.Decimal(10, 2)
      ...
    }
    ```
  * `LessonProgress` in [`prisma/schema/lms.prisma`](file:///e:/Anar/PR/Education-Platform/prisma-starter/prisma/schema/lms.prisma#L503):
    ```prisma
    model LessonProgress {
      id              String    @id @default(uuid()) @db.Uuid
      lessonId        String    @db.Uuid
      studentId       String    @db.Uuid
      progressPercent Decimal   @default(0) @db.Decimal(5, 2)
      watchedSeconds  Int       @default(0)
      lastPositionSec Int?
      isCompleted     Boolean   @default(false)
      firstAccessedAt DateTime?
      lastAccessedAt  DateTime?
      completedAt     DateTime?
      ...
    }
    ```

* **Architectural Problem:**
  * `LearningItemProgress` associates progress with **`CourseEnrollment`** (`enrollmentId`), ensuring proper scoping if a student re-enrolls or takes courses across multiple academic cycles. It also uniformly handles lessons, quizzes, and assignments.
  * `LessonProgress` bypasses `CourseEnrollment` and directly links `studentId` to `lessonId`. This breaks cohort-based analytics and creates desynchronization (e.g. video completion marked in `LessonProgress` but milestone completion calculated via `LearningItemProgress`).
* **Recommendation:**
  1. Standardize all completion funnels and course analytics on **`LearningItemProgress`**.
  2. If granular video playback tracking (e.g. `watchedSeconds`) is needed, add `watchedSeconds Int @default(0)` to `LearningItemProgress` rather than querying `LessonProgress`.
  3. Mark `LessonProgress` as legacy. In progress-recording services, write to `LearningItemProgress` as primary, and optionally update `LessonProgress` for legacy API compatibility.

---

### 2.3. Unused `AccessType.RESTRICTED` Enum Value

* **Source Location:**
  * [`prisma/schema/enums.prisma`](file:///e:/Anar/PR/Education-Platform/prisma-starter/prisma/schema/enums.prisma#L112):
    ```prisma
    enum AccessType {
      FREE
      ENROLLED
      LOCKED
      RESTRICTED
    }
    ```

* **Architectural Problem:**
  * The business rule engine evaluates access states:
    * `FREE`: Accessible to guests/unauthenticated or preview users.
    * `ENROLLED`: Requires active `CourseEnrollment`.
    * `LOCKED`: Requires sequential completion of previous prerequisite milestones.
  * Explicit student-level bans, suspensions, and manual exclusions are managed via **`CourseAccessRestriction`** using the dedicated enum `CourseRestrictionType` (`BAN`, `SUSPEND`, `REVOKE_ACCESS`).
  * `RESTRICTED` is never referenced in business logic, Zod validation schemas, or service branches.
* **Recommendation:**
  1. Avoid assigning `RESTRICTED` to any content in seed data or UI selectors.
  2. If geo-fencing, IP-whitelisting, or cohort-specific access is implemented in future phases, utilize `CourseAccessRestriction` or an explicit rule model instead of overloading `AccessType`.
  3. Deprecate `AccessType.RESTRICTED` and mark for cleanup in next breaking enum migration.
