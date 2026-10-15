/**
 * Standard KPI Card structure for role dashboards.
 */
export interface IKPICard {
  title: string;
  value: string | number;
  change?: number; // e.g., +5.2% vs last period
  unit?: string;   // e.g., "%", "days", "tickets"
  description?: string;
  status?: "positive" | "negative" | "neutral";
}

/**
 * Standard Chart Data Point for chart-ready UI consumption.
 */
export interface IChartDataPoint {
  label: string;
  value: number;
  [key: string]: any;
}

/**
 * Teacher Dashboard Aggregation Output Contract.
 */
export interface ITeacherDashboardData {
  teacherId: string;
  employeeCode?: string;
  cachedAt: string;
  kpis: {
    todayClassesCount: IKPICard;
    pendingAttendanceCount: IKPICard;
    pendingGradingCount: IKPICard;
    totalAssignedStudents: IKPICard;
    averageAttendanceRate: IKPICard;
    atRiskStudentsCount: IKPICard;
  };
  charts: {
    classAttendanceStats: IChartDataPoint[];
    assignmentSubmissionRate: IChartDataPoint[];
    quizPerformance: IChartDataPoint[];
    courseCompletionFunnel: IChartDataPoint[];
  };
  todayClasses: any[];
  pendingAttendance: any[];
  pendingGrading: any[];
  atRiskStudents: any[];
}

/**
 * Admin Dashboard Aggregation Output Contract.
 */
export interface IAdminDashboardData {
  instituteId: string;
  cachedAt: string;
  kpis: {
    totalStudents: IKPICard;
    totalTeachers: IKPICard;
    totalCourses: IKPICard;
    todayAttendanceRate: IKPICard;
    overallPassRate: IKPICard;
    openSupportTickets: IKPICard;
  };
  charts: {
    enrollmentTrend: IChartDataPoint[];
    attendanceRate: IChartDataPoint[];
    resultPassRate: IChartDataPoint[];
    lmsEngagement: IChartDataPoint[];
    teacherWorkload: IChartDataPoint[];
    supportStats: IChartDataPoint[];
  };
}

/**
 * Guardian Ward Child representation for switching children.
 */
export interface IGuardianChildSummary {
  childId: string;
  studentCode: string;
  fullName: string;
  relationship: string;
  isPrimary: boolean;
  canViewAcademic: boolean;
  canViewFinance: boolean;
  classGroup: string | null;
  section: string | null;
  rollNumber: string | null;
  photoUrl?: string | null;
}

/**
 * Guardian Dashboard Aggregation Output Contract.
 */
export interface IGuardianDashboardData {
  guardianId: string;
  activeChild: IGuardianChildSummary | null;
  availableChildren: IGuardianChildSummary[];
  cachedAt: string;
  kpis?: {
    attendanceRate: IKPICard;
    gpa: IKPICard;
    enrolledCoursesCount: IKPICard;
    upcomingExamsCount: IKPICard;
    unreadNoticesCount: IKPICard;
  };
  attendance?: {
    chart: IChartDataPoint[];
    recentRecords: any[];
  };
  results?: {
    chart: IChartDataPoint[];
    recentResults: any[];
    isRestricted?: boolean;
  };
  notices: any[];
}

/**
 * Filter query parameters for role dashboard endpoints.
 */
export interface ITeacherDashboardFilterQuery {
  classGroupId?: string;
  courseId?: string;
  days?: number;
}

export interface IAdminDashboardFilterQuery {
  period?: "month" | "year" | "quarter";
  days?: number;
  academicYearId?: string;
}

export interface IGuardianDashboardFilterQuery {
  childId?: string;
  days?: number;
}
