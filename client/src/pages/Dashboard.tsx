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

  if (loading) return <p>Loading dashboard...</p>
  if (error) return <p>{error}</p>

  const defaultTasksByStatus = {
    review: 0,
    inprogress: 0,
    todo: 0,
    done: 0,
  }

  const tasksByStatusCounts = Array.isArray(data?.tasksByStatus)
    ? data.tasksByStatus.reduce(
        (acc, item) => {
          const status = item.status.toLowerCase().replace(/[^a-z0-9]/g, '')

          if (status === 'review') acc.review += item.count
          if (status === 'inprogress') acc.inprogress += item.count
          if (status === 'todo') acc.todo += item.count
          if (status === 'done') acc.done += item.count

          return acc
        },
        { ...defaultTasksByStatus },
      )
    : { ...defaultTasksByStatus, ...(data?.tasksByStatus ?? {}) }

  const tasksByStatus = [
    {
      status: 'Review',
      statusKey: 'review',
      count: tasksByStatusCounts.review,
    },
    {
      status: 'In-Progress',
      statusKey: 'inprogress',
      count: tasksByStatusCounts.inprogress,
    },
    {
      status: 'Todo',
      statusKey: 'todo',
      count: tasksByStatusCounts.todo,
    },
    {
      status: 'Done',
      statusKey: 'done',
      count: tasksByStatusCounts.done,
    },
  ]
  const recentTasks = data?.recentTasks ?? []
  const totalTasks = data?.totalTasks ?? 0

    return (
        <div>
            <h1>Dashboard</h1>
            <div>
                <div>Total Projects: <strong>Placeholder</strong></div>
                <div>Total Tasks: <strong>Placeholder</strong></div>
                <div>Total Users: <strong>Placeholder</strong></div>
                <div>Past Due Tasks: <strong>Placeholder</strong></div>
            </div>
            <div>
        {/* Tasks by Status section */}
        <div>
        <h2>Tasks by Status</h2>

        {tasksByStatus.map((item) => {
          const barWidth = totalTasks > 0 ? `${(item.count / totalTasks) * 100}%` : '0%'

          return (
            <div key={item.status} className="dashboard-status-row">
              <div className={`status-pill dashboard-status-pill dashboard-status--${item.statusKey}`}>{item.status}</div>

              <div className={`dashboard-status-track dashboard-status-track--${item.statusKey}`}>
                <div
                  className={`dashboard-status-fill dashboard-status-fill--${item.statusKey}`}
                  style={{ width: barWidth }}
                />
              </div>

              <div className="dashboard-status-count">{item.count}</div>
            </div>
          )
        })}  
        </div>
        {/* Recent Tasks section*/}
        <div>
            <h2>Recent Tasks</h2>
            <table>
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
                      <td><Link className="claim-link" to={`/claims/${task._id}`}>{task.title}</Link></td>
                      <td>{task.project?.title ?? '—'}</td>

                      <td>{task.status}</td>
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
      </div>
    </div>
  )
}

export default Dashboard