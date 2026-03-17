export type ApiEnvelope<T> = {
  success: boolean;
  message?: string | null;
  error?: string | null;
  data: T;
};

export type PageResponse<T> = {
  content: T[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  number?: number;
};

export type AuthData = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiry: number;
  roles: string[];
  persmission?: string[];
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type EventItem = {
  id?: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  venue: string;
  eventDate: string;
  eventTime: string;
  organisingDepartment: string;
  brochureUrl: string;
};

export type NewsItem = {
  id?: number;
  title: string;
  description: string;
  thumbNail: string;
  publisher: string;
  images: string[];
};

export type CourseHighlight = { title: string; description: string };
export type CourseSubject = {
  subjectCode: string;
  subjectName: string;
  credits: number;
};
export type CourseSemester = {
  semesterNumber: number;
  subjects: CourseSubject[];
};

export type CourseItem = {
  id?: number;
  code: string;
  title: string;
  overview: string;
  durationYears: number;
  totalSemesters: number;
  level: string;
  mode: string;
  yearlyFee: number;
  department: string;
  highlights: CourseHighlight[];
  semesters: CourseSemester[];
  careerOpportunities: { roleName: string }[];
  eligibility: { requirement: string }[];
};

export type SportAchievement = {
  id?: number;
  title: string;
  description: string;
  imageUrl: string;
};

export type SportItem = {
  id?: number;
  title: string;
  overView: string;
  imageUrl: string;
  achievements: SportAchievement[];
};
