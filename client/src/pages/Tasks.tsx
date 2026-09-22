import { useEffect, useState } from 'react'
import api from '../services/api'
import type { Task, Project } from '../types/types'
import { Link } from 'react-router-dom'

interface PaginationData {
    page: number
    limit: number
    total: number
    totalPages: number
}

function Tasks(){

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

  //For new task form
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    project: '',
    description: '',
    status: '',
    priority: '',
    dueDate: '',
  })

  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Fetch projects list for the form dropdown box
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await api.get('/projects?limit=100')
        setProjects(data.data || [])
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      }
    }

    fetchProjects()
  }, [])

   // Fetch tasks when filters change
  useEffect(() => {
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '10',
          ...(filters.status && { status: filters.status }),
          ...(filters.search && { search: filters.search }),
        })

        const response = await api.get(`/tasks?${params}`)
        console.log('Tasks response:', response.data)
        
        // Handle case where response.data is the tasks array directly
        const tasksData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.data || [])
        
        const paginationData = response.data?.pagination || {
          page: 1,
          limit: 10,
          total: Array.isArray(response.data) ? response.data.length : 0,
          totalPages: 1,
        }
        
        console.log('Processed tasks:', tasksData)
        console.log('Pagination:', paginationData)
        
        setTasks(tasksData)
        setPagination(paginationData)
      } catch (err) {
        setError('Failed to load tasks')
        console.error('Error loading tasks:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

    // sets form data when there is a change in value
    const handleFormChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  // Handles submiting form data to the task post api route
  const handleSubmitTask = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormLoading(true)

    try {
      if (!formData.title || !formData.project || !formData.description || !formData.priority ||!formData.dueDate) {
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
        dueDate: formData.dueDate
      }

      await api.post('/tasks', payload)

      setFormData({
        title: '',
        project: '',
        description: '',
        status: '',
        priority: '',
        dueDate: '',
      })
      setShowForm(false)


      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '10',
          ...(filters.status && { status: filters.status }),
          ...(filters.search && { search: filters.search }),
        })

        const response = await api.get(`/tasks?${params}`)
        const tasksData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.data || [])
        const paginationData = response.data?.pagination || {
          page: 1,
          limit: 10,
          total: Array.isArray(response.data) ? response.data.length : 0,
          totalPages: 1,
        }
        setTasks(tasksData)
        setPagination(paginationData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    } catch (err) {
      setFormError('Failed to create task')
      console.error(err)
    } finally {
      setFormLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US')
    } catch {
      return dateStr
    }
  }

    return(
        <div>
            <div>
                <h1>Tasks</h1>
                <button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Task'}</button>
            </div>

            {showForm && (
                <div>
                    <h2>Create New Task</h2>
                    <form onSubmit={handleSubmitTask}>
                        <div>
                            <div>
                                <label>Title</label>
                                <input type="title" value={formData.title}/>

                                <label>Project <span>*</span></label>
                                <select value={formData.project} onChange={(e) => handleFormChange('project', e.target.value)}>
                                    <option value="">Select a project</option>
                                        {projects.map((project) => (
                                    <option key={project._id} value={project._id}>{project.title}</option> ))}
                                </select>  
                            </div>
                            <div>
                                <label className="form-label">
                                    Priority
                                </label>
                
                            </div>

                            <div>
                                <label className="form-label">
                                    Incident Date <span className="form-required">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => handleFormChange('dueDate', e.target.value)}
                                    className="form-control"
                                />
                            </div>

                            <div>
                                <label className="form-label">
                                    Description <span className="form-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => handleFormChange('description', e.target.value)}
                                    placeholder="Description of Task"
                                />
                            </div>
                        </div>

                        {formError && (
                            <p className="form-error">{formError}</p>
                        )}

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
            <div className="filter-row">
        <div className="filter-group">
          <label className="form-label">
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by task title or description..."
            className="form-control"
          />
        </div>

        <div className="filter-group filter-group--narrow">
          <label className="form-label">
            Status Filter
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In-Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>    
          </select>
        </div>
      </div>

      {error && <p>{error}</p>}

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <>
          <div>
            <table>
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
                      <td><Link to={`/tasks/${task._id}`}>{task.title}</Link></td>
                      <td>
                        {typeof task.project === 'string'
                          ? task.project
                          : ((task.project as Record<string, unknown>)?.policyNumber as string) || '—'}
                      </td>
                      <td>{task.description}</td>
                      <td>
                        <span className={`status-pill tasks-status-pill task-status--${task.status}`}>
                          {task.status}
                        </span>
                      </td>
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
          <div>
            <div>
              Showing {tasks.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
            </div>

            <div>
              <button
                onClick={async () => {
                  const newPage = pagination.page - 1
                  setLoading(true)
                  try {
                    const params = new URLSearchParams({
                      page: String(newPage),
                      limit: '10',
                      ...(filters.status && { status: filters.status }),
                      ...(filters.search && { search: filters.search }),
                    })
                    const response = await api.get(`/tasks?${params}`)
                    const tasksData = Array.isArray(response.data) 
                      ? response.data 
                      : (response.data?.data || [])
                    const paginationData = response.data?.pagination || {
                      page: 1,
                      limit: 10,
                      total: Array.isArray(response.data) ? response.data.length : 0,
                      totalPages: 1,
                    }
                    setTasks(tasksData)
                    setPagination(paginationData)
                  } catch (err) {
                    setError('Failed to load tasks')
                    console.error(err)
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={pagination.page === 1}
              >
                Previous
              </button>

              <div>
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>

              <button
                onClick={async () => {
                  const newPage = pagination.page + 1
                  setLoading(true)
                  try {
                    const params = new URLSearchParams({
                      page: String(newPage),
                      limit: '10',
                      ...(filters.status && { status: filters.status }),
                      ...(filters.search && { search: filters.search }),
                    })
                    const response = await api.get(`/tasks?${params}`)
                    const tasksData = Array.isArray(response.data) 
                      ? response.data 
                      : (response.data?.data || [])
                    const paginationData = response.data?.pagination || {
                      page: 1,
                      limit: 10,
                      total: Array.isArray(response.data) ? response.data.length : 0,
                      totalPages: 1,
                    }
                    setTasks(tasksData)
                    setPagination(paginationData)
                  } catch (err) {
                    setError('Failed to load tasks')
                    console.error(err)
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={pagination.page >= pagination.totalPages}>
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