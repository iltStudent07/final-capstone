import { AuthProvider } from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import { Navigate, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import ResourceDetail from './pages/ResourceDetail'
import Tasks from './pages/Tasks'
import TaskDetail from './pages/TaskDetail'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import './App.css'

function App() {


  return (
    <>
      <AuthProvider>
        <main>
          <Routes>
            <Route path="/" element={<ProtectedRoute />}>
              <Route index element={<Navigate to='/dashboard' replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/resources/:id" element={<ResourceDetail />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </AuthProvider>
    </>
  )
}

export default App
