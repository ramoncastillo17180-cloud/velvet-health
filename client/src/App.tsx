import { AnimatePresence } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminApplications } from './pages/AdminApplications'
import { AdminCourses } from './pages/AdminCourses'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminUsers } from './pages/AdminUsers'
import { CourseDetail } from './pages/CourseDetail'
import { CourseEditor } from './pages/CourseEditor'
import { Exam } from './pages/Exam'
import { ForgotPassword } from './pages/ForgotPassword'
import { InstructorApplication } from './pages/InstructorApplication'
import { InstructorDashboard } from './pages/InstructorDashboard'
import { Landing } from './pages/Landing'
import { LessonPlayer } from './pages/LessonPlayer'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { Perfil } from './pages/Perfil'
import { Practicas } from './pages/Practicas'
import { Registro } from './pages/Registro'
import { ResetPassword } from './pages/ResetPassword'
import { StudentDashboard } from './pages/StudentDashboard'
import { ProtectedRoute } from './routes/ProtectedRoute'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/practicas" element={<Practicas />} />
        <Route path="/cursos/:slug" element={<CourseDetail />} />
        <Route path="/cursos/:slug/aprender" element={<LessonPlayer />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
        <Route path="/restablecer-contrasena" element={<ResetPassword />} />

        {/* Any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/cursos/:slug/examen" element={<Exam />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        {/* Student */}
        <Route element={<ProtectedRoute roles={['STUDENT']} />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/aplicar-instructor" element={<InstructorApplication />} />
        </Route>

        {/* Instructor */}
        <Route element={<ProtectedRoute roles={['INSTRUCTOR']} />}>
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/instructor/cursos/nuevo" element={<CourseEditor />} />
          <Route path="/instructor/cursos/:id/editar" element={<CourseEditor />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/solicitudes" element={<AdminApplications />} />
          <Route path="/admin/cursos" element={<AdminCourses />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <Layout>
      <AnimatedRoutes />
    </Layout>
  )
}
