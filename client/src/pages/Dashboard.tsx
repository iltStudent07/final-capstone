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

  const isTaskOverdue = (dueDate: string, status: string) => {
    if (!dueDate || status === 'done') return false

    const due = new Date(dueDate)

    if (Number.isNaN(due.getTime())) return false

    const endOfDueDate = new Date(due)
    endOfDueDate.setHours(23, 59, 59, 999)

    return endOfDueDate < new Date()
  }

  if (loading) return <p className="page-message">Loading dashboard...</p>
  if (error) return <p className="page-message page-message--error">{error}</p>

  const totalTasks = data?.totals?.tasks ?? 0
  const totalResources = data?.totals?.resources ?? 0
  const totalProjects = data?.totals?.projects ?? 0
  const recentTasks = data?.recent?.tasks ?? []
  const tasksByStatus = data?.grouped?.tasksByStatus ?? []
  const recentOverdueTasks = recentTasks.filter((task) => isTaskOverdue(task.dueDate, task.status)).length

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
                  <span className="stat-card__label">Total Projects</span>
                  <strong className="stat-card__value">{totalProjects}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-card__label"> Overdue Tasks</span>
                  <strong className="stat-card__value">{recentOverdueTasks}</strong>
                </div>
            </div>

            <div className="dashboard-grid">
        {/* Tasks by Status section */}
        <section className="panel">
        <h2>Tasks by Status</h2>

        {tasksByStatus.map((item) => {
          const taskCount = Number(item.count) || 0
          const fillPercent = totalTasks > 0 ? Math.min((taskCount / totalTasks) * 100, 100) : 0
          const barWidth = `${fillPercent}%`

          return (
            <div key={item.status} className="status-row">
              <div>
                <span className={`status-pill task-status--${item.statusKey}`}>
                  {item.status}
                </span>
              </div>

              <div className="status-row__track">
                <div
                  className={`status-row__fill status-row__fill--${item.statusKey}`}
                  style={{ width: barWidth }}
                  title={`${taskCount} of ${totalTasks} tasks`}
                />
              </div>

              <div className={`status-row__count status-row__count--${item.statusKey}`}>{taskCount}</div>
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
                  <th>Resource</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <tr key={task._id}>
                      <td><Link className="table-link" to={`/tasks/${task._id}`}>{task.title}</Link></td>
                      <td><Link className="table-link" to={`/resources/${task.resource?._id}`}>{task.resource?.title ?? '—'}</Link></td>
                      <td>
                        <span className={`status-pill task-status--${task.status.toLowerCase().replace(/[^a-z0-9-]/g, '')}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>
                        <div className="due-date-cell">
                          <span>{formatDate(task.dueDate)}</span>
                          {isTaskOverdue(task.dueDate, task.status) && (
                            <span className="status-pill due-status--overdue">Past Due</span>
                          )}
                        </div>
                      </td>
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