import { useEffect, useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import type { Task, Resource } from '../types/types'
import {
  DESCRIPTION_MAX_LENGTH,
  getLiveValidationError,
  normalizeValidatedValue,
  validateDescription,
  validateTitle,
} from '../utils/validation'

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [resources, setResources] = useState<Resource[]>([])
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
  const [searchError, setSearchError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    resource: '',
    details: '',
    status: 'todo',
    priority: '',
    dueDate: '',
  })

  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const { data } = await api.get('/resources?limit=100')
        setResources(Array.isArray(data) ? data : data.data || [])
      } catch (err) {
        console.error('Failed to fetch resources:', err)
      }
    }

    void fetchResources()
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

  const handleSearchChange = (value: string) => {
    const validationError = getLiveValidationError('search', value, 'Search')

    if (validationError) {
      setSearchError(validationError)
      return
    }

    setSearchError(null)
    handleFilterChange('search', value)
  }

  const handleFormChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleValidatedFormChange = (
    key: 'title' | 'details',
    value: string,
    rule: 'title' | 'description',
    label: string,
  ) => {
    const normalizedValue = normalizeValidatedValue(rule, value)
    const validationError = getLiveValidationError(rule, normalizedValue, label)

    if (validationError) {
      setFormError(validationError)
      return
    }

    setFormError(null)
    handleFormChange(key, normalizedValue)
  }

  const handleSubmitTask = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setFormLoading(true)

    try {
      const titleError = validateTitle(formData.title, 'Task title')

      if (titleError) {
        setFormError(titleError)
        setFormLoading(false)
        return
      }

      const detailsError = validateDescription(formData.details, 'Task description', true)

      if (detailsError) {
        setFormError(detailsError)
        setFormLoading(false)
        return
      }

      if (!formData.resource || !formData.priority || !formData.dueDate) {
        setFormError('Resource, priority, and due date are required')
        setFormLoading(false)
        return
      }

      const payload = {
        title: formData.title,
        resource: formData.resource,
        details: formData.details,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate,
      }

      await api.post('/tasks', payload)

      setFormData({
        title: '',
        resource: '',
        details: '',
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
    if (!dateStr) return '—'

    try {
      return new Date(dateStr).toLocaleDateString('en-US')
    } catch {
      return typeof dateStr === 'string' ? dateStr : '—'
    }
  }

  const isTaskOverdue = (dueDate?: string | Date, status?: Task['status']) => {
    if (!dueDate || status === 'done') return false

    const due = new Date(dueDate)

    if (Number.isNaN(due.getTime())) return false

    const endOfDueDate = new Date(due)
    endOfDueDate.setHours(23, 59, 59, 999)

    return endOfDueDate < new Date()
  }

  const getResourceTitle = (resource: Task['resource']) => {
    if (typeof resource === 'string') return resource
    return resource?.title || '—'
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
                  onChange={(e) => handleValidatedFormChange('title', e.target.value, 'title', 'Task title')}
                  placeholder="Task title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resource <span className="form-required">*</span></label>
                <select
                  className="form-control"
                  value={formData.resource}
                  onChange={(e) => handleFormChange('resource', e.target.value)}
                >
                  <option value="">Select a resource</option>
                  {resources.map((resource) => (
                    <option key={resource._id} value={resource._id}>{resource.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group form-group--full">
                <label className="form-label">Description <span className="form-required">*</span></label>
                <input
                  className="form-control"
                  type="text"
                  value={formData.details}
                  onChange={(e) => handleValidatedFormChange('details', e.target.value, 'description', 'Task description')}
                  placeholder="Description of task"
                  maxLength={DESCRIPTION_MAX_LENGTH}
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
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by task title or description..."
            className="form-control"
          />
          {searchError && <p className="form-error">{searchError}</p>}
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
                  <th>Resource</th>
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
                      <td><Link className="table-link" to={`/resources/${typeof task.resource === 'object' ? task.resource?._id : task.resource}`}>{getResourceTitle(task.resource)}</Link></td>
                      <td>{task.details}</td>
                      <td>
                        <span className={`status-pill task-status--${task.status}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>{task.priority || '—'}</td>
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
