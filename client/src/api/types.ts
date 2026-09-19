// ============================================================
// Velvet Health — API data shapes (mirrors docs/api-contract.md)
// ============================================================

/** Full user profile as returned by `POST /api/auth/register`. */
export interface User {
  id: number
  nombre: string
  apellidos: string
  profesion: string | null
  edad: number | null
  correo: string
  createdAt: string
}

/** Reduced user shape returned by `POST /api/auth/login` and `GET /api/auth/me`. */
export type AuthUser = Pick<User, 'id' | 'nombre' | 'correo'>

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

export interface CourseDetail extends Course {
  instructions: string[]
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

export interface CoursesResponse {
  courses: Course[]
}

export interface CourseResponse {
  course: CourseDetail
}

export interface ExamResponse {
  exam: Exam
}

export interface ResultsResponse {
  results: ExamResult[]
}
