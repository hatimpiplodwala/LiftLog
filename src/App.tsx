import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { Spinner } from '@/components/ui/Spinner'
import { Dashboard } from '@/pages/Dashboard'

const Landing = lazy(() => import('@/pages/Landing').then((m) => ({ default: m.Landing })))
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))
const Signup = lazy(() => import('@/pages/Signup').then((m) => ({ default: m.Signup })))
const WorkoutNew = lazy(() =>
  import('@/pages/WorkoutNew').then((m) => ({ default: m.WorkoutNew })),
)
const WorkoutActive = lazy(() =>
  import('@/pages/WorkoutActive').then((m) => ({ default: m.WorkoutActive })),
)
const WorkoutDetail = lazy(() =>
  import('@/pages/WorkoutDetail').then((m) => ({ default: m.WorkoutDetail })),
)
const WorkoutShare = lazy(() =>
  import('@/pages/WorkoutShare').then((m) => ({ default: m.WorkoutShare })),
)
const History = lazy(() => import('@/pages/History').then((m) => ({ default: m.History })))
const Exercises = lazy(() => import('@/pages/Exercises').then((m) => ({ default: m.Exercises })))
const Templates = lazy(() => import('@/pages/Templates').then((m) => ({ default: m.Templates })))
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })))
const Progress = lazy(() => import('@/pages/Progress').then((m) => ({ default: m.Progress })))

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner />
    </div>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    )
  }
  return user ? <Navigate to="/dashboard" replace /> : <Landing />
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/share/:token" element={<WorkoutShare />} />

        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/workout/new" element={<Protected><WorkoutNew /></Protected>} />
        <Route path="/workout/:id/active" element={<ProtectedRoute><WorkoutActive /></ProtectedRoute>} />
        <Route path="/workout/:id" element={<Protected><WorkoutDetail /></Protected>} />
        <Route path="/history" element={<Protected><History /></Protected>} />
        <Route path="/exercises" element={<Protected><Exercises /></Protected>} />
        <Route path="/templates" element={<Protected><Templates /></Protected>} />
        <Route path="/progress" element={<Protected><Progress /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
