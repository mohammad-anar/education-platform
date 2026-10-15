# System Permission Catalog

> Auto-generated catalog mapping every active route and mutation in the system to fine-grained permission codes.

**Total Permissions:** 192

| Permission Code | Module | Resource | Action | Default Scope | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `saas.institute.create` | saas | `saas.institute` | `create` | `ALL` | Create new tenant institutes |
| `saas.institute.read` | saas | `saas.institute` | `read` | `INSTITUTE` | Read institute details and listing |
| `saas.institute.update` | saas | `saas.institute` | `update` | `INSTITUTE` | Update institute profile and configuration |
| `saas.institute.delete` | saas | `saas.institute` | `delete` | `ALL` | Permanently delete an institute |
| `saas.institute.suspend` | saas | `saas.institute` | `suspend` | `ALL` | Suspend an institute tenant |
| `saas.institute.stats` | saas | `saas.institute` | `stats` | `INSTITUTE` | View aggregate institute analytics and counts |
| `saas.institute.settings` | saas | `saas.institute` | `settings` | `INSTITUTE` | Update institute tenant-level settings |
| `saas.subscription.create` | saas | `saas.subscription` | `create` | `INSTITUTE` | Create a subscription record |
| `saas.subscription.read` | saas | `saas.subscription` | `read` | `INSTITUTE` | Read subscription information |
| `saas.subscription.update` | saas | `saas.subscription` | `update` | `INSTITUTE` | Modify or cancel a subscription |
| `saas.subscription.delete` | saas | `saas.subscription` | `delete` | `ALL` | Delete subscription records |
| `identity.user.create` | identity | `identity.user` | `create` | `INSTITUTE` | Create or invite users |
| `identity.user.read` | identity | `identity.user` | `read` | `INSTITUTE` | View user directory or profile |
| `identity.user.update` | identity | `identity.user` | `update` | `INSTITUTE` | Update user profile and status |
| `identity.user.delete` | identity | `identity.user` | `delete` | `INSTITUTE` | Delete or purge users |
| `identity.user.assignRole` | identity | `identity.user` | `assignRole` | `INSTITUTE` | Assign or revoke roles for users |
| `identity.user.overridePermission` | identity | `identity.user` | `overridePermission` | `INSTITUTE` | Grant or revoke permission overrides for users |
| `identity.role.create` | identity | `identity.role` | `create` | `INSTITUTE` | Create custom tenant roles |
| `identity.role.read` | identity | `identity.role` | `read` | `INSTITUTE` | View role configurations and permissions |
| `identity.role.update` | identity | `identity.role` | `update` | `INSTITUTE` | Update role details |
| `identity.role.delete` | identity | `identity.role` | `delete` | `INSTITUTE` | Delete non-system roles |
| `identity.role.assignPermissions` | identity | `identity.role` | `assignPermissions` | `INSTITUTE` | Assign or modify permissions mapped to a role |
| `identity.permission.create` | identity | `identity.permission` | `create` | `ALL` | Register new system permissions |
| `identity.permission.read` | identity | `identity.permission` | `read` | `INSTITUTE` | List all registered permissions |
| `identity.permission.update` | identity | `identity.permission` | `update` | `ALL` | Update permission metadata |
| `identity.permission.delete` | identity | `identity.permission` | `delete` | `ALL` | Delete permission entries |
| `people.student.create` | people | `people.student` | `create` | `INSTITUTE` | Admit or register students |
| `people.student.read` | people | `people.student` | `read` | `INSTITUTE` | View student directory and student profile |
| `people.student.update` | people | `people.student` | `update` | `INSTITUTE` | Update student admission and profile information |
| `people.student.delete` | people | `people.student` | `delete` | `INSTITUTE` | Archive or delete student record |
| `people.student.stats` | people | `people.student` | `stats` | `INSTITUTE` | View aggregate student performance and attendance statistics |
| `people.teacher.create` | people | `people.teacher` | `create` | `INSTITUTE` | Hire or register teacher profiles |
| `people.teacher.read` | people | `people.teacher` | `read` | `INSTITUTE` | View faculty and teacher records |
| `people.teacher.update` | people | `people.teacher` | `update` | `INSTITUTE` | Update faculty profile and assignments |
| `people.teacher.delete` | people | `people.teacher` | `delete` | `INSTITUTE` | Terminate or delete faculty profile |
| `people.staff.create` | people | `people.staff` | `create` | `INSTITUTE` | Add operational staff records |
| `people.staff.read` | people | `people.staff` | `read` | `INSTITUTE` | View staff directory and employment details |
| `people.staff.update` | people | `people.staff` | `update` | `INSTITUTE` | Update staff profile, department, and designation |
| `people.staff.delete` | people | `people.staff` | `delete` | `INSTITUTE` | Remove staff records |
| `people.guardian.create` | people | `people.guardian` | `create` | `INSTITUTE` | Register parents and guardians |
| `people.guardian.read` | people | `people.guardian` | `read` | `INSTITUTE` | View guardian records and linked wards |
| `people.guardian.update` | people | `people.guardian` | `update` | `INSTITUTE` | Update guardian details |
| `people.guardian.delete` | people | `people.guardian` | `delete` | `INSTITUTE` | Delete guardian profiles |
| `directory.teacher.view` | directory | `directory.teacher` | `view` | `INSTITUTE` | View teachers in directory with visibility filtering |
| `directory.staff.view` | directory | `directory.staff` | `view` | `INSTITUTE` | View staff in directory with visibility filtering |
| `directory.institute.view` | directory | `directory.institute` | `view` | `INSTITUTE` | View institute public profile and contact information |
| `student.portal.view` | student | `student.portal` | `view` | `OWN` | Access student personal portal and dashboard metrics |
| `academic.academicYear.create` | academic | `academic.academicYear` | `create` | `INSTITUTE` | Define academic years and terms |
| `academic.academicYear.read` | academic | `academic.academicYear` | `read` | `INSTITUTE` | View academic calendar years |
| `academic.academicYear.update` | academic | `academic.academicYear` | `update` | `INSTITUTE` | Modify academic year dates and current status |
| `academic.academicYear.delete` | academic | `academic.academicYear` | `delete` | `INSTITUTE` | Delete academic years |
| `academic.program.create` | academic | `academic.program` | `create` | `INSTITUTE` | Create educational programs or degrees |
| `academic.program.read` | academic | `academic.program` | `read` | `INSTITUTE` | View program structures |
| `academic.program.update` | academic | `academic.program` | `update` | `INSTITUTE` | Update academic programs |
| `academic.program.delete` | academic | `academic.program` | `delete` | `INSTITUTE` | Delete academic programs |
| `academic.level.create` | academic | `academic.level` | `create` | `INSTITUTE` | Create academic grade levels |
| `academic.level.read` | academic | `academic.level` | `read` | `INSTITUTE` | View academic levels |
| `academic.level.update` | academic | `academic.level` | `update` | `INSTITUTE` | Update grade levels |
| `academic.level.delete` | academic | `academic.level` | `delete` | `INSTITUTE` | Delete grade levels |
| `academic.classGroup.create` | academic | `academic.classGroup` | `create` | `INSTITUTE` | Create classes and batches |
| `academic.classGroup.read` | academic | `academic.classGroup` | `read` | `INSTITUTE` | View class groups and cohorts |
| `academic.classGroup.update` | academic | `academic.classGroup` | `update` | `INSTITUTE` | Update class group metadata |
| `academic.classGroup.delete` | academic | `academic.classGroup` | `delete` | `INSTITUTE` | Delete class groups |
| `academic.section.create` | academic | `academic.section` | `create` | `INSTITUTE` | Add sections to class groups |
| `academic.section.read` | academic | `academic.section` | `read` | `INSTITUTE` | View sections |
| `academic.section.update` | academic | `academic.section` | `update` | `INSTITUTE` | Update sections |
| `academic.section.delete` | academic | `academic.section` | `delete` | `INSTITUTE` | Delete sections |
| `academic.subject.create` | academic | `academic.subject` | `create` | `INSTITUTE` | Create academic subjects/courses syllabus |
| `academic.subject.read` | academic | `academic.subject` | `read` | `INSTITUTE` | View subject curriculum |
| `academic.subject.update` | academic | `academic.subject` | `update` | `INSTITUTE` | Update subjects |
| `academic.subject.delete` | academic | `academic.subject` | `delete` | `INSTITUTE` | Delete subjects |
| `academic.enrollment.create` | academic | `academic.enrollment` | `create` | `INSTITUTE` | Enroll students into academic years, classes, and sections |
| `academic.enrollment.read` | academic | `academic.enrollment` | `read` | `INSTITUTE` | View student academic enrollments |
| `academic.enrollment.update` | academic | `academic.enrollment` | `update` | `INSTITUTE` | Promote, transfer, or update academic enrollment |
| `academic.enrollment.delete` | academic | `academic.enrollment` | `delete` | `INSTITUTE` | Cancel student academic enrollment |
| `attendance.policy.create` | attendance | `attendance.policy` | `create` | `INSTITUTE` | Define attendance rules and policies |
| `attendance.policy.read` | attendance | `attendance.policy` | `read` | `INSTITUTE` | View attendance policies |
| `attendance.policy.update` | attendance | `attendance.policy` | `update` | `INSTITUTE` | Update attendance policies |
| `attendance.policy.delete` | attendance | `attendance.policy` | `delete` | `INSTITUTE` | Delete attendance policies |
| `attendance.calendar.create` | attendance | `attendance.calendar` | `create` | `INSTITUTE` | Create working day and holiday calendars |
| `attendance.calendar.read` | attendance | `attendance.calendar` | `read` | `INSTITUTE` | View working calendar |
| `attendance.calendar.update` | attendance | `attendance.calendar` | `update` | `INSTITUTE` | Update calendar and declare holidays |
| `attendance.calendar.delete` | attendance | `attendance.calendar` | `delete` | `INSTITUTE` | Delete calendar entries |
| `attendance.calendar.generateSessions` | attendance | `attendance.calendar` | `generateSessions` | `INSTITUTE` | Generate attendance sessions for a calendar |
| `attendance.session.create` | attendance | `attendance.session` | `create` | `ASSIGNED` | Open an attendance taking session |
| `attendance.session.read` | attendance | `attendance.session` | `read` | `ASSIGNED` | View attendance sessions |
| `attendance.session.update` | attendance | `attendance.session` | `update` | `ASSIGNED` | Modify attendance session status |
| `attendance.session.delete` | attendance | `attendance.session` | `delete` | `INSTITUTE` | Cancel attendance sessions |
| `attendance.routine.create` | attendance | `attendance.routine` | `create` | `INSTITUTE` | Schedule class routines and timetables |
| `attendance.routine.read` | attendance | `attendance.routine` | `read` | `ASSIGNED` | View class routines and periods |
| `attendance.routine.update` | attendance | `attendance.routine` | `update` | `INSTITUTE` | Update class timetables |
| `attendance.routine.delete` | attendance | `attendance.routine` | `delete` | `INSTITUTE` | Delete timetable periods |
| `attendance.liveClass.create` | attendance | `attendance.liveClass` | `create` | `ASSIGNED` | Schedule online/live class sessions |
| `attendance.liveClass.read` | attendance | `attendance.liveClass` | `read` | `ASSIGNED` | View live class schedule and links |
| `attendance.liveClass.update` | attendance | `attendance.liveClass` | `update` | `ASSIGNED` | Modify live class meeting details |
| `attendance.liveClass.delete` | attendance | `attendance.liveClass` | `delete` | `ASSIGNED` | Cancel live class sessions |
| `lms.course.create` | lms | `lms.course` | `create` | `INSTITUTE` | Create online courses |
| `lms.course.read` | lms | `lms.course` | `read` | `INSTITUTE` | Browse course directory and content |
| `lms.course.update` | lms | `lms.course` | `update` | `ASSIGNED` | Update course curriculum and publishing state |
| `lms.course.delete` | lms | `lms.course` | `delete` | `INSTITUTE` | Delete courses |
| `lms.course.stats` | lms | `lms.course` | `stats` | `ASSIGNED` | View course enrollment, completion, and progress statistics |
| `lms.milestone.create` | lms | `lms.milestone` | `create` | `ASSIGNED` | Add milestones to a course |
| `lms.milestone.read` | lms | `lms.milestone` | `read` | `ASSIGNED` | View course milestones |
| `lms.milestone.update` | lms | `lms.milestone` | `update` | `ASSIGNED` | Update milestones |
| `lms.milestone.delete` | lms | `lms.milestone` | `delete` | `ASSIGNED` | Delete milestones |
| `lms.module.create` | lms | `lms.module` | `create` | `ASSIGNED` | Add learning modules inside milestones |
| `lms.module.read` | lms | `lms.module` | `read` | `ASSIGNED` | View learning modules |
| `lms.module.update` | lms | `lms.module` | `update` | `ASSIGNED` | Update learning modules |
| `lms.module.delete` | lms | `lms.module` | `delete` | `ASSIGNED` | Delete learning modules |
| `lms.lesson.create` | lms | `lms.lesson` | `create` | `ASSIGNED` | Create lessons within modules |
| `lms.lesson.read` | lms | `lms.lesson` | `read` | `ASSIGNED` | Read lesson contents |
| `lms.lesson.update` | lms | `lms.lesson` | `update` | `ASSIGNED` | Edit lesson contents |
| `lms.lesson.delete` | lms | `lms.lesson` | `delete` | `ASSIGNED` | Delete lessons |
| `lms.learningItem.create` | lms | `lms.learningItem` | `create` | `ASSIGNED` | Attach learning items (videos, quizzes, docs, articles) to lessons |
| `lms.learningItem.read` | lms | `lms.learningItem` | `read` | `ASSIGNED` | Access learning items |
| `lms.learningItem.update` | lms | `lms.learningItem` | `update` | `ASSIGNED` | Update learning item contents |
| `lms.learningItem.delete` | lms | `lms.learningItem` | `delete` | `ASSIGNED` | Remove learning items |
| `lms.lessonVideo.create` | lms | `lms.lessonVideo` | `create` | `ASSIGNED` | Upload and attach video resources to lessons |
| `lms.lessonVideo.read` | lms | `lms.lessonVideo` | `read` | `ASSIGNED` | Stream lesson videos |
| `lms.lessonVideo.update` | lms | `lms.lessonVideo` | `update` | `ASSIGNED` | Update lesson video metadata |
| `lms.lessonVideo.delete` | lms | `lms.lessonVideo` | `delete` | `ASSIGNED` | Delete lesson videos |
| `lms.lessonNote.create` | lms | `lms.lessonNote` | `create` | `OWN` | Take or publish lesson notes |
| `lms.lessonNote.read` | lms | `lms.lessonNote` | `read` | `OWN` | View lesson notes |
| `lms.lessonNote.update` | lms | `lms.lessonNote` | `update` | `OWN` | Update lesson notes |
| `lms.lessonNote.delete` | lms | `lms.lessonNote` | `delete` | `OWN` | Delete lesson notes |
| `lms.courseEnrollment.create` | lms | `lms.courseEnrollment` | `create` | `INSTITUTE` | Enroll students into digital LMS courses |
| `lms.courseEnrollment.read` | lms | `lms.courseEnrollment` | `read` | `ASSIGNED` | View course enrollments and progress |
| `lms.courseEnrollment.update` | lms | `lms.courseEnrollment` | `update` | `INSTITUTE` | Update course enrollment status |
| `lms.courseEnrollment.delete` | lms | `lms.courseEnrollment` | `delete` | `INSTITUTE` | Drop or delete course enrollments |
| `lms.courseEnrollment.restrict` | lms | `lms.courseEnrollment` | `restrict` | `INSTITUTE` | Place access restrictions on a student enrollment |
| `lms.courseEnrollment.revokeRestriction` | lms | `lms.courseEnrollment` | `revokeRestriction` | `INSTITUTE` | Lift or revoke course access restrictions |
| `lms.bundle.create` | lms | `lms.bundle` | `create` | `INSTITUTE` | Create course packages and bundles |
| `lms.bundle.read` | lms | `lms.bundle` | `read` | `INSTITUTE` | View course bundles |
| `lms.bundle.update` | lms | `lms.bundle` | `update` | `INSTITUTE` | Update course bundle pricing and courses |
| `lms.bundle.delete` | lms | `lms.bundle` | `delete` | `INSTITUTE` | Delete course bundles |
| `assessment.markingScheme.create` | assessment | `assessment.markingScheme` | `create` | `INSTITUTE` | Design evaluation marking schemes |
| `assessment.markingScheme.read` | assessment | `assessment.markingScheme` | `read` | `INSTITUTE` | View marking schemes |
| `assessment.markingScheme.update` | assessment | `assessment.markingScheme` | `update` | `INSTITUTE` | Update marking scheme weightages |
| `assessment.markingScheme.delete` | assessment | `assessment.markingScheme` | `delete` | `INSTITUTE` | Delete marking schemes |
| `assessment.grading.create` | assessment | `assessment.grading` | `create` | `INSTITUTE` | Define GPA and letter grading systems |
| `assessment.grading.read` | assessment | `assessment.grading` | `read` | `INSTITUTE` | View grading scales |
| `assessment.grading.update` | assessment | `assessment.grading` | `update` | `INSTITUTE` | Update grading scales |
| `assessment.grading.delete` | assessment | `assessment.grading` | `delete` | `INSTITUTE` | Delete grading systems |
| `assessment.assessment.create` | assessment | `assessment.assessment` | `create` | `ASSIGNED` | Create class assessments, quizzes, and assignments |
| `assessment.assessment.read` | assessment | `assessment.assessment` | `read` | `ASSIGNED` | View assessments and assignments |
| `assessment.assessment.update` | assessment | `assessment.assessment` | `update` | `ASSIGNED` | Edit assessment questions and due dates |
| `assessment.assessment.delete` | assessment | `assessment.assessment` | `delete` | `ASSIGNED` | Delete assessments |
| `assessment.exam.create` | assessment | `assessment.exam` | `create` | `INSTITUTE` | Create term exams and exams schedules |
| `assessment.exam.read` | assessment | `assessment.exam` | `read` | `ASSIGNED` | View exam timetable and details |
| `assessment.exam.update` | assessment | `assessment.exam` | `update` | `INSTITUTE` | Update exam configuration |
| `assessment.exam.delete` | assessment | `assessment.exam` | `delete` | `INSTITUTE` | Delete exams |
| `assessment.exam.updateMark` | assessment | `assessment.exam` | `updateMark` | `ASSIGNED` | Enter or update exam marks for students |
| `assessment.result.create` | assessment | `assessment.result` | `create` | `INSTITUTE` | Compute and create student results |
| `assessment.result.read` | assessment | `assessment.result` | `read` | `OWN` | View student report cards and results |
| `assessment.result.update` | assessment | `assessment.result` | `update` | `INSTITUTE` | Update student results |
| `assessment.result.delete` | assessment | `assessment.result` | `delete` | `INSTITUTE` | Delete result records |
| `assessment.result.publish` | assessment | `assessment.result` | `publish` | `INSTITUTE` | Publish finalized examination results to students |
| `assessment.result.override` | assessment | `assessment.result` | `override` | `INSTITUTE` | Manually override published or calculated student marks |
| `platform.notice.create` | platform | `platform.notice` | `create` | `INSTITUTE` | Publish notices on the noticeboard |
| `platform.notice.read` | platform | `platform.notice` | `read` | `INSTITUTE` | Read noticeboard announcements |
| `platform.notice.update` | platform | `platform.notice` | `update` | `INSTITUTE` | Edit noticeboard announcements |
| `platform.notice.delete` | platform | `platform.notice` | `delete` | `INSTITUTE` | Archive or delete notices |
| `platform.notification.create` | platform | `platform.notification` | `create` | `INSTITUTE` | Send push/in-app notifications |
| `platform.notification.read` | platform | `platform.notification` | `read` | `OWN` | View user notifications |
| `platform.notification.update` | platform | `platform.notification` | `update` | `OWN` | Mark notifications as read |
| `platform.notification.delete` | platform | `platform.notification` | `delete` | `OWN` | Dismiss or delete notifications |
| `platform.file.create` | platform | `platform.file` | `create` | `INSTITUTE` | Upload assets and files |
| `platform.file.read` | platform | `platform.file` | `read` | `INSTITUTE` | Download or view files and assets |
| `platform.file.update` | platform | `platform.file` | `update` | `INSTITUTE` | Update file metadata |
| `platform.file.delete` | platform | `platform.file` | `delete` | `INSTITUTE` | Permanently delete uploaded files |
| `platform.certificate.create` | platform | `platform.certificate` | `create` | `INSTITUTE` | Issue certificates to students |
| `platform.certificate.read` | platform | `platform.certificate` | `read` | `OWN` | View and verify certificates |
| `platform.certificate.update` | platform | `platform.certificate` | `update` | `INSTITUTE` | Revoke or update certificates |
| `platform.certificate.delete` | platform | `platform.certificate` | `delete` | `INSTITUTE` | Delete certificate records |
| `platform.auditLog.read` | platform | `platform.auditLog` | `read` | `INSTITUTE` | Inspect tenant compliance and security audit logs |
| `support.ticket.create` | support | `support.ticket` | `create` | `OWN` | Create support tickets |
| `support.ticket.view` | support | `support.ticket` | `view` | `OWN` | View support tickets and session details |
| `support.ticket.manage` | support | `support.ticket` | `manage` | `INSTITUTE` | Manage ticket queue, assign, change status, and resolve tickets |
| `support.session.host` | support | `support.session` | `host` | `ASSIGNED` | Publish availability, host, confirm, and complete live support sessions |
| `support.settings.manage` | support | `support.settings` | `manage` | `INSTITUTE` | Configure institute support hours, provider, and settings |
| `teacher.dashboard.view` | dashboard | `dashboard.teacher` | `view` | `ASSIGNED` | View teacher role dashboard and student performance analytics |
| `admin.dashboard.view` | dashboard | `dashboard.admin` | `view` | `INSTITUTE` | View institute admin operational and academic analytics dashboard |
| `guardian.dashboard.view` | dashboard | `dashboard.guardian` | `view` | `ASSIGNED` | View guardian dashboard, attendance, results, and notices for linked wards |
| `platform.admin.manage` | platform | `platform.admin` | `manage` | `ALL` | Full platform owner console administration, tenant operations, plans, and impersonation |
| `platform.admin.read` | platform | `platform.admin` | `read` | `ALL` | Read platform KPIs, revenue trends, tenant usages, and platform audit logs |
| `settings.user.view` | settings | `user.settings` | `view` | `OWN` | View user personal preferences, language, theme, and notification preferences |
| `settings.user.update` | settings | `user.settings` | `update` | `OWN` | Update user personal preferences, language, theme, and notification preferences |
| `settings.user.password` | settings | `user.password` | `update` | `OWN` | Change user account password |
| `settings.user.2fa` | settings | `user.2fa` | `manage` | `OWN` | Enable, verify, and disable two-factor authentication (TOTP) |
| `settings.user.sessions` | settings | `user.sessions` | `manage` | `OWN` | List active user sessions and revoke specific sessions |
| `settings.institute.view` | settings | `institute.settings` | `view` | `INSTITUTE` | View institute configuration, grading, attendance, branding, and visibility settings |
| `settings.institute.manage` | settings | `institute.settings` | `manage` | `INSTITUTE` | Update institute configuration, grading, attendance, branding, and visibility settings |

## Scope Legend
- **`OWN`**: User can only operate on records created by or owned by themselves.
- **`ASSIGNED`**: User can operate on records explicitly assigned to them (e.g. Teacher's classes/courses, Guardian's wards).
- **`INSTITUTE`**: User can operate across the entire tenant institute.
- **`ALL`**: Cross-tenant or platform super-admin access.
