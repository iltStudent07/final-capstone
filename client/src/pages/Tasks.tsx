import { useEffect, useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import type { Task, Project } from '../types/types'

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const [filters, setFilters] = useState({
    status: '',
    search: '',
  })

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    project: '',
    description: '',
    status: 'todo',
    priority: '',
    dueDate: '',
  })

  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await api.get('/projects?limit=100')
        setProjects(data.data || [])
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      }
    }

    void fetchProjects()
  }, [])

  const fetchTasks = async (page = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      })

      const response = await api.get(`/tasks?${params}`)
      const tasksData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || [])
      const paginationData = response.data?.pagination || {
        page,
        limit: 10,
        total: Array.isArray(response.data) ? response.data.length : tasksData.length,
        totalPages: 1,
      }

      setTasks(tasksData)
      setPagination(paginationData)
    } catch (err) {
      setError('Failed to load tasks')
      console.error('Error loading tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTasks(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleFilterChange = (key: 'status' | 'search', value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleFormChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmitTask = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setFormLoading(true)

    try {
      if (!formData.title || !formData.project || !formData.description || !formData.priority || !formData.dueDate) {
        setFormError('Title, project, description, priority and due date are required')
        setFormLoading(false)
        return
      }

      const payload = {
        title: formData.title,
        project: formData.project,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate,
      }

      await api.post('/tasks', payload)

      setFormData({
        title: '',
        project: '',
        description: '',
        status: 'todo',
        priority: '',
        dueDate: '',
      })
      setShowForm(false)

      await fetchTasks(1)
    } catch (err) {
      setFormError('Failed to create task')
      console.error(err)
    } finally {
      setFormLoading(false)
    }
  }

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) {
      return '—'
    }

    try {
      return new Date(dateStr).toLocaleDateString('en-US')
    } catch {
      return String(dateStr)
    }
  }

  const getProjectTitle = (project: Task['project']) => {
    if (typeof project === 'string') return project
    return project?.title || '—'
  }

  return (
    <div className="page-shell task-page">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Tasks</h1>
        </div>
        <button className="app-button app-button--primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Task'}
        </button>
      </div>

      {showForm && (
        <div className="panel form-card">
          <h2>Create New Task</h2>
          <form onSubmit={handleSubmitTask}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Title <span className="form-required">*</span></label>
                <input
                  className="form-control"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="Task title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project <span className="form-required">*</span></label>
                <select
                  className="form-control"
                  value={formData.project}
                  onChange={(e) => handleFormChange('project', e.target.value)}
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>{project.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group form-group--full">
                <label className="form-label">Description <span className="form-required">*</span></label>
                <input
                  className="form-control"
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Description of task"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                >
                  <option value="todo">Todo</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority <span className="form-required">*</span></label>
                <select
                  className="form-control"
                  value={formData.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                >
                  <option value="">Select priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date <span className="form-required">*</span></label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleFormChange('dueDate', e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            {formError && <p className="form-error">{formError}</p>}

            <button
              type="submit"
              disabled={formLoading}
              className={`app-button ${formLoading ? 'button-disabled' : 'app-button--primary'}`}
            >
              {formLoading ? 'Creating...' : 'Create Task'}
            </button>
          </form>
        </div>
      )}

      <div className="filter-row panel panel--soft">
        <div className="filter-group">
          <label className="form-label">Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by task title or description..."
            className="form-control"
          />
        </div>

        <div className="filter-group filter-group--narrow">
          <label className="form-label">Status Filter</label>
          <select
            className="form-control"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {error && <p className="page-message page-message--error">{error}</p>}

      {loading ? (
        <p className="page-message">Loading tasks...</p>
      ) : (
        <>
          <div className="table-wrap panel">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task._id}>
                      <td><Link className="table-link" to={`/tasks/${task._id}`}>{task.title}</Link></td>
                      <td>{getProjectTitle(task.project)}</td>
                      <td>{task.description}</td>
                      <td>
                        <span className={`status-pill task-status--${task.status}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>{task.priority || '—'}</td>
                      <td>{formatDate(task.dueDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      No tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar panel panel--soft">
            <div className="pagination-info">
              Showing {tasks.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
            </div>

            <div className="pagination-controls">
              <button
                onClick={() => void fetchTasks(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="app-button"
              >
                Previous
              </button>

              <div className="pagination-controls__page">
                <span>
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
              </div>

              <button
                onClick={() => void fetchTasks(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="app-button"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Tasks
