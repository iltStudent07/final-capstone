import { useState, useEffect } from 'react'
import type { DashboardStats } from '../types/types'
import api from '../services/api'
import { Link } from 'react-router-dom'

function Dashboard() {
    const [data, setData] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard')
        setData(data)
      } catch (err) {
        console.error(err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US')
    } catch {
      return dateStr
    }
  }

  if (loading) return <p className="page-message">Loading dashboard...</p>
  if (error) return <p className="page-message page-message--error">{error}</p>

  const totalTasks = data?.totals?.tasks ?? 0
  const totalResources = data?.totals?.resources ?? 0
  const totalUsers = data?.totals?.users ?? 0
  const recentTasks = data?.recent?.tasks ?? []
  const tasksByStatus = data?.grouped?.tasksByStatus ?? []
  const recentOverdueTasks = recentTasks.filter((task) => new Date(task.dueDate) < new Date()).length

    return (
        <div className="page-shell dashboard-page">
            <div className="page-header">
              <div>
                <h1 className="page-header__title">Dashboard</h1>
              </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-card__label">Total Resources</span>
                  <strong className="stat-card__value">{totalResources}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-card__label">Total Tasks</span>
                  <strong className="stat-card__value">{totalTasks}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-card__label">Total Users</span>
                  <strong className="stat-card__value">{totalUsers}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-card__label">Recent Overdue Tasks</span>
                  <strong className="stat-card__value">{recentOverdueTasks}</strong>
                </div>
            </div>

            <div className="dashboard-grid">
        {/* Tasks by Status section */}
        <section className="panel">
        <h2>Tasks by Status</h2>

        {tasksByStatus.map((item) => {
          const barWidth = totalTasks > 0 ? `${(item.count / totalTasks) * 100}%` : '0%'

          return (
            <div key={item.status} className="status-row">
              <div className="status-row__label">{item.status}</div>

              <div className="status-row__track">
                <div
                  className={`status-row__fill status-row__fill--${item.statusKey}`}
                  style={{ width: barWidth }}
                />
              </div>

              <div className="status-row__count">{item.count}</div>
            </div>
          )
        })}  
        </section>
        {/* Recent Tasks section*/}
        <section className="panel">
            <h2>Recent Tasks</h2>
            <div className="table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <tr key={task._id}>
                      <td><Link className="table-link" to={`/tasks/${task._id}`}>{task.title}</Link></td>
                      <td>{task.project?.title ?? '—'}</td>
                      <td>
                        <span className={`status-pill task-status--${task.status.toLowerCase().replace(/[^a-z0-9-]/g, '')}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>{formatDate(task.dueDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>No recent tasks found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard