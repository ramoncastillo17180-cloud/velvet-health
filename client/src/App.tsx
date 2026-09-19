import { AnimatePresence } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CourseDetail } from './pages/CourseDetail'
import { Exam } from './pages/Exam'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { Perfil } from './pages/Perfil'
import { Practicas } from './pages/Practicas'
import { Registro } from './pages/Registro'
import { ProtectedRoute } from './routes/ProtectedRoute'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/practicas" element={<Practicas />} />
        <Route path="/cursos/:slug" element={<CourseDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

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
