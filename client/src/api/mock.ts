// ============================================================
// Mock / fallback data layer.
//
// The backend is not live yet, so every API function falls back
// to these in-memory values when the HTTP layer raises a
// NetworkError. All shapes match docs/api-contract.md exactly.
//
// IMPORTANT: exam answer keys live HERE (server-side grading is
// out of scope for the client). The exam payload delivered to the
// UI never contains an `isCorrect` flag, as the contract requires.
// ============================================================

import type {
  Answer,
  AuthUser,
  Course,
  CourseDetail,
  Exam,
  ExamResult,
  ExamSubmitResult,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  User,
} from './types'

const MOCK_USER_KEY = 'velvet.mock-user'
const MOCK_RESULTS_KEY = 'velvet.mock-results'

// ------------------------------------------------------------
// Courses
// ------------------------------------------------------------

export const mockCourses: Course[] = [
  {
    id: 1,
    slug: 'rcp',
    title: 'Reanimación Cardiopulmonar',
    description:
      'Aprende a aplicar compresiones torácicas para mantener el flujo de oxígeno al cerebro ante un paro cardíaco o respiratorio.',
    minutes: 20,
    image: 'reanimacion.png',
    passThreshold: 70,
  },
  {
    id: 2,
    slug: 'hemorragias',
    title: 'Hemorragias Externas',
    description:
      'Domina la técnica del torniquete para detener sangrados externos severos en brazos y piernas mientras llega la ayuda médica.',
    minutes: 60,
    image: 'hemorragia.png',
    passThreshold: 70,
  },
  {
    id: 3,
    slug: 'heimlich',
    title: 'Maniobra de Heimlich',
    description:
      'Expulsa objetos que obstruyen las vías respiratorias mediante compresiones abdominales en adultos y bebés.',
    minutes: 15,
    image: 'heimich.png',
    passThreshold: 70,
  },
]

const instructionsBySlug: Record<string, string[]> = {
  rcp: [
    'Revisa si responde: sacúdelo y pregúntale: "¿Estás bien?"',
    'Si no responde, llama al 911.',
    'Verifica si respira; si no respira o jadea, comienza RCP.',
    'Haz compresiones torácicas: manos en el centro del pecho.',
    'Presiona fuerte y rápido: 100-120 veces por minuto.',
    'Profundidad: 5 cm aproximadamente.',
    'Agrega respiraciones (si sabes): 30 compresiones + 2 respiraciones boca a boca.',
    'Solo realiza respiraciones si tienes protección y entrenamiento.',
    'Sigue hasta que llegue ayuda o se use un DEA.',
  ],
  hemorragias: [
    'Ubica la herida (solo se aplica en brazos o piernas).',
    'Coloca el torniquete de 5 a 10 cm por encima de la herida.',
    'Nunca sobre una articulación (ni en codo ni rodilla).',
    'Si no puedes ver la herida, colócalo lo más alto posible en el miembro.',
    'Envuelve firmemente con la venda ancha o paño.',
    'Debe estar apretado, pero sin cortar completamente la piel.',
    'Inserta el objeto para hacer torsión (palito, bolígrafo, etc.).',
    'Mételo entre el nudo o bajo la venda.',
    'Gira hasta detener el sangrado por completo.',
    'Fija la palanca: asegura el objeto girado para que no se suelte.',
    'Anota la hora exacta de colocación; no debe estar más de 2 horas.',
  ],
  heimlich: [
    'Ponte detrás de la persona.',
    'Rodea su cintura con ambos brazos.',
    'Coloca un puño cerrado justo por encima del ombligo, pero debajo del esternón.',
    'Sujeta el puño con la otra mano.',
    'Realiza compresiones hacia adentro y hacia arriba (movimiento de "J").',
    'Repite de 5 a 10 veces hasta que expulse el objeto o pierda el conocimiento.',
    'En bebés (menores de 1 año): coloca al bebé boca abajo sobre tu antebrazo.',
    'Da 5 golpes entre los omóplatos con el talón de la mano.',
    'Gíralo boca arriba y da 5 compresiones torácicas con dos dedos.',
    'Repite hasta que expulse el objeto o llegue ayuda.',
  ],
}

export const mockCourseDetails: Record<string, CourseDetail> = {
  rcp: { ...mockCourses[0], instructions: instructionsBySlug.rcp },
  hemorragias: { ...mockCourses[1], instructions: instructionsBySlug.hemorragias },
  heimlich: { ...mockCourses[2], instructions: instructionsBySlug.heimlich },
}

// ------------------------------------------------------------
// Exams (questions never carry a correct-answer flag)
// ------------------------------------------------------------

const mockExams: Record<string, Exam> = {
  rcp: {
    courseId: 1,
    questions: [
      {
        id: 1,
        prompt: '¿Cuál es el primer paso al atender a una persona que no responde?',
        options: [
          { id: 1, text: 'Verificar si responde y respira' },
          { id: 2, text: 'Darle agua de inmediato' },
          { id: 3, text: 'Moverla de lugar' },
          { id: 4, text: 'Esperar sin hacer nada' },
        ],
      },
      {
        id: 2,
        prompt: '¿A qué ritmo se deben aplicar las compresiones torácicas?',
        options: [
          { id: 1, text: '30-50 por minuto' },
          { id: 2, text: '100-120 por minuto' },
          { id: 3, text: '10-20 por minuto' },
          { id: 4, text: '200 por minuto' },
        ],
      },
      {
        id: 3,
        prompt: '¿Cuál es la profundidad aproximada de cada compresión en un adulto?',
        options: [
          { id: 1, text: '1 cm' },
          { id: 2, text: '10 cm' },
          { id: 3, text: '5 cm' },
          { id: 4, text: '20 cm' },
        ],
      },
      {
        id: 4,
        prompt: '¿Cuál es la relación correcta entre compresiones y respiraciones?',
        options: [
          { id: 1, text: '30 compresiones y 2 respiraciones' },
          { id: 2, text: '5 compresiones y 5 respiraciones' },
          { id: 3, text: '15 compresiones y 4 respiraciones' },
          { id: 4, text: '100 compresiones y 10 respiraciones' },
        ],
      },
      {
        id: 5,
        prompt: '¿Hasta cuándo debes continuar con la RCP?',
        options: [
          { id: 1, text: 'Solo durante 2 minutos' },
          { id: 2, text: 'Hasta que llegue ayuda o se use un DEA' },
          { id: 3, text: 'Hasta que la persona se mueva un poco' },
          { id: 4, text: 'Nunca más de 1 minuto' },
        ],
      },
    ],
  },
  hemorragias: {
    courseId: 2,
    questions: [
      {
        id: 1,
        prompt: '¿En qué partes del cuerpo se aplica el torniquete?',
        options: [
          { id: 1, text: 'Solo en brazos o piernas' },
          { id: 2, text: 'En cualquier parte del cuerpo' },
          { id: 3, text: 'Solo en el cuello' },
          { id: 4, text: 'En el abdomen' },
        ],
      },
      {
        id: 2,
        prompt: '¿A qué distancia de la herida se coloca el torniquete?',
        options: [
          { id: 1, text: 'Directamente sobre la herida' },
          { id: 2, text: 'De 5 a 10 cm por encima de la herida' },
          { id: 3, text: '20 cm por debajo' },
          { id: 4, text: 'No importa la distancia' },
        ],
      },
      {
        id: 3,
        prompt: '¿Dónde NO debe colocarse un torniquete?',
        options: [
          { id: 1, text: 'Sobre la piel desnuda' },
          { id: 2, text: 'Sobre una articulación (codo o rodilla)' },
          { id: 3, text: 'En la pierna' },
          { id: 4, text: 'Sobre la venda' },
        ],
      },
      {
        id: 4,
        prompt: '¿Qué se utiliza para hacer la torsión del torniquete?',
        options: [
          { id: 1, text: 'La mano desnuda' },
          { id: 2, text: 'Nada, se aprieta solo' },
          { id: 3, text: 'Un objeto rígido (palito, bolígrafo)' },
          { id: 4, text: 'Una cuerda muy delgada' },
        ],
      },
      {
        id: 5,
        prompt: '¿Cuál es el tiempo máximo recomendado con el torniquete puesto?',
        options: [
          { id: 1, text: '24 horas' },
          { id: 2, text: '30 minutos' },
          { id: 3, text: 'No hay límite' },
          { id: 4, text: '2 horas' },
        ],
      },
    ],
  },
  heimlich: {
    courseId: 3,
    questions: [
      {
        id: 1,
        prompt: '¿Cuándo se aplica la maniobra de Heimlich?',
        options: [
          { id: 1, text: 'Cuando la persona no puede respirar por atragantamiento' },
          { id: 2, text: 'Cuando tiene fiebre alta' },
          { id: 3, text: 'Cuando se desmaya' },
          { id: 4, text: 'Cuando tiene una fractura' },
        ],
      },
      {
        id: 2,
        prompt: '¿Dónde se coloca el puño al realizar la maniobra en un adulto?',
        options: [
          { id: 1, text: 'En el centro del pecho' },
          { id: 2, text: 'Por encima del ombligo y debajo del esternón' },
          { id: 3, text: 'En la espalda baja' },
          { id: 4, text: 'Sobre el ombligo' },
        ],
      },
      {
        id: 3,
        prompt: '¿En qué dirección se realizan las compresiones?',
        options: [
          { id: 1, text: 'Hacia abajo solamente' },
          { id: 2, text: 'Hacia los lados' },
          { id: 3, text: 'Hacia adentro y hacia arriba' },
          { id: 4, text: 'En círculos' },
        ],
      },
      {
        id: 4,
        prompt: 'En un bebé menor de 1 año, ¿cuántos golpes se dan entre los omóplatos?',
        options: [
          { id: 1, text: '2' },
          { id: 2, text: '10' },
          { id: 3, text: '5' },
          { id: 4, text: '20' },
        ],
      },
      {
        id: 5,
        prompt: '¿Cuántas veces se repite la maniobra en un adulto?',
        options: [
          { id: 1, text: 'Una sola vez' },
          { id: 2, text: 'De 5 a 10 veces hasta expulsar el objeto' },
          { id: 3, text: 'Exactamente tres veces' },
          { id: 4, text: 'Hasta 100 veces' },
        ],
      },
    ],
  },
}

// Correct answers (mock grading only — never sent to the client).
const answerKeys: Record<string, Record<number, number>> = {
  rcp: { 1: 1, 2: 2, 3: 3, 4: 1, 5: 2 },
  hemorragias: { 1: 1, 2: 2, 3: 2, 4: 3, 5: 4 },
  heimlich: { 1: 1, 2: 2, 3: 3, 4: 3, 5: 2 },
}

// ------------------------------------------------------------
// Storage helpers (localStorage-backed mock session/results)
// ------------------------------------------------------------

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(MOCK_USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function readStoredResults(): ExamResult[] {
  try {
    const raw = localStorage.getItem(MOCK_RESULTS_KEY)
    return raw ? (JSON.parse(raw) as ExamResult[]) : []
  } catch {
    return []
  }
}

function writeStoredResults(results: ExamResult[]): void {
  localStorage.setItem(MOCK_RESULTS_KEY, JSON.stringify(results))
}

// ------------------------------------------------------------
// Mock endpoint implementations
// ------------------------------------------------------------

export function mockGetCourses(): Course[] {
  return mockCourses
}

export function mockGetCourse(slug: string): CourseDetail | undefined {
  return mockCourseDetails[slug]
}

export function mockGetExam(slug: string): Exam | undefined {
  return mockExams[slug]
}

export function mockSubmitExam(
  slug: string,
  answers: Answer[],
): ExamSubmitResult {
  const exam = mockExams[slug]
  const course = mockCourses.find((c) => c.slug === slug)
  const key = answerKeys[slug] ?? {}

  let correct = 0
  const total = exam.questions.length
  for (const answer of answers) {
    if (key[answer.questionId] === answer.optionId) correct += 1
  }
  const score = total > 0 ? Math.round((correct / total) * 100) : 0
  const passed = score >= (course?.passThreshold ?? 70)

  const resultId = Date.now()
  const result: ExamResult = {
    id: resultId,
    courseId: course?.id ?? 0,
    courseSlug: slug,
    score,
    passed,
    createdAt: new Date().toISOString(),
  }

  const results = readStoredResults()
  writeStoredResults([result, ...results])

  return { score, passed, resultId }
}

export function mockLogin(payload: LoginPayload): LoginResponse {
  const nombre = deriveName(payload.correo)
  const user: AuthUser = { id: 1, nombre, correo: payload.correo }
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user))
  return { token: 'mock-token', user }
}

export function mockRegister(payload: RegisterPayload): User {
  return {
    id: Date.now(),
    nombre: payload.nombre,
    apellidos: payload.apellidos,
    profesion: payload.profesion,
    edad: payload.edad,
    correo: payload.correo,
    createdAt: new Date().toISOString(),
  }
}

export function mockGetMe(): AuthUser {
  return (
    readStoredUser() ?? {
      id: 1,
      nombre: 'Usuario Demo',
      correo: 'demo@velvet.health',
    }
  )
}

export function mockGetResults(): ExamResult[] {
  return readStoredResults()
}

function deriveName(correo: string): string {
  const raw = correo.split('@')[0] ?? 'Usuario'
  const capitalized = raw
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
  return capitalized || 'Usuario'
}
