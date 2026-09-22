import { AuthProvider } from './context/AuthProvider'
//import ProtectedRoute from './components/ProtectedRoute'
import { /*Navigate,*/ Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Navbar from './components/Navbar'
import './App.css'
{/* */}
function App() {


  return (
    <>
      <AuthProvider>
        <main>
          <Navbar />
          <Routes>
            {/*<Route path="/" element={<ProtectedRoute />}>*/}
              {/*<Route index element={<Navigate to='/dashboard' replace />} />*/}
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/tasks" element={<Tasks />} />
            {/*</Route>*/}
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </AuthProvider>
    </>
  )
}

export default App