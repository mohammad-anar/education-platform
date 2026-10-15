# OpenAPI Route Inventory

> Comprehensive inventory of all routes under `/api/v1`, capturing HTTP methods, endpoint paths, request validation schemas, permission codes, access level (public vs protected), and router source files.

## 1. Summary Metrics

- **Total Registered Routes:** 347
- **Routes with Active Zod Schema Middleware:** 160
- **Routes with No Zod Schema Middleware:** 187
- **Public Routes:** 8
- **Protected Routes:** 339

## 2. Complete Route Inventory Table

| # | Method | Path | Validate Schema | Permission Guard | Access | Router File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/v1/academic/classes` | *None* | `academic.classGroup.read` | 🔒 Protected | `src/modules/academic/classGroup/classGroup.route.ts` |
| 2 | `POST` | `/api/v1/academic/classes` | `ClassGroupValidation.createZodSchema` | `academic.classGroup.create` | 🔒 Protected | `src/modules/academic/classGroup/classGroup.route.ts` |
| 3 | `DELETE` | `/api/v1/academic/classes/:id` | *None* | `academic.classGroup.delete` | 🔒 Protected | `src/modules/academic/classGroup/classGroup.route.ts` |
| 4 | `GET` | `/api/v1/academic/classes/:id` | *None* | `academic.classGroup.read` | 🔒 Protected | `src/modules/academic/classGroup/classGroup.route.ts` |
| 5 | `PATCH` | `/api/v1/academic/classes/:id` | `ClassGroupValidation.updateZodSchema` | `academic.classGroup.update` | 🔒 Protected | `src/modules/academic/classGroup/classGroup.route.ts` |
| 6 | `GET` | `/api/v1/academic/enrollments` | *None* | `academic.enrollment.read` | 🔒 Protected | `src/modules/academic/enrollment/enrollment.route.ts` |
| 7 | `POST` | `/api/v1/academic/enrollments` | `EnrollmentValidation.createZodSchema` | `academic.enrollment.create` | 🔒 Protected | `src/modules/academic/enrollment/enrollment.route.ts` |
| 8 | `DELETE` | `/api/v1/academic/enrollments/:id` | *None* | `academic.enrollment.delete` | 🔒 Protected | `src/modules/academic/enrollment/enrollment.route.ts` |
| 9 | `GET` | `/api/v1/academic/enrollments/:id` | *None* | `academic.enrollment.read` | 🔒 Protected | `src/modules/academic/enrollment/enrollment.route.ts` |
| 10 | `PATCH` | `/api/v1/academic/enrollments/:id` | `EnrollmentValidation.updateZodSchema` | `academic.enrollment.update` | 🔒 Protected | `src/modules/academic/enrollment/enrollment.route.ts` |
| 11 | `GET` | `/api/v1/academic/levels` | *None* | `academic.level.read` | 🔒 Protected | `src/modules/academic/level/level.route.ts` |
| 12 | `POST` | `/api/v1/academic/levels` | `LevelValidation.createZodSchema` | `academic.level.create` | 🔒 Protected | `src/modules/academic/level/level.route.ts` |
| 13 | `DELETE` | `/api/v1/academic/levels/:id` | *None* | `academic.level.delete` | 🔒 Protected | `src/modules/academic/level/level.route.ts` |
| 14 | `GET` | `/api/v1/academic/levels/:id` | *None* | `academic.level.read` | 🔒 Protected | `src/modules/academic/level/level.route.ts` |
| 15 | `PATCH` | `/api/v1/academic/levels/:id` | `LevelValidation.updateZodSchema` | `academic.level.update` | 🔒 Protected | `src/modules/academic/level/level.route.ts` |
| 16 | `GET` | `/api/v1/academic/programs` | *None* | `academic.program.read` | 🔒 Protected | `src/modules/academic/program/program.route.ts` |
| 17 | `POST` | `/api/v1/academic/programs` | `ProgramValidation.createZodSchema` | `academic.program.create` | 🔒 Protected | `src/modules/academic/program/program.route.ts` |
| 18 | `DELETE` | `/api/v1/academic/programs/:id` | *None* | `academic.program.delete` | 🔒 Protected | `src/modules/academic/program/program.route.ts` |
| 19 | `GET` | `/api/v1/academic/programs/:id` | *None* | `academic.program.read` | 🔒 Protected | `src/modules/academic/program/program.route.ts` |
| 20 | `PATCH` | `/api/v1/academic/programs/:id` | `ProgramValidation.updateZodSchema` | `academic.program.update` | 🔒 Protected | `src/modules/academic/program/program.route.ts` |
| 21 | `GET` | `/api/v1/academic/sections` | *None* | `academic.section.read` | 🔒 Protected | `src/modules/academic/section/section.route.ts` |
| 22 | `POST` | `/api/v1/academic/sections` | `SectionValidation.createZodSchema` | `academic.section.create` | 🔒 Protected | `src/modules/academic/section/section.route.ts` |
| 23 | `DELETE` | `/api/v1/academic/sections/:id` | *None* | `academic.section.delete` | 🔒 Protected | `src/modules/academic/section/section.route.ts` |
| 24 | `GET` | `/api/v1/academic/sections/:id` | *None* | `academic.section.read` | 🔒 Protected | `src/modules/academic/section/section.route.ts` |
| 25 | `PATCH` | `/api/v1/academic/sections/:id` | `SectionValidation.updateZodSchema` | `academic.section.update` | 🔒 Protected | `src/modules/academic/section/section.route.ts` |
| 26 | `GET` | `/api/v1/academic/subjects` | *None* | `academic.subject.read` | 🔒 Protected | `src/modules/academic/subject/subject.route.ts` |
| 27 | `POST` | `/api/v1/academic/subjects` | `SubjectValidation.createZodSchema` | `academic.subject.create` | 🔒 Protected | `src/modules/academic/subject/subject.route.ts` |
| 28 | `DELETE` | `/api/v1/academic/subjects/:id` | *None* | `academic.subject.delete` | 🔒 Protected | `src/modules/academic/subject/subject.route.ts` |
| 29 | `GET` | `/api/v1/academic/subjects/:id` | *None* | `academic.subject.read` | 🔒 Protected | `src/modules/academic/subject/subject.route.ts` |
| 30 | `PATCH` | `/api/v1/academic/subjects/:id` | `SubjectValidation.updateZodSchema` | `academic.subject.update` | 🔒 Protected | `src/modules/academic/subject/subject.route.ts` |
| 31 | `GET` | `/api/v1/academic/years` | *None* | `academic.academicYear.read` | 🔒 Protected | `src/modules/academic/academicYear/academicYear.route.ts` |
| 32 | `POST` | `/api/v1/academic/years` | `AcademicYearValidation.createZodSchema` | `academic.academicYear.create` | 🔒 Protected | `src/modules/academic/academicYear/academicYear.route.ts` |
| 33 | `DELETE` | `/api/v1/academic/years/:id` | *None* | `academic.academicYear.delete` | 🔒 Protected | `src/modules/academic/academicYear/academicYear.route.ts` |
| 34 | `GET` | `/api/v1/academic/years/:id` | *None* | `academic.academicYear.read` | 🔒 Protected | `src/modules/academic/academicYear/academicYear.route.ts` |
| 35 | `PATCH` | `/api/v1/academic/years/:id` | `AcademicYearValidation.updateZodSchema` | `academic.academicYear.update` | 🔒 Protected | `src/modules/academic/academicYear/academicYear.route.ts` |
| 36 | `GET` | `/api/v1/assessment/assessments` | *None* | `assessment.assessment.read` | 🔒 Protected | `src/modules/assessment/assessment/assessment.route.ts` |
| 37 | `POST` | `/api/v1/assessment/assessments` | `AssessmentValidation.createZodSchema` | `assessment.assessment.create` | 🔒 Protected | `src/modules/assessment/assessment/assessment.route.ts` |
| 38 | `DELETE` | `/api/v1/assessment/assessments/:id` | *None* | `assessment.assessment.delete` | 🔒 Protected | `src/modules/assessment/assessment/assessment.route.ts` |
| 39 | `GET` | `/api/v1/assessment/assessments/:id` | *None* | `assessment.assessment.read` | 🔒 Protected | `src/modules/assessment/assessment/assessment.route.ts` |
| 40 | `PATCH` | `/api/v1/assessment/assessments/:id` | `AssessmentValidation.updateZodSchema` | `assessment.assessment.update` | 🔒 Protected | `src/modules/assessment/assessment/assessment.route.ts` |
| 41 | `POST` | `/api/v1/assessment/assessments/:id/submit-assignment` | *None* | `assessment.assessment.read` | 🔒 Protected | `src/modules/assessment/assessment/assessment.route.ts` |
| 42 | `POST` | `/api/v1/assessment/assessments/:id/submit-quiz` | *None* | `assessment.assessment.read` | 🔒 Protected | `src/modules/assessment/assessment/assessment.route.ts` |
| 43 | `GET` | `/api/v1/assessment/exams` | *None* | `assessment.exam.read` | 🔒 Protected | `src/modules/assessment/exam/exam.route.ts` |
| 44 | `POST` | `/api/v1/assessment/exams` | `ExamValidation.createZodSchema` | `assessment.exam.create` | 🔒 Protected | `src/modules/assessment/exam/exam.route.ts` |
| 45 | `DELETE` | `/api/v1/assessment/exams/:id` | *None* | `assessment.exam.delete` | 🔒 Protected | `src/modules/assessment/exam/exam.route.ts` |
| 46 | `GET` | `/api/v1/assessment/exams/:id` | *None* | `assessment.exam.read` | 🔒 Protected | `src/modules/assessment/exam/exam.route.ts` |
| 47 | `PATCH` | `/api/v1/assessment/exams/:id` | `ExamValidation.updateZodSchema` | `assessment.exam.update` | 🔒 Protected | `src/modules/assessment/exam/exam.route.ts` |
| 48 | `PATCH` | `/api/v1/assessment/exams/marks/:id` | *None* | `assessment.exam.updateMark` | 🔒 Protected | `src/modules/assessment/exam/exam.route.ts` |
| 49 | `GET` | `/api/v1/assessment/grading-systems` | *None* | `assessment.grading.read` | 🔒 Protected | `src/modules/assessment/grading/grading.route.ts` |
| 50 | `POST` | `/api/v1/assessment/grading-systems` | `GradingValidation.createZodSchema` | `assessment.grading.create` | 🔒 Protected | `src/modules/assessment/grading/grading.route.ts` |
| 51 | `DELETE` | `/api/v1/assessment/grading-systems/:id` | *None* | `assessment.grading.delete` | 🔒 Protected | `src/modules/assessment/grading/grading.route.ts` |
| 52 | `GET` | `/api/v1/assessment/grading-systems/:id` | *None* | `assessment.grading.read` | 🔒 Protected | `src/modules/assessment/grading/grading.route.ts` |
| 53 | `PATCH` | `/api/v1/assessment/grading-systems/:id` | `GradingValidation.updateZodSchema` | `assessment.grading.update` | 🔒 Protected | `src/modules/assessment/grading/grading.route.ts` |
| 54 | `GET` | `/api/v1/assessment/marking-schemes` | *None* | `assessment.markingScheme.read` | 🔒 Protected | `src/modules/assessment/markingScheme/markingScheme.route.ts` |
| 55 | `POST` | `/api/v1/assessment/marking-schemes` | `MarkingSchemeValidation.createZodSchema` | `assessment.markingScheme.create` | 🔒 Protected | `src/modules/assessment/markingScheme/markingScheme.route.ts` |
| 56 | `DELETE` | `/api/v1/assessment/marking-schemes/:id` | *None* | `assessment.markingScheme.delete` | 🔒 Protected | `src/modules/assessment/markingScheme/markingScheme.route.ts` |
| 57 | `GET` | `/api/v1/assessment/marking-schemes/:id` | *None* | `assessment.markingScheme.read` | 🔒 Protected | `src/modules/assessment/markingScheme/markingScheme.route.ts` |
| 58 | `PATCH` | `/api/v1/assessment/marking-schemes/:id` | `MarkingSchemeValidation.updateZodSchema` | `assessment.markingScheme.update` | 🔒 Protected | `src/modules/assessment/markingScheme/markingScheme.route.ts` |
| 59 | `GET` | `/api/v1/assessment/results` | *None* | `assessment.result.read` | 🔒 Protected | `src/modules/assessment/result/result.route.ts` |
| 60 | `POST` | `/api/v1/assessment/results` | `ResultValidation.createZodSchema` | `assessment.result.create` | 🔒 Protected | `src/modules/assessment/result/result.route.ts` |
| 61 | `DELETE` | `/api/v1/assessment/results/:id` | *None* | `assessment.result.delete` | 🔒 Protected | `src/modules/assessment/result/result.route.ts` |
| 62 | `GET` | `/api/v1/assessment/results/:id` | *None* | `assessment.result.read` | 🔒 Protected | `src/modules/assessment/result/result.route.ts` |
| 63 | `PATCH` | `/api/v1/assessment/results/:id` | `ResultValidation.updateZodSchema` | `assessment.result.update` | 🔒 Protected | `src/modules/assessment/result/result.route.ts` |
| 64 | `POST` | `/api/v1/assessment/results/:id/override` | *None* | `assessment.result.override` | 🔒 Protected | `src/modules/assessment/result/result.route.ts` |
| 65 | `POST` | `/api/v1/assessment/results/:id/publish` | *None* | `assessment.result.publish` | 🔒 Protected | `src/modules/assessment/result/result.route.ts` |
| 66 | `GET` | `/api/v1/attendance/calendars` | *None* | `attendance.calendar.read` | 🔒 Protected | `src/modules/attendance/calendar/calendar.route.ts` |
| 67 | `POST` | `/api/v1/attendance/calendars` | `CalendarValidation.createZodSchema` | `attendance.calendar.create` | 🔒 Protected | `src/modules/attendance/calendar/calendar.route.ts` |
| 68 | `DELETE` | `/api/v1/attendance/calendars/:id` | *None* | `attendance.calendar.delete` | 🔒 Protected | `src/modules/attendance/calendar/calendar.route.ts` |
| 69 | `GET` | `/api/v1/attendance/calendars/:id` | *None* | `attendance.calendar.read` | 🔒 Protected | `src/modules/attendance/calendar/calendar.route.ts` |
| 70 | `PATCH` | `/api/v1/attendance/calendars/:id` | `CalendarValidation.updateZodSchema` | `attendance.calendar.update` | 🔒 Protected | `src/modules/attendance/calendar/calendar.route.ts` |
| 71 | `POST` | `/api/v1/attendance/calendars/:id/generate-sessions` | *None* | `attendance.calendar.generateSessions` | 🔒 Protected | `src/modules/attendance/calendar/calendar.route.ts` |
| 72 | `GET` | `/api/v1/attendance/live-classes` | *None* | `attendance.liveClass.read` | 🔒 Protected | `src/modules/attendance/liveClass/liveClass.route.ts` |
| 73 | `POST` | `/api/v1/attendance/live-classes` | `LiveClassValidation.createZodSchema` | `attendance.liveClass.create` | 🔒 Protected | `src/modules/attendance/liveClass/liveClass.route.ts` |
| 74 | `DELETE` | `/api/v1/attendance/live-classes/:id` | *None* | `attendance.liveClass.delete` | 🔒 Protected | `src/modules/attendance/liveClass/liveClass.route.ts` |
| 75 | `GET` | `/api/v1/attendance/live-classes/:id` | *None* | `attendance.liveClass.read` | 🔒 Protected | `src/modules/attendance/liveClass/liveClass.route.ts` |
| 76 | `PATCH` | `/api/v1/attendance/live-classes/:id` | `LiveClassValidation.updateZodSchema` | `attendance.liveClass.update` | 🔒 Protected | `src/modules/attendance/liveClass/liveClass.route.ts` |
| 77 | `GET` | `/api/v1/attendance/policies` | *None* | `attendance.policy.read` | 🔒 Protected | `src/modules/attendance/policy/policy.route.ts` |
| 78 | `POST` | `/api/v1/attendance/policies` | `PolicyValidation.createZodSchema` | `attendance.policy.create` | 🔒 Protected | `src/modules/attendance/policy/policy.route.ts` |
| 79 | `DELETE` | `/api/v1/attendance/policies/:id` | *None* | `attendance.policy.delete` | 🔒 Protected | `src/modules/attendance/policy/policy.route.ts` |
| 80 | `GET` | `/api/v1/attendance/policies/:id` | *None* | `attendance.policy.read` | 🔒 Protected | `src/modules/attendance/policy/policy.route.ts` |
| 81 | `PATCH` | `/api/v1/attendance/policies/:id` | `PolicyValidation.updateZodSchema` | `attendance.policy.update` | 🔒 Protected | `src/modules/attendance/policy/policy.route.ts` |
| 82 | `GET` | `/api/v1/attendance/routines` | *None* | `attendance.routine.read` | 🔒 Protected | `src/modules/attendance/routine/routine.route.ts` |
| 83 | `POST` | `/api/v1/attendance/routines` | `RoutineValidation.createZodSchema` | `attendance.routine.create` | 🔒 Protected | `src/modules/attendance/routine/routine.route.ts` |
| 84 | `DELETE` | `/api/v1/attendance/routines/:id` | *None* | `attendance.routine.delete` | 🔒 Protected | `src/modules/attendance/routine/routine.route.ts` |
| 85 | `GET` | `/api/v1/attendance/routines/:id` | *None* | `attendance.routine.read` | 🔒 Protected | `src/modules/attendance/routine/routine.route.ts` |
| 86 | `PATCH` | `/api/v1/attendance/routines/:id` | `RoutineValidation.updateZodSchema` | `attendance.routine.update` | 🔒 Protected | `src/modules/attendance/routine/routine.route.ts` |
| 87 | `GET` | `/api/v1/attendance/sessions` | *None* | `attendance.session.read` | 🔒 Protected | `src/modules/attendance/session/session.route.ts` |
| 88 | `POST` | `/api/v1/attendance/sessions` | `SessionValidation.createZodSchema` | `attendance.session.create` | 🔒 Protected | `src/modules/attendance/session/session.route.ts` |
| 89 | `DELETE` | `/api/v1/attendance/sessions/:id` | *None* | `attendance.session.delete` | 🔒 Protected | `src/modules/attendance/session/session.route.ts` |
| 90 | `GET` | `/api/v1/attendance/sessions/:id` | *None* | `attendance.session.read` | 🔒 Protected | `src/modules/attendance/session/session.route.ts` |
| 91 | `PATCH` | `/api/v1/attendance/sessions/:id` | `SessionValidation.updateZodSchema` | `attendance.session.update` | 🔒 Protected | `src/modules/attendance/session/session.route.ts` |
| 92 | `POST` | `/api/v1/attendance/sessions/:id/mark` | *None* | `attendance.session.update` | 🔒 Protected | `src/modules/attendance/session/session.route.ts` |
| 93 | `POST` | `/api/v1/auth/change-password` | `AuthValidation.changePasswordZodSchema` | *auth()* | 🔒 Protected | `src/modules/auth/auth.route.ts` |
| 94 | `POST` | `/api/v1/auth/forgot-password` | `AuthValidation.forgotPasswordZodSchema` | *Public* | 🟢 Public | `src/modules/auth/auth.route.ts` |
| 95 | `POST` | `/api/v1/auth/login` | `AuthValidation.loginZodSchema` | *Public* | 🟢 Public | `src/modules/auth/auth.route.ts` |
| 96 | `POST` | `/api/v1/auth/logout` | *None* | *auth()* | 🔒 Protected | `src/modules/auth/auth.route.ts` |
| 97 | `GET` | `/api/v1/auth/me` | *None* | *auth()* | 🔒 Protected | `src/modules/auth/auth.route.ts` |
| 98 | `POST` | `/api/v1/auth/refresh-token` | `AuthValidation.refreshTokenZodSchema` | *Public* | 🟢 Public | `src/modules/auth/auth.route.ts` |
| 99 | `POST` | `/api/v1/auth/register` | `AuthValidation.registerZodSchema` | *Public* | 🟢 Public | `src/modules/auth/auth.route.ts` |
| 100 | `POST` | `/api/v1/auth/reset-password` | `AuthValidation.resetPasswordZodSchema` | *Public* | 🟢 Public | `src/modules/auth/auth.route.ts` |
| 101 | `POST` | `/api/v1/auth/send-otp` | `AuthValidation.sendOtpZodSchema` | *Public* | 🟢 Public | `src/modules/auth/auth.route.ts` |
| 102 | `POST` | `/api/v1/auth/verify-otp` | `AuthValidation.verifyOtpZodSchema` | *Public* | 🟢 Public | `src/modules/auth/auth.route.ts` |
| 103 | `GET` | `/api/v1/dashboard/admin` | *None* | `admin.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 104 | `GET` | `/api/v1/dashboard/admin/attendance-rate` | `DashboardValidation.adminFilterQueryZodSchema` | `admin.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 105 | `GET` | `/api/v1/dashboard/admin/enrollment-trend` | `DashboardValidation.adminFilterQueryZodSchema` | `admin.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 106 | `GET` | `/api/v1/dashboard/admin/lms-engagement` | `DashboardValidation.adminFilterQueryZodSchema` | `admin.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 107 | `GET` | `/api/v1/dashboard/admin/result-pass-rate` | `DashboardValidation.adminFilterQueryZodSchema` | `admin.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 108 | `GET` | `/api/v1/dashboard/admin/support-stats` | *None* | `admin.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 109 | `GET` | `/api/v1/dashboard/admin/teacher-workload` | *None* | `admin.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 110 | `GET` | `/api/v1/dashboard/guardian` | `DashboardValidation.guardianFilterQueryZodSchema` | `guardian.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 111 | `GET` | `/api/v1/dashboard/guardian/children` | *None* | `guardian.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 112 | `GET` | `/api/v1/dashboard/guardian/children/:childId` | `DashboardValidation.childIdParamZodSchema` | `guardian.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 113 | `GET` | `/api/v1/dashboard/guardian/children/:childId/attendance` | `DashboardValidation.childIdParamZodSchema` | `guardian.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 114 | `GET` | `/api/v1/dashboard/guardian/children/:childId/notices` | `DashboardValidation.childIdParamZodSchema` | `guardian.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 115 | `GET` | `/api/v1/dashboard/guardian/children/:childId/results` | `DashboardValidation.childIdParamZodSchema` | `guardian.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 116 | `GET` | `/api/v1/dashboard/teacher` | *None* | `teacher.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 117 | `GET` | `/api/v1/dashboard/teacher/assignment-submission-rate` | `DashboardValidation.teacherFilterQueryZodSchema` | `teacher.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 118 | `GET` | `/api/v1/dashboard/teacher/at-risk-students` | `DashboardValidation.teacherFilterQueryZodSchema` | `teacher.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 119 | `GET` | `/api/v1/dashboard/teacher/class-attendance-stats` | `DashboardValidation.teacherFilterQueryZodSchema` | `teacher.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 120 | `GET` | `/api/v1/dashboard/teacher/course-completion-funnel` | `DashboardValidation.teacherFilterQueryZodSchema` | `teacher.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 121 | `GET` | `/api/v1/dashboard/teacher/pending-attendance` | *None* | `teacher.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 122 | `GET` | `/api/v1/dashboard/teacher/pending-grading` | *None* | `teacher.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 123 | `GET` | `/api/v1/dashboard/teacher/quiz-performance` | `DashboardValidation.teacherFilterQueryZodSchema` | `teacher.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 124 | `GET` | `/api/v1/dashboard/teacher/today-classes` | *None* | `teacher.dashboard.view` | 🔒 Protected | `src/modules/dashboard/dashboard.route.ts` |
| 125 | `PATCH` | `/api/v1/directory/institute/contact-visibility` | `DirectoryValidation.updateInstituteContactVisibilityZodSchema` | `saas.institute.settings` | 🔒 Protected | `src/modules/directory/directory.route.ts` |
| 126 | `GET` | `/api/v1/directory/institute/public-profile` | *None* | `directory.institute.view` | 🔒 Protected | `src/modules/directory/directory.route.ts` |
| 127 | `GET` | `/api/v1/directory/staff` | *None* | `directory.staff.view` | 🔒 Protected | `src/modules/directory/directory.route.ts` |
| 128 | `GET` | `/api/v1/directory/teachers` | *None* | `directory.teacher.view` | 🔒 Protected | `src/modules/directory/directory.route.ts` |
| 129 | `GET` | `/api/v1/directory/teachers/:id` | *None* | `directory.teacher.view` | 🔒 Protected | `src/modules/directory/directory.route.ts` |
| 130 | `PATCH` | `/api/v1/directory/teachers/me/visibility` | `DirectoryValidation.updateTeacherVisibilityZodSchema` | `people.teacher.update` | 🔒 Protected | `src/modules/directory/directory.route.ts` |
| 131 | `GET` | `/api/v1/health` | *None* | *Public* | 🟢 Public | `src/modules/health/health.route.ts` |
| 132 | `GET` | `/api/v1/identity/permissions` | *None* | `identity.permission.read` | 🔒 Protected | `src/modules/identity/permission/permission.route.ts` |
| 133 | `POST` | `/api/v1/identity/permissions` | `PermissionValidation.createZodSchema` | `identity.permission.create` | 🔒 Protected | `src/modules/identity/permission/permission.route.ts` |
| 134 | `DELETE` | `/api/v1/identity/permissions/:id` | *None* | `identity.permission.delete` | 🔒 Protected | `src/modules/identity/permission/permission.route.ts` |
| 135 | `GET` | `/api/v1/identity/permissions/:id` | *None* | `identity.permission.read` | 🔒 Protected | `src/modules/identity/permission/permission.route.ts` |
| 136 | `PATCH` | `/api/v1/identity/permissions/:id` | `PermissionValidation.updateZodSchema` | `identity.permission.update` | 🔒 Protected | `src/modules/identity/permission/permission.route.ts` |
| 137 | `GET` | `/api/v1/identity/permissions/catalog` | *None* | `identity.permission.read` | 🔒 Protected | `src/modules/identity/permission/permission.route.ts` |
| 138 | `GET` | `/api/v1/identity/roles` | *None* | `identity.role.read` | 🔒 Protected | `src/modules/identity/role/role.route.ts` |
| 139 | `POST` | `/api/v1/identity/roles` | `RoleValidation.createZodSchema` | `identity.role.create` | 🔒 Protected | `src/modules/identity/role/role.route.ts` |
| 140 | `DELETE` | `/api/v1/identity/roles/:id` | `RoleValidation.deleteRoleZodSchema` | `identity.role.delete` | 🔒 Protected | `src/modules/identity/role/role.route.ts` |
| 141 | `GET` | `/api/v1/identity/roles/:id` | *None* | `identity.role.read` | 🔒 Protected | `src/modules/identity/role/role.route.ts` |
| 142 | `PATCH` | `/api/v1/identity/roles/:id` | `RoleValidation.updateZodSchema` | `identity.role.update` | 🔒 Protected | `src/modules/identity/role/role.route.ts` |
| 143 | `GET` | `/api/v1/identity/roles/:id/impact` | *None* | `identity.role.read` | 🔒 Protected | `src/modules/identity/role/role.route.ts` |
| 144 | `GET` | `/api/v1/identity/roles/:id/matrix` | *None* | `identity.role.read` | 🔒 Protected | `src/modules/identity/role/role.route.ts` |
| 145 | `PUT` | `/api/v1/identity/roles/:id/matrix` | `RoleValidation.setRoleMatrixZodSchema` | `identity.role.assignPermissions` | 🔒 Protected | `src/modules/identity/role/role.route.ts` |
| 146 | `PUT` | `/api/v1/identity/roles/:id/permissions` | *None* | `identity.role.assignPermissions` | 🔒 Protected | `src/modules/identity/role/role.route.ts` |
| 147 | `GET` | `/api/v1/identity/users` | *None* | `identity.user.read` | 🔒 Protected | `src/modules/identity/user/user.route.ts` |
| 148 | `POST` | `/api/v1/identity/users` | `UserValidation.createZodSchema` | `identity.user.create` | 🔒 Protected | `src/modules/identity/user/user.route.ts` |
| 149 | `DELETE` | `/api/v1/identity/users/:id` | *None* | `identity.user.delete` | 🔒 Protected | `src/modules/identity/user/user.route.ts` |
| 150 | `GET` | `/api/v1/identity/users/:id` | *None* | `identity.user.read` | 🔒 Protected | `src/modules/identity/user/user.route.ts` |
| 151 | `PATCH` | `/api/v1/identity/users/:id` | `UserValidation.updateZodSchema` | `identity.user.update` | 🔒 Protected | `src/modules/identity/user/user.route.ts` |
| 152 | `GET` | `/api/v1/identity/users/:id/effective-permissions` | *None* | `identity.user.read` | 🔒 Protected | `src/modules/identity/user/user.route.ts` |
| 153 | `GET` | `/api/v1/identity/users/:id/permission-overrides` | *None* | `identity.user.read` | 🔒 Protected | `src/modules/identity/user/user.route.ts` |
| 154 | `POST` | `/api/v1/identity/users/:id/permission-overrides` | `UserValidation.grantOverrideZodSchema` | `identity.user.overridePermission` | 🔒 Protected | `src/modules/identity/user/user.route.ts` |
| 155 | `DELETE` | `/api/v1/identity/users/:id/permission-overrides/:overrideId` | *None* | `identity.user.overridePermission` | 🔒 Protected | `src/modules/identity/user/user.route.ts` |
| 156 | `POST` | `/api/v1/identity/users/:id/roles` | `UserValidation.assignRoleZodSchema` | `identity.user.assignRole` | 🔒 Protected | `src/modules/identity/user/user.route.ts` |
| 157 | `DELETE` | `/api/v1/identity/users/:id/roles/:roleId` | *None* | `identity.user.assignRole` | 🔒 Protected | `src/modules/identity/user/user.route.ts` |
| 158 | `GET` | `/api/v1/institute/public-profile` | *None* | `directory.institute.view` | 🔒 Protected | `src/modules/directory/institute-public.route.ts` |
| 159 | `GET` | `/api/v1/lms/bundles` | *None* | `lms.bundle.read` | 🔒 Protected | `src/modules/lms/bundle/bundle.route.ts` |
| 160 | `POST` | `/api/v1/lms/bundles` | `BundleValidation.createZodSchema` | `lms.bundle.create` | 🔒 Protected | `src/modules/lms/bundle/bundle.route.ts` |
| 161 | `DELETE` | `/api/v1/lms/bundles/:id` | *None* | `lms.bundle.delete` | 🔒 Protected | `src/modules/lms/bundle/bundle.route.ts` |
| 162 | `GET` | `/api/v1/lms/bundles/:id` | *None* | `lms.bundle.read` | 🔒 Protected | `src/modules/lms/bundle/bundle.route.ts` |
| 163 | `PATCH` | `/api/v1/lms/bundles/:id` | `BundleValidation.updateZodSchema` | `lms.bundle.update` | 🔒 Protected | `src/modules/lms/bundle/bundle.route.ts` |
| 164 | `GET` | `/api/v1/lms/courses` | *None* | `lms.course.read` | 🔒 Protected | `src/modules/lms/course/course.route.ts` |
| 165 | `POST` | `/api/v1/lms/courses` | `CourseValidation.createZodSchema` | `lms.course.create` | 🔒 Protected | `src/modules/lms/course/course.route.ts` |
| 166 | `DELETE` | `/api/v1/lms/courses/:id` | *None* | `lms.course.delete` | 🔒 Protected | `src/modules/lms/course/course.route.ts` |
| 167 | `GET` | `/api/v1/lms/courses/:id` | *None* | `lms.course.read` | 🔒 Protected | `src/modules/lms/course/course.route.ts` |
| 168 | `PATCH` | `/api/v1/lms/courses/:id` | `CourseValidation.updateZodSchema` | `lms.course.update` | 🔒 Protected | `src/modules/lms/course/course.route.ts` |
| 169 | `GET` | `/api/v1/lms/courses/:id/stats` | *None* | `lms.course.stats` | 🔒 Protected | `src/modules/lms/course/course.route.ts` |
| 170 | `GET` | `/api/v1/lms/enrollments` | *None* | `lms.courseEnrollment.read` | 🔒 Protected | `src/modules/lms/courseEnrollment/courseEnrollment.route.ts` |
| 171 | `POST` | `/api/v1/lms/enrollments` | `CourseEnrollmentValidation.createZodSchema` | `lms.courseEnrollment.create` | 🔒 Protected | `src/modules/lms/courseEnrollment/courseEnrollment.route.ts` |
| 172 | `DELETE` | `/api/v1/lms/enrollments/:id` | *None* | `lms.courseEnrollment.delete` | 🔒 Protected | `src/modules/lms/courseEnrollment/courseEnrollment.route.ts` |
| 173 | `GET` | `/api/v1/lms/enrollments/:id` | *None* | `lms.courseEnrollment.read` | 🔒 Protected | `src/modules/lms/courseEnrollment/courseEnrollment.route.ts` |
| 174 | `PATCH` | `/api/v1/lms/enrollments/:id` | `CourseEnrollmentValidation.updateZodSchema` | `lms.courseEnrollment.update` | 🔒 Protected | `src/modules/lms/courseEnrollment/courseEnrollment.route.ts` |
| 175 | `POST` | `/api/v1/lms/enrollments/restrictions` | *None* | `lms.courseEnrollment.restrict` | 🔒 Protected | `src/modules/lms/courseEnrollment/courseEnrollment.route.ts` |
| 176 | `POST` | `/api/v1/lms/enrollments/restrictions/:restrictionId/revoke` | *None* | `lms.courseEnrollment.revokeRestriction` | 🔒 Protected | `src/modules/lms/courseEnrollment/courseEnrollment.route.ts` |
| 177 | `GET` | `/api/v1/lms/learning-items` | *None* | `lms.learningItem.read` | 🔒 Protected | `src/modules/lms/learningItem/learningItem.route.ts` |
| 178 | `POST` | `/api/v1/lms/learning-items` | `LearningItemValidation.createZodSchema` | `lms.learningItem.create` | 🔒 Protected | `src/modules/lms/learningItem/learningItem.route.ts` |
| 179 | `DELETE` | `/api/v1/lms/learning-items/:id` | *None* | `lms.learningItem.delete` | 🔒 Protected | `src/modules/lms/learningItem/learningItem.route.ts` |
| 180 | `GET` | `/api/v1/lms/learning-items/:id` | *None* | `lms.learningItem.read` | 🔒 Protected | `src/modules/lms/learningItem/learningItem.route.ts` |
| 181 | `PATCH` | `/api/v1/lms/learning-items/:id` | `LearningItemValidation.updateZodSchema` | `lms.learningItem.update` | 🔒 Protected | `src/modules/lms/learningItem/learningItem.route.ts` |
| 182 | `GET` | `/api/v1/lms/lessons` | *None* | `lms.lesson.read` | 🔒 Protected | `src/modules/lms/lesson/lesson.route.ts` |
| 183 | `POST` | `/api/v1/lms/lessons` | `LessonValidation.createZodSchema` | `lms.lesson.create` | 🔒 Protected | `src/modules/lms/lesson/lesson.route.ts` |
| 184 | `DELETE` | `/api/v1/lms/lessons/:id` | *None* | `lms.lesson.delete` | 🔒 Protected | `src/modules/lms/lesson/lesson.route.ts` |
| 185 | `GET` | `/api/v1/lms/lessons/:id` | *None* | `lms.lesson.read` | 🔒 Protected | `src/modules/lms/lesson/lesson.route.ts` |
| 186 | `PATCH` | `/api/v1/lms/lessons/:id` | `LessonValidation.updateZodSchema` | `lms.lesson.update` | 🔒 Protected | `src/modules/lms/lesson/lesson.route.ts` |
| 187 | `GET` | `/api/v1/lms/milestones` | *None* | `lms.milestone.read` | 🔒 Protected | `src/modules/lms/milestone/milestone.route.ts` |
| 188 | `POST` | `/api/v1/lms/milestones` | `MilestoneValidation.createZodSchema` | `lms.milestone.create` | 🔒 Protected | `src/modules/lms/milestone/milestone.route.ts` |
| 189 | `DELETE` | `/api/v1/lms/milestones/:id` | *None* | `lms.milestone.delete` | 🔒 Protected | `src/modules/lms/milestone/milestone.route.ts` |
| 190 | `GET` | `/api/v1/lms/milestones/:id` | *None* | `lms.milestone.read` | 🔒 Protected | `src/modules/lms/milestone/milestone.route.ts` |
| 191 | `PATCH` | `/api/v1/lms/milestones/:id` | `MilestoneValidation.updateZodSchema` | `lms.milestone.update` | 🔒 Protected | `src/modules/lms/milestone/milestone.route.ts` |
| 192 | `GET` | `/api/v1/lms/modules` | *None* | `lms.module.read` | 🔒 Protected | `src/modules/lms/module/module.route.ts` |
| 193 | `POST` | `/api/v1/lms/modules` | `ModuleValidation.createZodSchema` | `lms.module.create` | 🔒 Protected | `src/modules/lms/module/module.route.ts` |
| 194 | `DELETE` | `/api/v1/lms/modules/:id` | *None* | `lms.module.delete` | 🔒 Protected | `src/modules/lms/module/module.route.ts` |
| 195 | `GET` | `/api/v1/lms/modules/:id` | *None* | `lms.module.read` | 🔒 Protected | `src/modules/lms/module/module.route.ts` |
| 196 | `PATCH` | `/api/v1/lms/modules/:id` | `ModuleValidation.updateZodSchema` | `lms.module.update` | 🔒 Protected | `src/modules/lms/module/module.route.ts` |
| 197 | `GET` | `/api/v1/lms/notes` | *None* | `lms.lessonNote.read` | 🔒 Protected | `src/modules/lms/lessonNote/lessonNote.route.ts` |
| 198 | `POST` | `/api/v1/lms/notes` | `LessonNoteValidation.createZodSchema` | `lms.lessonNote.create` | 🔒 Protected | `src/modules/lms/lessonNote/lessonNote.route.ts` |
| 199 | `DELETE` | `/api/v1/lms/notes/:id` | *None* | `lms.lessonNote.delete` | 🔒 Protected | `src/modules/lms/lessonNote/lessonNote.route.ts` |
| 200 | `GET` | `/api/v1/lms/notes/:id` | *None* | `lms.lessonNote.read` | 🔒 Protected | `src/modules/lms/lessonNote/lessonNote.route.ts` |
| 201 | `PATCH` | `/api/v1/lms/notes/:id` | `LessonNoteValidation.updateZodSchema` | `lms.lessonNote.update` | 🔒 Protected | `src/modules/lms/lessonNote/lessonNote.route.ts` |
| 202 | `GET` | `/api/v1/lms/videos` | *None* | `lms.lessonVideo.read` | 🔒 Protected | `src/modules/lms/lessonVideo/lessonVideo.route.ts` |
| 203 | `POST` | `/api/v1/lms/videos` | `LessonVideoValidation.createZodSchema` | `lms.lessonVideo.create` | 🔒 Protected | `src/modules/lms/lessonVideo/lessonVideo.route.ts` |
| 204 | `DELETE` | `/api/v1/lms/videos/:id` | *None* | `lms.lessonVideo.delete` | 🔒 Protected | `src/modules/lms/lessonVideo/lessonVideo.route.ts` |
| 205 | `GET` | `/api/v1/lms/videos/:id` | *None* | `lms.lessonVideo.read` | 🔒 Protected | `src/modules/lms/lessonVideo/lessonVideo.route.ts` |
| 206 | `PATCH` | `/api/v1/lms/videos/:id` | `LessonVideoValidation.updateZodSchema` | `lms.lessonVideo.update` | 🔒 Protected | `src/modules/lms/lessonVideo/lessonVideo.route.ts` |
| 207 | `POST` | `/api/v1/lms/videos/:id/heartbeat` | *None* | `lms.lessonVideo.read` | 🔒 Protected | `src/modules/lms/lessonVideo/lessonVideo.route.ts` |
| 208 | `GET` | `/api/v1/people/guardians` | *None* | `people.guardian.read` | 🔒 Protected | `src/modules/people/guardian/guardian.route.ts` |
| 209 | `POST` | `/api/v1/people/guardians` | `GuardianValidation.createZodSchema` | `people.guardian.create` | 🔒 Protected | `src/modules/people/guardian/guardian.route.ts` |
| 210 | `DELETE` | `/api/v1/people/guardians/:id` | *None* | `people.guardian.delete` | 🔒 Protected | `src/modules/people/guardian/guardian.route.ts` |
| 211 | `GET` | `/api/v1/people/guardians/:id` | *None* | `people.guardian.read` | 🔒 Protected | `src/modules/people/guardian/guardian.route.ts` |
| 212 | `PATCH` | `/api/v1/people/guardians/:id` | `GuardianValidation.updateZodSchema` | `people.guardian.update` | 🔒 Protected | `src/modules/people/guardian/guardian.route.ts` |
| 213 | `GET` | `/api/v1/people/staff` | *None* | `people.staff.read` | 🔒 Protected | `src/modules/people/staff/staff.route.ts` |
| 214 | `POST` | `/api/v1/people/staff` | `StaffValidation.createZodSchema` | `people.staff.create` | 🔒 Protected | `src/modules/people/staff/staff.route.ts` |
| 215 | `DELETE` | `/api/v1/people/staff/:id` | *None* | `people.staff.delete` | 🔒 Protected | `src/modules/people/staff/staff.route.ts` |
| 216 | `GET` | `/api/v1/people/staff/:id` | *None* | `people.staff.read` | 🔒 Protected | `src/modules/people/staff/staff.route.ts` |
| 217 | `PATCH` | `/api/v1/people/staff/:id` | `StaffValidation.adminUpdateZodSchema` | `people.staff.update` | 🔒 Protected | `src/modules/people/staff/staff.route.ts` |
| 218 | `GET` | `/api/v1/people/staff/me` | *None* | `people.staff.read` | 🔒 Protected | `src/modules/people/staff/staff.route.ts` |
| 219 | `PATCH` | `/api/v1/people/staff/me` | `StaffValidation.selfUpdateZodSchema` | `people.staff.update` | 🔒 Protected | `src/modules/people/staff/staff.route.ts` |
| 220 | `POST` | `/api/v1/people/staff/me/documents` | `StaffValidation.addDocumentZodSchema` | `people.staff.update` | 🔒 Protected | `src/modules/people/staff/staff.route.ts` |
| 221 | `DELETE` | `/api/v1/people/staff/me/documents/:docId` | *None* | `people.staff.update` | 🔒 Protected | `src/modules/people/staff/staff.route.ts` |
| 222 | `PATCH` | `/api/v1/people/staff/me/notification-prefs` | `StaffValidation.updateNotificationPrefsZodSchema` | `people.staff.update` | 🔒 Protected | `src/modules/people/staff/staff.route.ts` |
| 223 | `POST` | `/api/v1/people/staff/me/photo` | `StaffValidation.uploadPhotoZodSchema` | `people.staff.update` | 🔒 Protected | `src/modules/people/staff/staff.route.ts` |
| 224 | `PATCH` | `/api/v1/people/staff/me/visibility` | `StaffValidation.updateVisibilityZodSchema` | `people.staff.update` | 🔒 Protected | `src/modules/people/staff/staff.route.ts` |
| 225 | `GET` | `/api/v1/people/students` | *None* | `people.student.read` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 226 | `POST` | `/api/v1/people/students` | `StudentValidation.createZodSchema` | `people.student.create` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 227 | `DELETE` | `/api/v1/people/students/:id` | *None* | `people.student.delete` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 228 | `GET` | `/api/v1/people/students/:id` | *None* | `people.student.read` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 229 | `PATCH` | `/api/v1/people/students/:id` | `StudentValidation.adminUpdateZodSchema` | `people.student.update` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 230 | `GET` | `/api/v1/people/students/:id/stats` | *None* | `people.student.stats` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 231 | `GET` | `/api/v1/people/students/me` | *None* | `people.student.read` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 232 | `PATCH` | `/api/v1/people/students/me` | `StudentValidation.selfUpdateZodSchema` | `people.student.update` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 233 | `POST` | `/api/v1/people/students/me/documents` | `StudentValidation.addDocumentZodSchema` | `people.student.update` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 234 | `DELETE` | `/api/v1/people/students/me/documents/:docId` | *None* | `people.student.update` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 235 | `PATCH` | `/api/v1/people/students/me/notification-prefs` | `StudentValidation.updateNotificationPrefsZodSchema` | `people.student.update` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 236 | `POST` | `/api/v1/people/students/me/photo` | `StudentValidation.uploadPhotoZodSchema` | `people.student.update` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 237 | `PATCH` | `/api/v1/people/students/me/visibility` | `StudentValidation.updateVisibilityZodSchema` | `people.student.update` | 🔒 Protected | `src/modules/people/student/student.route.ts` |
| 238 | `GET` | `/api/v1/people/teachers` | *None* | `people.teacher.read` | 🔒 Protected | `src/modules/people/teacher/teacher.route.ts` |
| 239 | `POST` | `/api/v1/people/teachers` | `TeacherValidation.createZodSchema` | `people.teacher.create` | 🔒 Protected | `src/modules/people/teacher/teacher.route.ts` |
| 240 | `DELETE` | `/api/v1/people/teachers/:id` | *None* | `people.teacher.delete` | 🔒 Protected | `src/modules/people/teacher/teacher.route.ts` |
| 241 | `GET` | `/api/v1/people/teachers/:id` | *None* | `people.teacher.read` | 🔒 Protected | `src/modules/people/teacher/teacher.route.ts` |
| 242 | `PATCH` | `/api/v1/people/teachers/:id` | `TeacherValidation.adminUpdateZodSchema` | `people.teacher.update` | 🔒 Protected | `src/modules/people/teacher/teacher.route.ts` |
| 243 | `GET` | `/api/v1/people/teachers/me` | *None* | `people.teacher.read` | 🔒 Protected | `src/modules/people/teacher/teacher.route.ts` |
| 244 | `PATCH` | `/api/v1/people/teachers/me` | `TeacherValidation.selfUpdateZodSchema` | `people.teacher.update` | 🔒 Protected | `src/modules/people/teacher/teacher.route.ts` |
| 245 | `PATCH` | `/api/v1/people/teachers/me/notification-prefs` | `TeacherValidation.updateNotificationPrefsZodSchema` | `people.teacher.update` | 🔒 Protected | `src/modules/people/teacher/teacher.route.ts` |
| 246 | `POST` | `/api/v1/people/teachers/me/photo` | `TeacherValidation.uploadPhotoZodSchema` | `people.teacher.update` | 🔒 Protected | `src/modules/people/teacher/teacher.route.ts` |
| 247 | `POST` | `/api/v1/people/teachers/me/qualifications` | `TeacherValidation.addQualificationZodSchema` | `people.teacher.update` | 🔒 Protected | `src/modules/people/teacher/teacher.route.ts` |
| 248 | `DELETE` | `/api/v1/people/teachers/me/qualifications/:qualId` | *None* | `people.teacher.update` | 🔒 Protected | `src/modules/people/teacher/teacher.route.ts` |
| 249 | `PATCH` | `/api/v1/people/teachers/me/visibility` | `TeacherValidation.updateVisibilityZodSchema` | `people.teacher.update` | 🔒 Protected | `src/modules/people/teacher/teacher.route.ts` |
| 250 | `GET` | `/api/v1/platform-admin/audit-logs` | `PlatformAdminValidation.auditLogFilterQueryZodSchema` | `platform.admin.read` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 251 | `POST` | `/api/v1/platform-admin/impersonate/end` | `PlatformAdminValidation.impersonateEndZodSchema` | `platform.admin.manage` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 252 | `POST` | `/api/v1/platform-admin/impersonate/start` | `PlatformAdminValidation.impersonateStartZodSchema` | `platform.admin.manage` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 253 | `GET` | `/api/v1/platform-admin/kpis` | *None* | `platform.admin.read` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 254 | `GET` | `/api/v1/platform-admin/payments/failed` | *None* | `platform.admin.read` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 255 | `GET` | `/api/v1/platform-admin/renewals/upcoming` | `PlatformAdminValidation.upcomingRenewalsQueryZodSchema` | `platform.admin.read` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 256 | `GET` | `/api/v1/platform-admin/revenue-trend` | *None* | `platform.admin.read` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 257 | `GET` | `/api/v1/platform-admin/tenants` | `PlatformAdminValidation.tenantFilterQueryZodSchema` | `platform.admin.read` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 258 | `GET` | `/api/v1/platform-admin/tenants/:tenantId` | `PlatformAdminValidation.tenantIdParamZodSchema` | `platform.admin.read` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 259 | `PATCH` | `/api/v1/platform-admin/tenants/:tenantId/activate` | `PlatformAdminValidation.tenantIdParamZodSchema` | `platform.admin.manage` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 260 | `PATCH` | `/api/v1/platform-admin/tenants/:tenantId/plan` | `PlatformAdminValidation.changePlanZodSchema` | `platform.admin.manage` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 261 | `PATCH` | `/api/v1/platform-admin/tenants/:tenantId/suspend` | `PlatformAdminValidation.suspendTenantZodSchema` | `platform.admin.manage` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 262 | `GET` | `/api/v1/platform-admin/tenants/:tenantId/usage` | `PlatformAdminValidation.tenantIdParamZodSchema` | `platform.admin.read` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 263 | `GET` | `/api/v1/platform-admin/tenants/top-active` | *None* | `platform.admin.read` | 🔒 Protected | `src/modules/platform-admin/platform-admin.route.ts` |
| 264 | `GET` | `/api/v1/platform/certificates` | *None* | `platform.certificate.read` | 🔒 Protected | `src/modules/platform/certificate/certificate.route.ts` |
| 265 | `POST` | `/api/v1/platform/certificates` | `CertificateValidation.createZodSchema` | `platform.certificate.create` | 🔒 Protected | `src/modules/platform/certificate/certificate.route.ts` |
| 266 | `DELETE` | `/api/v1/platform/certificates/:id` | *None* | `platform.certificate.delete` | 🔒 Protected | `src/modules/platform/certificate/certificate.route.ts` |
| 267 | `GET` | `/api/v1/platform/certificates/:id` | *None* | `platform.certificate.read` | 🔒 Protected | `src/modules/platform/certificate/certificate.route.ts` |
| 268 | `PATCH` | `/api/v1/platform/certificates/:id` | `CertificateValidation.updateZodSchema` | `platform.certificate.update` | 🔒 Protected | `src/modules/platform/certificate/certificate.route.ts` |
| 269 | `GET` | `/api/v1/platform/files` | *None* | `platform.file.read` | 🔒 Protected | `src/modules/platform/file/file.route.ts` |
| 270 | `POST` | `/api/v1/platform/files` | `FileValidation.createZodSchema` | `platform.file.create` | 🔒 Protected | `src/modules/platform/file/file.route.ts` |
| 271 | `DELETE` | `/api/v1/platform/files/:id` | *None* | `platform.file.delete` | 🔒 Protected | `src/modules/platform/file/file.route.ts` |
| 272 | `GET` | `/api/v1/platform/files/:id` | *None* | `platform.file.read` | 🔒 Protected | `src/modules/platform/file/file.route.ts` |
| 273 | `PATCH` | `/api/v1/platform/files/:id` | `FileValidation.updateZodSchema` | `platform.file.update` | 🔒 Protected | `src/modules/platform/file/file.route.ts` |
| 274 | `GET` | `/api/v1/platform/notices` | `NoticeValidation.noticeFilterQueryZodSchema` | `platform.notice.read` | 🔒 Protected | `src/modules/platform/notice/notice.route.ts` |
| 275 | `POST` | `/api/v1/platform/notices` | `NoticeValidation.createZodSchema` | `platform.notice.create` | 🔒 Protected | `src/modules/platform/notice/notice.route.ts` |
| 276 | `DELETE` | `/api/v1/platform/notices/:id` | *None* | `platform.notice.delete` | 🔒 Protected | `src/modules/platform/notice/notice.route.ts` |
| 277 | `GET` | `/api/v1/platform/notices/:id` | *None* | `platform.notice.read` | 🔒 Protected | `src/modules/platform/notice/notice.route.ts` |
| 278 | `PATCH` | `/api/v1/platform/notices/:id` | `NoticeValidation.updateZodSchema` | `platform.notice.update` | 🔒 Protected | `src/modules/platform/notice/notice.route.ts` |
| 279 | `POST` | `/api/v1/platform/notices/:id/pin` | `NoticeValidation.pinZodSchema` | `platform.notice.update` | 🔒 Protected | `src/modules/platform/notice/notice.route.ts` |
| 280 | `POST` | `/api/v1/platform/notices/:id/publish` | *None* | `platform.notice.update` | 🔒 Protected | `src/modules/platform/notice/notice.route.ts` |
| 281 | `POST` | `/api/v1/platform/notices/:id/read` | *None* | `platform.notice.read` | 🔒 Protected | `src/modules/platform/notice/notice.route.ts` |
| 282 | `GET` | `/api/v1/platform/notices/:id/stats` | *None* | `platform.notice.read` | 🔒 Protected | `src/modules/platform/notice/notice.route.ts` |
| 283 | `POST` | `/api/v1/platform/notices/:id/unpublish` | *None* | `platform.notice.update` | 🔒 Protected | `src/modules/platform/notice/notice.route.ts` |
| 284 | `GET` | `/api/v1/platform/notices/my` | `NoticeValidation.myNoticesQueryZodSchema` | `platform.notice.read` | 🔒 Protected | `src/modules/platform/notice/notice.route.ts` |
| 285 | `GET` | `/api/v1/platform/notices/unread-count` | *None* | `platform.notice.read` | 🔒 Protected | `src/modules/platform/notice/notice.route.ts` |
| 286 | `GET` | `/api/v1/platform/notifications` | *None* | `platform.notification.read` | 🔒 Protected | `src/modules/platform/notification/notification.route.ts` |
| 287 | `POST` | `/api/v1/platform/notifications` | `NotificationValidation.createZodSchema` | `platform.notification.create` | 🔒 Protected | `src/modules/platform/notification/notification.route.ts` |
| 288 | `DELETE` | `/api/v1/platform/notifications/:id` | *None* | `platform.notification.delete` | 🔒 Protected | `src/modules/platform/notification/notification.route.ts` |
| 289 | `GET` | `/api/v1/platform/notifications/:id` | *None* | `platform.notification.read` | 🔒 Protected | `src/modules/platform/notification/notification.route.ts` |
| 290 | `PATCH` | `/api/v1/platform/notifications/:id` | `NotificationValidation.updateZodSchema` | `platform.notification.update` | 🔒 Protected | `src/modules/platform/notification/notification.route.ts` |
| 291 | `GET` | `/api/v1/saas/institutes` | *None* | `saas.institute.read` | 🔒 Protected | `src/modules/saas/institute/institute.route.ts` |
| 292 | `POST` | `/api/v1/saas/institutes` | `InstituteValidation.createZodSchema` | `saas.institute.create` | 🔒 Protected | `src/modules/saas/institute/institute.route.ts` |
| 293 | `DELETE` | `/api/v1/saas/institutes/:id` | *None* | `saas.institute.delete` | 🔒 Protected | `src/modules/saas/institute/institute.route.ts` |
| 294 | `GET` | `/api/v1/saas/institutes/:id` | *None* | `saas.institute.read` | 🔒 Protected | `src/modules/saas/institute/institute.route.ts` |
| 295 | `PATCH` | `/api/v1/saas/institutes/:id` | `InstituteValidation.updateZodSchema` | `saas.institute.update` | 🔒 Protected | `src/modules/saas/institute/institute.route.ts` |
| 296 | `PATCH` | `/api/v1/saas/institutes/:id/settings` | *None* | `saas.institute.settings` | 🔒 Protected | `src/modules/saas/institute/institute.route.ts` |
| 297 | `GET` | `/api/v1/saas/institutes/:id/stats` | *None* | `saas.institute.stats` | 🔒 Protected | `src/modules/saas/institute/institute.route.ts` |
| 298 | `POST` | `/api/v1/saas/institutes/:id/suspend` | *None* | `saas.institute.suspend` | 🔒 Protected | `src/modules/saas/institute/institute.route.ts` |
| 299 | `GET` | `/api/v1/saas/subscriptions` | *None* | `saas.subscription.read` | 🔒 Protected | `src/modules/saas/subscription/subscription.route.ts` |
| 300 | `POST` | `/api/v1/saas/subscriptions` | `SubscriptionValidation.createZodSchema` | `saas.subscription.create` | 🔒 Protected | `src/modules/saas/subscription/subscription.route.ts` |
| 301 | `DELETE` | `/api/v1/saas/subscriptions/:id` | *None* | `saas.subscription.delete` | 🔒 Protected | `src/modules/saas/subscription/subscription.route.ts` |
| 302 | `GET` | `/api/v1/saas/subscriptions/:id` | *None* | `saas.subscription.read` | 🔒 Protected | `src/modules/saas/subscription/subscription.route.ts` |
| 303 | `PATCH` | `/api/v1/saas/subscriptions/:id` | `SubscriptionValidation.updateZodSchema` | `saas.subscription.update` | 🔒 Protected | `src/modules/saas/subscription/subscription.route.ts` |
| 304 | `POST` | `/api/v1/settings/2fa/disable` | `SettingsValidation.disable2FAZodSchema` | `settings.user.2fa` | 🔒 Protected | `src/modules/settings/settings.route.ts` |
| 305 | `POST` | `/api/v1/settings/2fa/enable` | *None* | `settings.user.2fa` | 🔒 Protected | `src/modules/settings/settings.route.ts` |
| 306 | `POST` | `/api/v1/settings/2fa/verify` | `SettingsValidation.verify2FAZodSchema` | `settings.user.2fa` | 🔒 Protected | `src/modules/settings/settings.route.ts` |
| 307 | `POST` | `/api/v1/settings/change-password` | `SettingsValidation.changePasswordZodSchema` | `settings.user.password` | 🔒 Protected | `src/modules/settings/settings.route.ts` |
| 308 | `GET` | `/api/v1/settings/institute` | *None* | `settings.institute.view` | 🔒 Protected | `src/modules/settings/settings.route.ts` |
| 309 | `PATCH` | `/api/v1/settings/institute` | `SettingsValidation.updateInstituteSettingsZodSchema` | `settings.institute.manage` | 🔒 Protected | `src/modules/settings/settings.route.ts` |
| 310 | `GET` | `/api/v1/settings/institute/:section` | `SettingsValidation.instituteSectionParamZodSchema` | `settings.institute.view` | 🔒 Protected | `src/modules/settings/settings.route.ts` |
| 311 | `PATCH` | `/api/v1/settings/institute/:section` | `SettingsValidation.updateInstituteSectionZodSchema` | `settings.institute.manage` | 🔒 Protected | `src/modules/settings/settings.route.ts` |
| 312 | `GET` | `/api/v1/settings/me` | *None* | `settings.user.view` | 🔒 Protected | `src/modules/settings/settings.route.ts` |
| 313 | `PATCH` | `/api/v1/settings/me` | `SettingsValidation.updateMySettingsZodSchema` | `settings.user.update` | 🔒 Protected | `src/modules/settings/settings.route.ts` |
| 314 | `GET` | `/api/v1/settings/sessions` | *None* | `settings.user.sessions` | 🔒 Protected | `src/modules/settings/settings.route.ts` |
| 315 | `DELETE` | `/api/v1/settings/sessions/:id` | `SettingsValidation.revokeSessionParamZodSchema` | `settings.user.sessions` | 🔒 Protected | `src/modules/settings/settings.route.ts` |
| 316 | `GET` | `/api/v1/student-portal` | *None* | `student.portal.view` | 🔒 Protected | `src/modules/student-portal/student-portal.route.ts` |
| 317 | `GET` | `/api/v1/student-portal/attendance/calendar` | `StudentPortalValidation.getAttendanceCalendarQueryZodSchema` | `student.portal.view` | 🔒 Protected | `src/modules/student-portal/student-portal.route.ts` |
| 318 | `GET` | `/api/v1/student-portal/attendance/history` | `StudentPortalValidation.getAttendanceHistoryQueryZodSchema` | `student.portal.view` | 🔒 Protected | `src/modules/student-portal/student-portal.route.ts` |
| 319 | `GET` | `/api/v1/student-portal/attendance/summary` | `StudentPortalValidation.getSubjectAttendanceSummaryQueryZodSchema` | `student.portal.view` | 🔒 Protected | `src/modules/student-portal/student-portal.route.ts` |
| 320 | `GET` | `/api/v1/student-portal/continue-learning` | *None* | `student.portal.view` | 🔒 Protected | `src/modules/student-portal/student-portal.route.ts` |
| 321 | `GET` | `/api/v1/student-portal/overdue-items` | *None* | `student.portal.view` | 🔒 Protected | `src/modules/student-portal/student-portal.route.ts` |
| 322 | `GET` | `/api/v1/student-portal/performance-trend` | *None* | `student.portal.view` | 🔒 Protected | `src/modules/student-portal/student-portal.route.ts` |
| 323 | `GET` | `/api/v1/student-portal/study-activity` | `StudentPortalValidation.getStudyActivityQueryZodSchema` | `student.portal.view` | 🔒 Protected | `src/modules/student-portal/student-portal.route.ts` |
| 324 | `GET` | `/api/v1/student-portal/subject-progress` | *None* | `student.portal.view` | 🔒 Protected | `src/modules/student-portal/student-portal.route.ts` |
| 325 | `GET` | `/api/v1/student-portal/today-summary` | *None* | `student.portal.view` | 🔒 Protected | `src/modules/student-portal/student-portal.route.ts` |
| 326 | `GET` | `/api/v1/student-portal/upcoming-items` | `StudentPortalValidation.getUpcomingItemsQueryZodSchema` | `student.portal.view` | 🔒 Protected | `src/modules/student-portal/student-portal.route.ts` |
| 327 | `POST` | `/api/v1/support/sessions/:id/cancel` | *None* | `support.ticket.view` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 328 | `POST` | `/api/v1/support/sessions/:id/complete` | `SupportValidation.completeSessionSchema` | `support.session.host` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 329 | `POST` | `/api/v1/support/sessions/:id/confirm` | `SupportValidation.confirmSessionSchema` | `support.session.host` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 330 | `GET` | `/api/v1/support/settings` | *None* | `support.settings.manage` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 331 | `PATCH` | `/api/v1/support/settings` | `SupportValidation.updateSupportSettingsSchema` | `support.settings.manage` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 332 | `GET` | `/api/v1/support/slots/available` | *None* | `support.ticket.view` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 333 | `POST` | `/api/v1/support/slots/book` | `SupportValidation.bookSlotSchema` | `support.ticket.create` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 334 | `POST` | `/api/v1/support/slots/publish` | `SupportValidation.publishAvailabilitySchema` | `support.session.host` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 335 | `GET` | `/api/v1/support/status` | *None* | `support.ticket.view` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 336 | `POST` | `/api/v1/support/tickets` | `SupportValidation.createTicketSchema` | `support.ticket.create` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 337 | `POST` | `/api/v1/support/tickets/:id/assign` | `SupportValidation.assignTicketSchema` | `support.ticket.manage` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 338 | `POST` | `/api/v1/support/tickets/:id/internal-notes` | `SupportValidation.addInternalNoteSchema` | `support.ticket.manage` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 339 | `POST` | `/api/v1/support/tickets/:id/resolve` | *None* | `support.ticket.manage` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 340 | `PATCH` | `/api/v1/support/tickets/:id/status` | `SupportValidation.changeTicketStatusSchema` | `support.ticket.manage` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 341 | `GET` | `/api/v1/support/tickets/my` | *None* | `support.ticket.view` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 342 | `GET` | `/api/v1/support/tickets/my/:id` | *None* | `support.ticket.view` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 343 | `POST` | `/api/v1/support/tickets/my/:id/close` | *None* | `support.ticket.create` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 344 | `POST` | `/api/v1/support/tickets/my/:id/messages` | `SupportValidation.addMessageSchema` | `support.ticket.create` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 345 | `POST` | `/api/v1/support/tickets/my/:id/rate` | `SupportValidation.rateTicketSchema` | `support.ticket.create` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 346 | `POST` | `/api/v1/support/tickets/my/:id/request-session` | `SupportValidation.requestLiveSessionSchema` | `support.ticket.create` | 🔒 Protected | `src/modules/support/support.route.ts` |
| 347 | `GET` | `/api/v1/support/tickets/queue` | `SupportValidation.ticketFilterQuerySchema` | `support.ticket.manage` | 🔒 Protected | `src/modules/support/support.route.ts` |

## 3. Routes with No Zod Schema (187 endpoints)

These routes currently lack `validateRequest(...)` middleware (typically `GET` collection queries, ID lookup params, or parameter-free actions). To provide 100% complete OpenAPI documentation, request parameter/query/body Zod schemas or response-only documentation must be registered for each:

| Method | Path | Permission | Router File |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/academic/classes` | `academic.classGroup.read` | `src/modules/academic/classGroup/classGroup.route.ts` |
| `DELETE` | `/api/v1/academic/classes/:id` | `academic.classGroup.delete` | `src/modules/academic/classGroup/classGroup.route.ts` |
| `GET` | `/api/v1/academic/classes/:id` | `academic.classGroup.read` | `src/modules/academic/classGroup/classGroup.route.ts` |
| `GET` | `/api/v1/academic/enrollments` | `academic.enrollment.read` | `src/modules/academic/enrollment/enrollment.route.ts` |
| `DELETE` | `/api/v1/academic/enrollments/:id` | `academic.enrollment.delete` | `src/modules/academic/enrollment/enrollment.route.ts` |
| `GET` | `/api/v1/academic/enrollments/:id` | `academic.enrollment.read` | `src/modules/academic/enrollment/enrollment.route.ts` |
| `GET` | `/api/v1/academic/levels` | `academic.level.read` | `src/modules/academic/level/level.route.ts` |
| `DELETE` | `/api/v1/academic/levels/:id` | `academic.level.delete` | `src/modules/academic/level/level.route.ts` |
| `GET` | `/api/v1/academic/levels/:id` | `academic.level.read` | `src/modules/academic/level/level.route.ts` |
| `GET` | `/api/v1/academic/programs` | `academic.program.read` | `src/modules/academic/program/program.route.ts` |
| `DELETE` | `/api/v1/academic/programs/:id` | `academic.program.delete` | `src/modules/academic/program/program.route.ts` |
| `GET` | `/api/v1/academic/programs/:id` | `academic.program.read` | `src/modules/academic/program/program.route.ts` |
| `GET` | `/api/v1/academic/sections` | `academic.section.read` | `src/modules/academic/section/section.route.ts` |
| `DELETE` | `/api/v1/academic/sections/:id` | `academic.section.delete` | `src/modules/academic/section/section.route.ts` |
| `GET` | `/api/v1/academic/sections/:id` | `academic.section.read` | `src/modules/academic/section/section.route.ts` |
| `GET` | `/api/v1/academic/subjects` | `academic.subject.read` | `src/modules/academic/subject/subject.route.ts` |
| `DELETE` | `/api/v1/academic/subjects/:id` | `academic.subject.delete` | `src/modules/academic/subject/subject.route.ts` |
| `GET` | `/api/v1/academic/subjects/:id` | `academic.subject.read` | `src/modules/academic/subject/subject.route.ts` |
| `GET` | `/api/v1/academic/years` | `academic.academicYear.read` | `src/modules/academic/academicYear/academicYear.route.ts` |
| `DELETE` | `/api/v1/academic/years/:id` | `academic.academicYear.delete` | `src/modules/academic/academicYear/academicYear.route.ts` |
| `GET` | `/api/v1/academic/years/:id` | `academic.academicYear.read` | `src/modules/academic/academicYear/academicYear.route.ts` |
| `GET` | `/api/v1/assessment/assessments` | `assessment.assessment.read` | `src/modules/assessment/assessment/assessment.route.ts` |
| `DELETE` | `/api/v1/assessment/assessments/:id` | `assessment.assessment.delete` | `src/modules/assessment/assessment/assessment.route.ts` |
| `GET` | `/api/v1/assessment/assessments/:id` | `assessment.assessment.read` | `src/modules/assessment/assessment/assessment.route.ts` |
| `POST` | `/api/v1/assessment/assessments/:id/submit-assignment` | `assessment.assessment.read` | `src/modules/assessment/assessment/assessment.route.ts` |
| `POST` | `/api/v1/assessment/assessments/:id/submit-quiz` | `assessment.assessment.read` | `src/modules/assessment/assessment/assessment.route.ts` |
| `GET` | `/api/v1/assessment/exams` | `assessment.exam.read` | `src/modules/assessment/exam/exam.route.ts` |
| `DELETE` | `/api/v1/assessment/exams/:id` | `assessment.exam.delete` | `src/modules/assessment/exam/exam.route.ts` |
| `GET` | `/api/v1/assessment/exams/:id` | `assessment.exam.read` | `src/modules/assessment/exam/exam.route.ts` |
| `PATCH` | `/api/v1/assessment/exams/marks/:id` | `assessment.exam.updateMark` | `src/modules/assessment/exam/exam.route.ts` |
| `GET` | `/api/v1/assessment/grading-systems` | `assessment.grading.read` | `src/modules/assessment/grading/grading.route.ts` |
| `DELETE` | `/api/v1/assessment/grading-systems/:id` | `assessment.grading.delete` | `src/modules/assessment/grading/grading.route.ts` |
| `GET` | `/api/v1/assessment/grading-systems/:id` | `assessment.grading.read` | `src/modules/assessment/grading/grading.route.ts` |
| `GET` | `/api/v1/assessment/marking-schemes` | `assessment.markingScheme.read` | `src/modules/assessment/markingScheme/markingScheme.route.ts` |
| `DELETE` | `/api/v1/assessment/marking-schemes/:id` | `assessment.markingScheme.delete` | `src/modules/assessment/markingScheme/markingScheme.route.ts` |
| `GET` | `/api/v1/assessment/marking-schemes/:id` | `assessment.markingScheme.read` | `src/modules/assessment/markingScheme/markingScheme.route.ts` |
| `GET` | `/api/v1/assessment/results` | `assessment.result.read` | `src/modules/assessment/result/result.route.ts` |
| `DELETE` | `/api/v1/assessment/results/:id` | `assessment.result.delete` | `src/modules/assessment/result/result.route.ts` |
| `GET` | `/api/v1/assessment/results/:id` | `assessment.result.read` | `src/modules/assessment/result/result.route.ts` |
| `POST` | `/api/v1/assessment/results/:id/override` | `assessment.result.override` | `src/modules/assessment/result/result.route.ts` |
| `POST` | `/api/v1/assessment/results/:id/publish` | `assessment.result.publish` | `src/modules/assessment/result/result.route.ts` |
| `GET` | `/api/v1/attendance/calendars` | `attendance.calendar.read` | `src/modules/attendance/calendar/calendar.route.ts` |
| `DELETE` | `/api/v1/attendance/calendars/:id` | `attendance.calendar.delete` | `src/modules/attendance/calendar/calendar.route.ts` |
| `GET` | `/api/v1/attendance/calendars/:id` | `attendance.calendar.read` | `src/modules/attendance/calendar/calendar.route.ts` |
| `POST` | `/api/v1/attendance/calendars/:id/generate-sessions` | `attendance.calendar.generateSessions` | `src/modules/attendance/calendar/calendar.route.ts` |
| `GET` | `/api/v1/attendance/live-classes` | `attendance.liveClass.read` | `src/modules/attendance/liveClass/liveClass.route.ts` |
| `DELETE` | `/api/v1/attendance/live-classes/:id` | `attendance.liveClass.delete` | `src/modules/attendance/liveClass/liveClass.route.ts` |
| `GET` | `/api/v1/attendance/live-classes/:id` | `attendance.liveClass.read` | `src/modules/attendance/liveClass/liveClass.route.ts` |
| `GET` | `/api/v1/attendance/policies` | `attendance.policy.read` | `src/modules/attendance/policy/policy.route.ts` |
| `DELETE` | `/api/v1/attendance/policies/:id` | `attendance.policy.delete` | `src/modules/attendance/policy/policy.route.ts` |
| `GET` | `/api/v1/attendance/policies/:id` | `attendance.policy.read` | `src/modules/attendance/policy/policy.route.ts` |
| `GET` | `/api/v1/attendance/routines` | `attendance.routine.read` | `src/modules/attendance/routine/routine.route.ts` |
| `DELETE` | `/api/v1/attendance/routines/:id` | `attendance.routine.delete` | `src/modules/attendance/routine/routine.route.ts` |
| `GET` | `/api/v1/attendance/routines/:id` | `attendance.routine.read` | `src/modules/attendance/routine/routine.route.ts` |
| `GET` | `/api/v1/attendance/sessions` | `attendance.session.read` | `src/modules/attendance/session/session.route.ts` |
| `DELETE` | `/api/v1/attendance/sessions/:id` | `attendance.session.delete` | `src/modules/attendance/session/session.route.ts` |
| `GET` | `/api/v1/attendance/sessions/:id` | `attendance.session.read` | `src/modules/attendance/session/session.route.ts` |
| `POST` | `/api/v1/attendance/sessions/:id/mark` | `attendance.session.update` | `src/modules/attendance/session/session.route.ts` |
| `POST` | `/api/v1/auth/logout` | `None` | `src/modules/auth/auth.route.ts` |
| `GET` | `/api/v1/auth/me` | `None` | `src/modules/auth/auth.route.ts` |
| `GET` | `/api/v1/dashboard/admin` | `admin.dashboard.view` | `src/modules/dashboard/dashboard.route.ts` |
| `GET` | `/api/v1/dashboard/admin/support-stats` | `admin.dashboard.view` | `src/modules/dashboard/dashboard.route.ts` |
| `GET` | `/api/v1/dashboard/admin/teacher-workload` | `admin.dashboard.view` | `src/modules/dashboard/dashboard.route.ts` |
| `GET` | `/api/v1/dashboard/guardian/children` | `guardian.dashboard.view` | `src/modules/dashboard/dashboard.route.ts` |
| `GET` | `/api/v1/dashboard/teacher` | `teacher.dashboard.view` | `src/modules/dashboard/dashboard.route.ts` |
| `GET` | `/api/v1/dashboard/teacher/pending-attendance` | `teacher.dashboard.view` | `src/modules/dashboard/dashboard.route.ts` |
| `GET` | `/api/v1/dashboard/teacher/pending-grading` | `teacher.dashboard.view` | `src/modules/dashboard/dashboard.route.ts` |
| `GET` | `/api/v1/dashboard/teacher/today-classes` | `teacher.dashboard.view` | `src/modules/dashboard/dashboard.route.ts` |
| `GET` | `/api/v1/directory/institute/public-profile` | `directory.institute.view` | `src/modules/directory/directory.route.ts` |
| `GET` | `/api/v1/directory/staff` | `directory.staff.view` | `src/modules/directory/directory.route.ts` |
| `GET` | `/api/v1/directory/teachers` | `directory.teacher.view` | `src/modules/directory/directory.route.ts` |
| `GET` | `/api/v1/directory/teachers/:id` | `directory.teacher.view` | `src/modules/directory/directory.route.ts` |
| `GET` | `/api/v1/health` | `None` | `src/modules/health/health.route.ts` |
| `GET` | `/api/v1/identity/permissions` | `identity.permission.read` | `src/modules/identity/permission/permission.route.ts` |
| `DELETE` | `/api/v1/identity/permissions/:id` | `identity.permission.delete` | `src/modules/identity/permission/permission.route.ts` |
| `GET` | `/api/v1/identity/permissions/:id` | `identity.permission.read` | `src/modules/identity/permission/permission.route.ts` |
| `GET` | `/api/v1/identity/permissions/catalog` | `identity.permission.read` | `src/modules/identity/permission/permission.route.ts` |
| `GET` | `/api/v1/identity/roles` | `identity.role.read` | `src/modules/identity/role/role.route.ts` |
| `GET` | `/api/v1/identity/roles/:id` | `identity.role.read` | `src/modules/identity/role/role.route.ts` |
| `GET` | `/api/v1/identity/roles/:id/impact` | `identity.role.read` | `src/modules/identity/role/role.route.ts` |
| `GET` | `/api/v1/identity/roles/:id/matrix` | `identity.role.read` | `src/modules/identity/role/role.route.ts` |
| `PUT` | `/api/v1/identity/roles/:id/permissions` | `identity.role.assignPermissions` | `src/modules/identity/role/role.route.ts` |
| `GET` | `/api/v1/identity/users` | `identity.user.read` | `src/modules/identity/user/user.route.ts` |
| `DELETE` | `/api/v1/identity/users/:id` | `identity.user.delete` | `src/modules/identity/user/user.route.ts` |
| `GET` | `/api/v1/identity/users/:id` | `identity.user.read` | `src/modules/identity/user/user.route.ts` |
| `GET` | `/api/v1/identity/users/:id/effective-permissions` | `identity.user.read` | `src/modules/identity/user/user.route.ts` |
| `GET` | `/api/v1/identity/users/:id/permission-overrides` | `identity.user.read` | `src/modules/identity/user/user.route.ts` |
| `DELETE` | `/api/v1/identity/users/:id/permission-overrides/:overrideId` | `identity.user.overridePermission` | `src/modules/identity/user/user.route.ts` |
| `DELETE` | `/api/v1/identity/users/:id/roles/:roleId` | `identity.user.assignRole` | `src/modules/identity/user/user.route.ts` |
| `GET` | `/api/v1/institute/public-profile` | `directory.institute.view` | `src/modules/directory/institute-public.route.ts` |
| `GET` | `/api/v1/lms/bundles` | `lms.bundle.read` | `src/modules/lms/bundle/bundle.route.ts` |
| `DELETE` | `/api/v1/lms/bundles/:id` | `lms.bundle.delete` | `src/modules/lms/bundle/bundle.route.ts` |
| `GET` | `/api/v1/lms/bundles/:id` | `lms.bundle.read` | `src/modules/lms/bundle/bundle.route.ts` |
| `GET` | `/api/v1/lms/courses` | `lms.course.read` | `src/modules/lms/course/course.route.ts` |
| `DELETE` | `/api/v1/lms/courses/:id` | `lms.course.delete` | `src/modules/lms/course/course.route.ts` |
| `GET` | `/api/v1/lms/courses/:id` | `lms.course.read` | `src/modules/lms/course/course.route.ts` |
| `GET` | `/api/v1/lms/courses/:id/stats` | `lms.course.stats` | `src/modules/lms/course/course.route.ts` |
| `GET` | `/api/v1/lms/enrollments` | `lms.courseEnrollment.read` | `src/modules/lms/courseEnrollment/courseEnrollment.route.ts` |
| `DELETE` | `/api/v1/lms/enrollments/:id` | `lms.courseEnrollment.delete` | `src/modules/lms/courseEnrollment/courseEnrollment.route.ts` |
| `GET` | `/api/v1/lms/enrollments/:id` | `lms.courseEnrollment.read` | `src/modules/lms/courseEnrollment/courseEnrollment.route.ts` |
| `POST` | `/api/v1/lms/enrollments/restrictions` | `lms.courseEnrollment.restrict` | `src/modules/lms/courseEnrollment/courseEnrollment.route.ts` |
| `POST` | `/api/v1/lms/enrollments/restrictions/:restrictionId/revoke` | `lms.courseEnrollment.revokeRestriction` | `src/modules/lms/courseEnrollment/courseEnrollment.route.ts` |
| `GET` | `/api/v1/lms/learning-items` | `lms.learningItem.read` | `src/modules/lms/learningItem/learningItem.route.ts` |
| `DELETE` | `/api/v1/lms/learning-items/:id` | `lms.learningItem.delete` | `src/modules/lms/learningItem/learningItem.route.ts` |
| `GET` | `/api/v1/lms/learning-items/:id` | `lms.learningItem.read` | `src/modules/lms/learningItem/learningItem.route.ts` |
| `GET` | `/api/v1/lms/lessons` | `lms.lesson.read` | `src/modules/lms/lesson/lesson.route.ts` |
| `DELETE` | `/api/v1/lms/lessons/:id` | `lms.lesson.delete` | `src/modules/lms/lesson/lesson.route.ts` |
| `GET` | `/api/v1/lms/lessons/:id` | `lms.lesson.read` | `src/modules/lms/lesson/lesson.route.ts` |
| `GET` | `/api/v1/lms/milestones` | `lms.milestone.read` | `src/modules/lms/milestone/milestone.route.ts` |
| `DELETE` | `/api/v1/lms/milestones/:id` | `lms.milestone.delete` | `src/modules/lms/milestone/milestone.route.ts` |
| `GET` | `/api/v1/lms/milestones/:id` | `lms.milestone.read` | `src/modules/lms/milestone/milestone.route.ts` |
| `GET` | `/api/v1/lms/modules` | `lms.module.read` | `src/modules/lms/module/module.route.ts` |
| `DELETE` | `/api/v1/lms/modules/:id` | `lms.module.delete` | `src/modules/lms/module/module.route.ts` |
| `GET` | `/api/v1/lms/modules/:id` | `lms.module.read` | `src/modules/lms/module/module.route.ts` |
| `GET` | `/api/v1/lms/notes` | `lms.lessonNote.read` | `src/modules/lms/lessonNote/lessonNote.route.ts` |
| `DELETE` | `/api/v1/lms/notes/:id` | `lms.lessonNote.delete` | `src/modules/lms/lessonNote/lessonNote.route.ts` |
| `GET` | `/api/v1/lms/notes/:id` | `lms.lessonNote.read` | `src/modules/lms/lessonNote/lessonNote.route.ts` |
| `GET` | `/api/v1/lms/videos` | `lms.lessonVideo.read` | `src/modules/lms/lessonVideo/lessonVideo.route.ts` |
| `DELETE` | `/api/v1/lms/videos/:id` | `lms.lessonVideo.delete` | `src/modules/lms/lessonVideo/lessonVideo.route.ts` |
| `GET` | `/api/v1/lms/videos/:id` | `lms.lessonVideo.read` | `src/modules/lms/lessonVideo/lessonVideo.route.ts` |
| `POST` | `/api/v1/lms/videos/:id/heartbeat` | `lms.lessonVideo.read` | `src/modules/lms/lessonVideo/lessonVideo.route.ts` |
| `GET` | `/api/v1/people/guardians` | `people.guardian.read` | `src/modules/people/guardian/guardian.route.ts` |
| `DELETE` | `/api/v1/people/guardians/:id` | `people.guardian.delete` | `src/modules/people/guardian/guardian.route.ts` |
| `GET` | `/api/v1/people/guardians/:id` | `people.guardian.read` | `src/modules/people/guardian/guardian.route.ts` |
| `GET` | `/api/v1/people/staff` | `people.staff.read` | `src/modules/people/staff/staff.route.ts` |
| `DELETE` | `/api/v1/people/staff/:id` | `people.staff.delete` | `src/modules/people/staff/staff.route.ts` |
| `GET` | `/api/v1/people/staff/:id` | `people.staff.read` | `src/modules/people/staff/staff.route.ts` |
| `GET` | `/api/v1/people/staff/me` | `people.staff.read` | `src/modules/people/staff/staff.route.ts` |
| `DELETE` | `/api/v1/people/staff/me/documents/:docId` | `people.staff.update` | `src/modules/people/staff/staff.route.ts` |
| `GET` | `/api/v1/people/students` | `people.student.read` | `src/modules/people/student/student.route.ts` |
| `DELETE` | `/api/v1/people/students/:id` | `people.student.delete` | `src/modules/people/student/student.route.ts` |
| `GET` | `/api/v1/people/students/:id` | `people.student.read` | `src/modules/people/student/student.route.ts` |
| `GET` | `/api/v1/people/students/:id/stats` | `people.student.stats` | `src/modules/people/student/student.route.ts` |
| `GET` | `/api/v1/people/students/me` | `people.student.read` | `src/modules/people/student/student.route.ts` |
| `DELETE` | `/api/v1/people/students/me/documents/:docId` | `people.student.update` | `src/modules/people/student/student.route.ts` |
| `GET` | `/api/v1/people/teachers` | `people.teacher.read` | `src/modules/people/teacher/teacher.route.ts` |
| `DELETE` | `/api/v1/people/teachers/:id` | `people.teacher.delete` | `src/modules/people/teacher/teacher.route.ts` |
| `GET` | `/api/v1/people/teachers/:id` | `people.teacher.read` | `src/modules/people/teacher/teacher.route.ts` |
| `GET` | `/api/v1/people/teachers/me` | `people.teacher.read` | `src/modules/people/teacher/teacher.route.ts` |
| `DELETE` | `/api/v1/people/teachers/me/qualifications/:qualId` | `people.teacher.update` | `src/modules/people/teacher/teacher.route.ts` |
| `GET` | `/api/v1/platform-admin/kpis` | `platform.admin.read` | `src/modules/platform-admin/platform-admin.route.ts` |
| `GET` | `/api/v1/platform-admin/payments/failed` | `platform.admin.read` | `src/modules/platform-admin/platform-admin.route.ts` |
| `GET` | `/api/v1/platform-admin/revenue-trend` | `platform.admin.read` | `src/modules/platform-admin/platform-admin.route.ts` |
| `GET` | `/api/v1/platform-admin/tenants/top-active` | `platform.admin.read` | `src/modules/platform-admin/platform-admin.route.ts` |
| `GET` | `/api/v1/platform/certificates` | `platform.certificate.read` | `src/modules/platform/certificate/certificate.route.ts` |
| `DELETE` | `/api/v1/platform/certificates/:id` | `platform.certificate.delete` | `src/modules/platform/certificate/certificate.route.ts` |
| `GET` | `/api/v1/platform/certificates/:id` | `platform.certificate.read` | `src/modules/platform/certificate/certificate.route.ts` |
| `GET` | `/api/v1/platform/files` | `platform.file.read` | `src/modules/platform/file/file.route.ts` |
| `DELETE` | `/api/v1/platform/files/:id` | `platform.file.delete` | `src/modules/platform/file/file.route.ts` |
| `GET` | `/api/v1/platform/files/:id` | `platform.file.read` | `src/modules/platform/file/file.route.ts` |
| `DELETE` | `/api/v1/platform/notices/:id` | `platform.notice.delete` | `src/modules/platform/notice/notice.route.ts` |
| `GET` | `/api/v1/platform/notices/:id` | `platform.notice.read` | `src/modules/platform/notice/notice.route.ts` |
| `POST` | `/api/v1/platform/notices/:id/publish` | `platform.notice.update` | `src/modules/platform/notice/notice.route.ts` |
| `POST` | `/api/v1/platform/notices/:id/read` | `platform.notice.read` | `src/modules/platform/notice/notice.route.ts` |
| `GET` | `/api/v1/platform/notices/:id/stats` | `platform.notice.read` | `src/modules/platform/notice/notice.route.ts` |
| `POST` | `/api/v1/platform/notices/:id/unpublish` | `platform.notice.update` | `src/modules/platform/notice/notice.route.ts` |
| `GET` | `/api/v1/platform/notices/unread-count` | `platform.notice.read` | `src/modules/platform/notice/notice.route.ts` |
| `GET` | `/api/v1/platform/notifications` | `platform.notification.read` | `src/modules/platform/notification/notification.route.ts` |
| `DELETE` | `/api/v1/platform/notifications/:id` | `platform.notification.delete` | `src/modules/platform/notification/notification.route.ts` |
| `GET` | `/api/v1/platform/notifications/:id` | `platform.notification.read` | `src/modules/platform/notification/notification.route.ts` |
| `GET` | `/api/v1/saas/institutes` | `saas.institute.read` | `src/modules/saas/institute/institute.route.ts` |
| `DELETE` | `/api/v1/saas/institutes/:id` | `saas.institute.delete` | `src/modules/saas/institute/institute.route.ts` |
| `GET` | `/api/v1/saas/institutes/:id` | `saas.institute.read` | `src/modules/saas/institute/institute.route.ts` |
| `PATCH` | `/api/v1/saas/institutes/:id/settings` | `saas.institute.settings` | `src/modules/saas/institute/institute.route.ts` |
| `GET` | `/api/v1/saas/institutes/:id/stats` | `saas.institute.stats` | `src/modules/saas/institute/institute.route.ts` |
| `POST` | `/api/v1/saas/institutes/:id/suspend` | `saas.institute.suspend` | `src/modules/saas/institute/institute.route.ts` |
| `GET` | `/api/v1/saas/subscriptions` | `saas.subscription.read` | `src/modules/saas/subscription/subscription.route.ts` |
| `DELETE` | `/api/v1/saas/subscriptions/:id` | `saas.subscription.delete` | `src/modules/saas/subscription/subscription.route.ts` |
| `GET` | `/api/v1/saas/subscriptions/:id` | `saas.subscription.read` | `src/modules/saas/subscription/subscription.route.ts` |
| `POST` | `/api/v1/settings/2fa/enable` | `settings.user.2fa` | `src/modules/settings/settings.route.ts` |
| `GET` | `/api/v1/settings/institute` | `settings.institute.view` | `src/modules/settings/settings.route.ts` |
| `GET` | `/api/v1/settings/me` | `settings.user.view` | `src/modules/settings/settings.route.ts` |
| `GET` | `/api/v1/settings/sessions` | `settings.user.sessions` | `src/modules/settings/settings.route.ts` |
| `GET` | `/api/v1/student-portal` | `student.portal.view` | `src/modules/student-portal/student-portal.route.ts` |
| `GET` | `/api/v1/student-portal/continue-learning` | `student.portal.view` | `src/modules/student-portal/student-portal.route.ts` |
| `GET` | `/api/v1/student-portal/overdue-items` | `student.portal.view` | `src/modules/student-portal/student-portal.route.ts` |
| `GET` | `/api/v1/student-portal/performance-trend` | `student.portal.view` | `src/modules/student-portal/student-portal.route.ts` |
| `GET` | `/api/v1/student-portal/subject-progress` | `student.portal.view` | `src/modules/student-portal/student-portal.route.ts` |
| `GET` | `/api/v1/student-portal/today-summary` | `student.portal.view` | `src/modules/student-portal/student-portal.route.ts` |
| `POST` | `/api/v1/support/sessions/:id/cancel` | `support.ticket.view` | `src/modules/support/support.route.ts` |
| `GET` | `/api/v1/support/settings` | `support.settings.manage` | `src/modules/support/support.route.ts` |
| `GET` | `/api/v1/support/slots/available` | `support.ticket.view` | `src/modules/support/support.route.ts` |
| `GET` | `/api/v1/support/status` | `support.ticket.view` | `src/modules/support/support.route.ts` |
| `POST` | `/api/v1/support/tickets/:id/resolve` | `support.ticket.manage` | `src/modules/support/support.route.ts` |
| `GET` | `/api/v1/support/tickets/my` | `support.ticket.view` | `src/modules/support/support.route.ts` |
| `GET` | `/api/v1/support/tickets/my/:id` | `support.ticket.view` | `src/modules/support/support.route.ts` |
| `POST` | `/api/v1/support/tickets/my/:id/close` | `support.ticket.create` | `src/modules/support/support.route.ts` |
