import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui/Spinner'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { Dashboard } from '@/pages/Dashboard'
import { WorkoutNew } from '@/pages/WorkoutNew'
import { WorkoutActive } from '@/pages/WorkoutActive'
import { WorkoutDetail } from '@/pages/WorkoutDetail'
import { WorkoutShare } from '@/pages/WorkoutShare'
import { History } from '@/pages/History'
import { Exercises } from '@/pages/Exercises'
import { Templates } from '@/pages/Templates'
import { Profile } from '@/pages/Profile'

const Progress = lazy(() =>
  import('@/pages/Progress').then((m) => ({ default: m.Progress })),
)

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
      <div className="flex min-h-screen items-center justify-center">
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
      <Route
        path="/progress"
        element={
          <Protected>
            <Suspense fallback={<PageFallback />}>
              <Progress />
            </Suspense>
          </Protected>
        }
      />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
