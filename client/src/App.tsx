import { AnimatePresence } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CourseDetail } from './pages/CourseDetail'
import { Exam } from './pages/Exam'
import { ForgotPassword } from './pages/ForgotPassword'
import { Landing } from './pages/Landing'
import { LessonPlayer } from './pages/LessonPlayer'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { Perfil } from './pages/Perfil'
import { Practicas } from './pages/Practicas'
import { Registro } from './pages/Registro'
import { ResetPassword } from './pages/ResetPassword'
import { ProtectedRoute } from './routes/ProtectedRoute'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/practicas" element={<Practicas />} />
        <Route path="/cursos/:slug" element={<CourseDetail />} />
        <Route path="/cursos/:slug/aprender" element={<LessonPlayer />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
        <Route path="/restablecer-contrasena" element={<ResetPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/cursos/:slug/examen" element={<Exam />} />
          <Route path="/perfil" element={<Perfil />} />
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
