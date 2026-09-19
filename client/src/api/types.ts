// ============================================================
// Velvet Health — API data shapes (mirrors docs/api-contract.md)
// ============================================================

/** Application role carried in the JWT `{ sub, role, ver }` payload. */
export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'

/** Publication state for a course. */
export type CourseStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED'

/** State of an instructor application. */
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** Full user profile as returned by `POST /api/auth/register` and `GET /api/auth/me`. */
export interface User {
  id: number
  nombre: string
  apellidos: string
  profesion: string | null
  edad: number | null
  correo: string
  role: Role
  createdAt: string
}

/** Reduced user shape returned by `POST /api/auth/login`. */
export type AuthUser = Pick<User, 'id' | 'nombre' | 'correo' | 'role'>

/** User shape returned by `GET /api/users` (no createdAt). */
export interface PublicUser {
  id: number
  nombre: string
  apellidos: string
  profesion: string | null
  edad: number | null
  correo: string
}

export interface Course {
  id: number
  slug: string
  title: string
  description: string
  minutes: number
  image: string
  passThreshold: number
}

export interface Lesson {
  id: number
  title: string
  content: string
  order: number
  durationMinutes: number | null
}

export interface Module {
  id: number
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

export interface CourseDetail extends Course {
  instructions: string[]
  modules: Module[]
}

export interface QuestionOption {
  id: number
  text: string
}

export interface Question {
  id: number
  prompt: string
  options: QuestionOption[]
}

export interface Exam {
  courseId: number
  questions: Question[]
}

export interface ExamResult {
  id: number
  courseId: number
  courseSlug: string
  score: number
  passed: boolean
  createdAt: string
}

export interface Answer {
  questionId: number
  optionId: number
}

export interface ExamSubmitResult {
  score: number
  passed: boolean
  resultId: number
}

/** Metadata for a credential document uploaded with an instructor application. */
export interface Document {
  id: number
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
}

export interface InstructorApplication {
  id: number
  status: ApplicationStatus
  createdAt: string
  applicant: {
    id: number
    nombre: string
    apellidos: string
    correo: string
    profesion: string | null
    edad: number | null
  }
  documents: Document[]
  reviewedBy: { id: number; nombre: string; apellidos: string } | null
  reviewedAt: string | null
  reviewNotes: string | null
}

// --- Dashboards (role-scoped) ---

export interface StudentDashboard {
  student: { id: number; nombre: string; role: Role }
  progress: {
    coursesStarted: number
    coursesCompleted: number
    totalCourses: number
  }
  results: ExamResult[]
  recommendations: {
    id: number
    slug: string
    title: string
    image: string
    minutes: number
  }[]
}

export interface InstructorDashboard {
  instructor: { id: number; nombre: string; role: Role }
  stats: {
    totalCourses: number
    draft: number
    pending: number
    published: number
    totalStudents: number
    totalResults: number
  }
  courses: {
    id: number
    slug: string
    title: string
    status: CourseStatus
    minutes: number
    studentsCount: number
  }[]
}

export interface AdminDashboard {
  counts: {
    users: number
    students: number
    instructors: number
    admins: number
    courses: number
    publishedCourses: number
    pendingCourses: number
    applications: number
    pendingApplications: number
    results: number
  }
}

// --- Request payloads ---

export interface RegisterPayload {
  nombre: string
  apellidos: string
  profesion: string | null
  edad: number | null
  correo: string
  contraseña: string
}

export interface LoginPayload {
  correo: string
  contraseña: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

// --- Response envelopes ---

export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}

export interface MessageResponse {
  message: string
}

export interface CoursesResponse {
  courses: Course[]
}

export interface CourseResponse {
  course: CourseDetail
}

export interface LessonsResponse {
  modules: Module[]
}

export interface ExamResponse {
  exam: Exam
}

export interface ResultsResponse {
  results: ExamResult[]
}

// --- Instructor (own courses + questions exposing the correct answer) ---

/** Course as returned by the instructor endpoints (carries `status` + owner). */
export interface InstructorCourse {
  id: number
  slug: string
  title: string
  description: string
  minutes: number
  image: string
  passThreshold: number
  status: CourseStatus
  createdById?: number
  createdAt?: string
  updatedAt?: string
}

/** Question option with the correctness flag (instructor-facing only). */
export interface InstructorQuestionOption {
  id: number
  text: string
  isCorrect: boolean
}

/** Exam question as managed by an instructor. */
export interface InstructorQuestion {
  id: number
  prompt: string
  order: number
  options: InstructorQuestionOption[]
}

/** Full own course with structured content and exam questions. */
export interface InstructorCourseDetail extends InstructorCourse {
  modules: Module[]
  questions: InstructorQuestion[]
}

/** Course returned by the admin moderation queue (owner metadata included). */
export interface AdminCourse extends Course {
  status: CourseStatus
  createdBy: {
    id: number
    nombre: string
    apellidos: string
    correo: string
  }
}

// --- Instructor + admin request payloads ---

export interface CourseInput {
  title: string
  description: string
  minutes: number
  image: string
  passThreshold?: number
  slug?: string
}

export interface ModuleInput {
  title: string
  description?: string
  order: number
}

export interface LessonInput {
  title: string
  content: string
  order: number
  durationMinutes?: number | null
}

export interface QuestionOptionInput {
  text: string
  isCorrect: boolean
}

export interface QuestionInput {
  prompt: string
  order: number
  options: QuestionOptionInput[]
}

// --- Instructor + admin response envelopes ---

export interface InstructorCoursesResponse {
  courses: InstructorCourse[]
}

export interface InstructorCourseResponse {
  course: InstructorCourseDetail
}

export interface ModuleResponse {
  module: Module
}

export interface LessonResponse {
  lesson: Lesson
}

export interface InstructorQuestionResponse {
  question: InstructorQuestion
}

export interface CourseStatusResponse {
  course: { id: number; status: CourseStatus }
}

export interface InstructorApplicationResponse {
  application: { id: number; status: ApplicationStatus; createdAt: string }
}

export interface InstructorApplicationsResponse {
  applications: InstructorApplication[]
}

export interface AdminCoursesResponse {
  courses: AdminCourse[]
}

export interface AdminUsersResponse {
  users: User[]
}
