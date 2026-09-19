// Instructor endpoints — course/module/lesson/question CRUD, publish request,
// and the canonical instructor application (multipart). All routes require the
// bearer token; the server enforces INSTRUCTOR/ADMIN (and the STUDENT carve-out
// for the application endpoint).

import { apiFetch, apiUpload } from './client'
import type {
  ApplicationStatus,
  CourseInput,
  CourseStatus,
  CourseStatusResponse,
  InstructorCourse,
  InstructorCourseDetail,
  InstructorCourseResponse,
  InstructorCoursesResponse,
  InstructorQuestion,
  InstructorQuestionResponse,
  Lesson,
  LessonInput,
  LessonResponse,
  Module,
  ModuleInput,
  ModuleResponse,
  QuestionInput,
} from './types'

// ---- Courses ----

export async function listMyCourses(): Promise<InstructorCourse[]> {
  const data = await apiFetch<InstructorCoursesResponse>('/instructor/courses', {
    auth: true,
  })
  return data.courses
}

export async function getMyCourse(id: number): Promise<InstructorCourseDetail> {
  const data = await apiFetch<InstructorCourseResponse>(
    `/instructor/courses/${id}`,
    { auth: true },
  )
  return data.course
}

export async function createCourse(
  input: CourseInput,
): Promise<InstructorCourse> {
  const data = await apiFetch<{ course: InstructorCourse }>(
    '/instructor/courses',
    { method: 'POST', body: input, auth: true },
  )
  return data.course
}

export async function updateCourse(
  id: number,
  input: Partial<CourseInput>,
): Promise<InstructorCourse> {
  const data = await apiFetch<{ course: InstructorCourse }>(
    `/instructor/courses/${id}`,
    { method: 'PUT', body: input, auth: true },
  )
  return data.course
}

export async function deleteCourse(id: number): Promise<void> {
  await apiFetch<void>(`/instructor/courses/${id}`, {
    method: 'DELETE',
    auth: true,
  })
}

// ---- Modules ----

export async function createModule(
  courseId: number,
  input: ModuleInput,
): Promise<Module> {
  const data = await apiFetch<ModuleResponse>(
    `/instructor/courses/${courseId}/modules`,
    { method: 'POST', body: input, auth: true },
  )
  return data.module
}

export async function updateModule(
  courseId: number,
  moduleId: number,
  input: Partial<ModuleInput>,
): Promise<Module> {
  const data = await apiFetch<ModuleResponse>(
    `/instructor/courses/${courseId}/modules/${moduleId}`,
    { method: 'PUT', body: input, auth: true },
  )
  return data.module
}

export async function deleteModule(
  courseId: number,
  moduleId: number,
): Promise<void> {
  await apiFetch<void>(`/instructor/courses/${courseId}/modules/${moduleId}`, {
    method: 'DELETE',
    auth: true,
  })
}

// ---- Lessons ----

export async function createLesson(
  courseId: number,
  moduleId: number,
  input: LessonInput,
): Promise<Lesson> {
  const data = await apiFetch<LessonResponse>(
    `/instructor/courses/${courseId}/modules/${moduleId}/lessons`,
    { method: 'POST', body: input, auth: true },
  )
  return data.lesson
}

export async function updateLesson(
  courseId: number,
  moduleId: number,
  lessonId: number,
  input: Partial<LessonInput>,
): Promise<Lesson> {
  const data = await apiFetch<LessonResponse>(
    `/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    { method: 'PUT', body: input, auth: true },
  )
  return data.lesson
}

export async function deleteLesson(
  courseId: number,
  moduleId: number,
  lessonId: number,
): Promise<void> {
  await apiFetch<void>(
    `/instructor/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    { method: 'DELETE', auth: true },
  )
}

// ---- Questions ----

export async function createQuestion(
  courseId: number,
  input: QuestionInput,
): Promise<InstructorQuestion> {
  const data = await apiFetch<InstructorQuestionResponse>(
    `/instructor/courses/${courseId}/questions`,
    { method: 'POST', body: input, auth: true },
  )
  return data.question
}

export async function updateQuestion(
  courseId: number,
  questionId: number,
  input: QuestionInput,
): Promise<InstructorQuestion> {
  const data = await apiFetch<InstructorQuestionResponse>(
    `/instructor/courses/${courseId}/questions/${questionId}`,
    { method: 'PUT', body: input, auth: true },
  )
  return data.question
}

export async function deleteQuestion(
  courseId: number,
  questionId: number,
): Promise<void> {
  await apiFetch<void>(`/instructor/courses/${courseId}/questions/${questionId}`, {
    method: 'DELETE',
    auth: true,
  })
}

// ---- Publish request ----

export async function submitCourseForReview(
  courseId: number,
): Promise<{ id: number; status: CourseStatus }> {
  const data = await apiFetch<CourseStatusResponse>(
    `/instructor/courses/${courseId}/submit`,
    { method: 'POST', auth: true },
  )
  return data.course
}

// ---- Instructor application (multipart) ----

export async function submitInstructorApplication(
  formData: FormData,
): Promise<{ id: number; status: ApplicationStatus; createdAt: string }> {
  const data = await apiUpload<{
    application: { id: number; status: ApplicationStatus; createdAt: string }
  }>('/instructor/applications', formData)
  return data.application
}
