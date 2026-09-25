import { useCallback, useEffect, useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import api from '../services/api'
import type { Project, User } from '../types/types'
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

function Projects() {
  const { user } = useAuth()
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
  const [searchError, setSearchError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const [assigneeOptions, setAssigneeOptions] = useState<Array<{ _id: string; name: string; email: string }>>([])

  const fetchProjects = useCallback(async (page: number) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      })

      const response = await api.get(`/projects?${params}`)
      const projectsData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || [])
      const paginationData = response.data?.pagination || {
        page,
        limit: 10,
        total: Array.isArray(response.data) ? response.data.length : projectsData.length,
        totalPages: 1,
      }

      setProjects(projectsData)
      setPagination(paginationData)
    } catch (err) {
      setError('Failed to load projects')
      console.error('Error loading projects:', err)
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.search])

  const fetchAssigneeOptions = useCallback(async () => {
    try {
      const response = await api.get('/users')
      const users = Array.isArray(response.data) ? response.data : []
      setAssigneeOptions(users)
    } catch (err) {
      console.error('Failed to load users for assignee dropdown:', err)
      setAssigneeOptions([])
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAssigneeOptions()
  }, [fetchAssigneeOptions])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProjects(pagination.page)
  }, [fetchProjects, pagination.page])

  const handleFilterChange = (key: 'status' | 'search', value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
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
    key: 'title' | 'description',
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

  const isValidObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value.trim())

  const handleSubmitProject = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setFormLoading(true)

    try {
      const titleError = validateTitle(formData.title, 'Project title')

      if (titleError) {
        setFormError(titleError)
        setFormLoading(false)
        return
      }

      const descriptionError = validateDescription(formData.description, 'Project description', true)

      if (descriptionError) {
        setFormError(descriptionError)
        setFormLoading(false)
        return
      }

      if (formData.assignee && !isValidObjectId(formData.assignee)) {
        setFormError('Assignee must be a valid User ID or leave it blank')
        setFormLoading(false)
        return
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        ...(formData.assignee && isValidObjectId(formData.assignee) && { assignee: formData.assignee }),
      }

      await api.post('/projects', payload)

      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignee: '',
      })
      setShowForm(false)

      if (pagination.page === 1) {
        await fetchProjects(1)
      } else {
        setPagination((prev) => ({ ...prev, page: 1 }))
      }
    } catch (err: unknown) {
      const apiError = err as {
        response?: {
          data?: {
            message?: string
            errors?: Array<{ msg?: string }>
          }
        }
      }

      const validationMessage = apiError.response?.data?.errors?.[0]?.msg
      setFormError(validationMessage || apiError.response?.data?.message || 'Failed to create project')
      console.error('Error creating project:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return
    }

    try {
      await api.delete(`/projects/${projectId}`)

      const nextPage = projects.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page

      if (nextPage === pagination.page) {
        await fetchProjects(nextPage)
      } else {
        setPagination((prev) => ({ ...prev, page: nextPage }))
      }
    } catch (err) {
      setError('Failed to delete project')
      console.error('Error deleting project:', err)
    }
  }

  const getResourceCount = (project: Project) => project.resources?.length ?? 0

  const getAssigneeName = (assignee?: string | User | null) => {
    if (!assignee) return '—'
    if (typeof assignee === 'string') return assignee
    return assignee.name || assignee.email || '—'
  }

  return (
    <div className="page-shell project-page">
      <div className="page-header">
        <h1 className="page-header__title">Projects</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="app-button page-header__action"
          >
            {showForm ? 'Cancel' : 'New Project'}
          </button>
        )}
      </div>

      {user?.role === 'admin' && showForm && (
        <div className="panel form-card">
          <h2>Create New Project</h2>
          <form onSubmit={handleSubmitProject}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Title <span>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleValidatedFormChange('title', e.target.value, 'title', 'Project title')}
                  placeholder="Project title"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select
                  value={formData.assignee}
                  onChange={(e) => handleFormChange('assignee', e.target.value)}
                  className="form-control"
                >
                  <option value="">Select a team member</option>
                  {assigneeOptions.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group form-group--full">
                <label className="form-label">
                  Description <span>*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleValidatedFormChange('description', e.target.value, 'description', 'Project description')}
                  placeholder="Project description"
                  className="form-control"
                  maxLength={DESCRIPTION_MAX_LENGTH}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  className="form-control"
                >
                  <option value="todo">Todo</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                  className="form-control"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {formError && <p className="form-error">{formError}</p>}

            <button
              type="submit"
              disabled={formLoading}
              className="app-button app-button--primary"
            >
              {formLoading ? 'Creating...' : 'Create Project'}
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
            placeholder="Search by project title or description..."
            className="form-control"
          />
          {searchError && <p className="form-error">{searchError}</p>}
        </div>

        <div className="filter-group filter-group--narrow">
          <label className="form-label">Status Filter</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="form-control"
          >
            <option value="">All Statuses</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {error && <p>{error}</p>}

      {loading ? (
        <p className="page-message">Loading projects...</p>
      ) : (
        <>
          <div className="table-wrap panel">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Resources</th>
                  <th>Assignee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <tr key={project._id}>
                      <td>
                        <Link className="table-link" to={`/projects/${project._id}`}>
                          {project.title}
                        </Link>
                      </td>
                      <td>{project.description}</td>
                      <td>
                        <span className={`status-pill project-status--${project.status}`}>
                          {project.status}
                        </span>
                      </td>
                      <td>{project.priority}</td>
                      <td>{getResourceCount(project)}</td>
                      <td>{getAssigneeName(project.assignee)}</td>
                      <td>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => void handleDelete(project._id)}
                            className="app-button app-button--danger"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar panel panel--soft">
            <div className="pagination-info">
              Showing {projects.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} projects
            </div>

            <div className="pagination-controls">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
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
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
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

export default Projects
