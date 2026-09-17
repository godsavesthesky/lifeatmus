import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { SetupNotice } from '@/components/Setupnotice'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Home } from '@/pages/Home'
import { WeeklyAgenda } from '@/pages/WeeklyAgenda'
import { Events } from '@/pages/Events'
import { EventDetail } from '@/pages/EventDetail'
import { Admin } from '@/pages/Admin'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { Onboarding } from '@/pages/Onboarding'

function App() {
  // Dicek sebelum AuthProvider dipasang, karena AuthProvider langsung
  // memanggil supabase.auth.getSession() begitu mount.
  if (!isSupabaseConfigured) {
    return <SetupNotice />
  }

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <RevokedBanner />
        <OnboardingRedirect />
        <main className="flex-1">
          <Routes>
            {/* Beranda sengaja TIDAK digembok ProtectedRoute (lihat migrasi
                0006): pengunjung yang belum login boleh lihat daftar acara
                dan jumlah pesertanya, tapi tidak nama siapa saja dan tidak
                bisa menekan Ikut — itu ditangani di dalam Home.tsx dan di
                RLS, bukan di sini. Halaman lain (agenda, events, admin)
                tetap butuh login seperti sebelumnya. */}
            <Route path="/" element={<Home />} />
            <Route
              path="/agenda"
              element={
                <ProtectedRoute>
                  <WeeklyAgenda />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id"
              element={
                <ProtectedRoute>
                  <EventDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/daftar" element={<Signup />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

/**
 * Dipasang di atas semua route: begitu ada sesi login yang profilnya belum
 * `onboarded`, paksa ke /onboarding dari halaman manapun dia mendarat
 * (termasuk beranda, yang memang sengaja publik). Ini cuma kenyamanan
 * tampilan — kalau orangnya coba akses data lain langsung lewat API tanpa
 * lewat sini, RLS di database tetap yang menentukan apa yang benar-benar
 * boleh dia baca/ubah, bukan komponen ini.
 */
function OnboardingRedirect() {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading || !session || !profile || profile.onboarded) return null
  if (location.pathname === '/onboarding' || location.pathname === '/login') return null

  return <Navigate to="/onboarding" replace />
}

/**
 * Akses yang dicabut ditegakkan di database, jadi halaman-halamannya akan
 * tampak kosong. Tanpa pita ini orangnya cuma melihat aplikasi yang seperti
 * belum diisi apa-apa dan tidak tahu harus menghubungi siapa.
 */
function RevokedBanner() {
  const { accessRevoked, profile } = useAuth()
  if (!accessRevoked) return null

  return (
    <div role="status" className="border-b border-red-400/40 bg-red-400/10 px-5 py-3 md:px-10">
      <p className="mx-auto max-w-[1400px] text-sm text-red-200">
        Akses akunmu sedang dinonaktifkan admin, jadi data acara tidak bisa ditampilkan.
        {profile?.accessRevokedReason ? ` Alasan: ${profile.accessRevokedReason}.` : ''} Hubungi admin
        kantor kalau menurutmu ini keliru.
      </p>
    </div>
  )
}

export default App