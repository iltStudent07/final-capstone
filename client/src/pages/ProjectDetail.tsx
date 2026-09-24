import { useCallback, useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import api from '../services/api'
import type { Project, Resource, User } from '../types/types'

function ProjectDetail() {
    const { user } = useAuth()
    const { id } = useParams<{id: string}>()
    const nav = useNavigate()
    const [project, setProject] = useState<Project | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [status, setStatus] = useState<string>('')
    const [updating, setUpdating] = useState<boolean>(false)
    const [showResourceForm, setShowResourceForm] = useState<boolean>(false)
    const [resourceActionLoading, setResourceActionLoading] = useState<string | null>(null)
    const [resourceFormData, setResourceFormData] = useState({
        title: '',
        description: '',
        budget: '',
        status: 'planning',
        tags: '',
        owner: '',
        collaborators: [] as string[],
        startDate: '',
        endDate: '',
    })
    const [resourceFormError, setResourceFormError] = useState<string | null>(null)
    const [resourceFormLoading, setResourceFormLoading] = useState<boolean>(false)

    const fetchProject = useCallback(async (showLoading = true) => {
        if (!id) {
            return
        }

        if (showLoading) {
            setLoading(true)
        }

        try {
            const response = await api.get(`/projects/${id}`)
            setProject(response.data)
            setStatus(response.data.status)
        } catch {
            setProject(null)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        if (!id) {
            return
        }

        const timeoutId = window.setTimeout(() => {
            void fetchProject(false)
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [fetchProject, id])

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users')
                setUsers(Array.isArray(response.data) ? response.data : [])
            } catch (error) {
                console.error('Failed to load users', error)
                setUsers([])
            }
        }

        void fetchUsers()
    }, [])

    const handleStatusUpdate = async () => {
        if (!project) return
        setUpdating(true)
        try {
            const response = await api.put(`/projects/${id}`, { status })
            setProject(response.data)
            setStatus(response.data.status)
        } catch (error) {
            console.error('Failed to update status', error)
        } finally {
            setUpdating(false)
        }
    }


    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return
        }
        try {
            await api.delete(`/projects/${id}`)
            nav('/projects')
        } catch (error) {
            console.error('Failed to delete project', error)
        }
    }

    const handleResourceFormChange = (key: keyof typeof resourceFormData, value: string) => {
        setResourceFormData((prev) => ({ ...prev, [key]: value }))
    }

    const handleCollaboratorsChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const selectedCollaborators = Array.from(e.target.selectedOptions, (option) => option.value)
        setResourceFormData((prev) => ({ ...prev, collaborators: selectedCollaborators }))
    }

    const handleSubmitResource = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!id) {
            setResourceFormError('Project ID is missing')
            return
        }

        setResourceFormError(null)
        setResourceFormLoading(true)

        try {
            if (!resourceFormData.title || !resourceFormData.budget || !resourceFormData.startDate || !resourceFormData.endDate) {
                setResourceFormError('Title, budget, sprint start date and sprint end date are required')
                setResourceFormLoading(false)
                return
            }

            const budget = Number(resourceFormData.budget)

            if (Number.isNaN(budget) || budget < 0) {
                setResourceFormError('Budget must be a valid non-negative number')
                setResourceFormLoading(false)
                return
            }

            if (new Date(resourceFormData.endDate) < new Date(resourceFormData.startDate)) {
                setResourceFormError('Sprint end date must be on or after the sprint start date')
                setResourceFormLoading(false)
                return
            }

            const payload = {
                project: id,
                title: resourceFormData.title,
                description: resourceFormData.description,
                budget,
                status: resourceFormData.status,
                ...(resourceFormData.owner && { owner: resourceFormData.owner }),
                tags: resourceFormData.tags
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                collaborators: resourceFormData.collaborators,
                sprintWindow: {
                    startDate: resourceFormData.startDate,
                    endDate: resourceFormData.endDate,
                },
            }

            await api.post('/resources', payload)

            setResourceFormData({
                title: '',
                description: '',
                budget: '',
                status: 'planning',
                tags: '',
                owner: '',
                collaborators: [],
                startDate: '',
                endDate: '',
            })
            setShowResourceForm(false)
            await fetchProject()
        } catch (error) {
            console.error('Failed to create resource', error)
            setResourceFormError('Failed to create resource')
        } finally {
            setResourceFormLoading(false)
        }
    }

    const handleDeleteResource = async (resourceId?: string) => {
        if (!resourceId || !window.confirm('Are you sure you want to delete this resource?')) {
            return
        }

        setResourceFormError(null)
        setResourceActionLoading(resourceId)

        try {
            await api.delete(`/resources/${resourceId}`)
            await fetchProject()
        } catch (error) {
            console.error('Failed to delete resource', error)
            setResourceFormError('Failed to delete resource')
        } finally {
            setResourceActionLoading(null)
        }
    }

    if (loading) return <p className="page-message">Loading project...</p>
    if (!project) return <p className="page-message page-message--error">Project not found. <button className="app-button" onClick={() => nav('/projects')}>Back to Projects</button></p>

    const ownerName = typeof project.assignee === 'string'
        ? project.assignee
        : project.assignee?.name || 'Unassigned'

    const getResourceOwnerName = (resource: Resource) => {
        if (!resource.owner) return 'Unassigned'
        if (typeof resource.owner === 'string') return resource.owner
        return resource.owner?.name || resource.owner?.email || 'Unassigned'
    }

    const getCollaboratorNames = (resource: Resource) => {
        const collaborators = Array.isArray(resource.collaborators) ? resource.collaborators : []

        if (!collaborators.length) return 'None'

        return collaborators
            .map((collaborator) => typeof collaborator === 'string' ? collaborator : collaborator.name || collaborator.email)
            .join(', ')
    }

    return (
        <div className="detail-page">
            <div className="detail-hero">
                <div>
                    <p className="page-eyebrow">Project Details</p>
                    <h1 className="detail-hero__title">{project.title}</h1>
                </div>
                <button className="app-button" onClick={() => nav('/projects')}>← Back to Projects</button>
            </div>

            <div className="detail-card">
                <div className="detail-grid">
                    <div className="detail-item"><strong>Description</strong>{project.description}</div>
                    <div className="detail-item"><strong>Status</strong>{project.status}</div>
                    <div className="detail-item"><strong>Priority</strong>{project.priority}</div>
                    <div className="detail-item"><strong>Assigned To</strong>{ownerName}</div>
                </div>
            </div>

            <div className="detail-card">
                <h2>Update Status</h2>
                {user?.role === 'admin' ? (
                    <div className="detail-status-control">
                        <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="todo">Todo</option>
                            <option value="in-progress">In-Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>

                        </select>
                        <button onClick={handleStatusUpdate} disabled={updating} className="app-button app-button--primary">
                            {updating ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                ) : (
                    <p className="page-message">Only admins can edit project status.</p>
                )}
            </div>

            <div className="detail-card">
                <div className="detail-card__header">
                    <h2>Resources</h2>
                    {user?.role === 'admin' && (
                        <button
                            type="button"
                            className="app-button app-button--primary"
                            onClick={() => setShowResourceForm((prev) => !prev)}
                        >
                            {showResourceForm ? 'Cancel' : 'New Resource'}
                        </button>
                    )}
                </div>

                {user?.role === 'admin' && showResourceForm && (
                    <form className="detail-form" onSubmit={handleSubmitResource}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Title <span className="form-required">*</span></label>
                                <input
                                    className="form-control"
                                    type="text"
                                    value={resourceFormData.title}
                                    onChange={(e) => handleResourceFormChange('title', e.target.value)}
                                    placeholder="Resource title"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Budget <span className="form-required">*</span></label>
                                <input
                                    className="form-control"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={resourceFormData.budget}
                                    onChange={(e) => handleResourceFormChange('budget', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="form-group form-group--full">
                                <label className="form-label">Description</label>
                                <input
                                    className="form-control"
                                    type="text"
                                    value={resourceFormData.description}
                                    onChange={(e) => handleResourceFormChange('description', e.target.value)}
                                    placeholder="Resource description"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-control"
                                    value={resourceFormData.status}
                                    onChange={(e) => handleResourceFormChange('status', e.target.value)}
                                >
                                    <option value="planning">Planning</option>
                                    <option value="active">Active</option>
                                    <option value="blocked">Blocked</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Owner</label>
                                <select
                                    className="form-control"
                                    value={resourceFormData.owner}
                                    onChange={(e) => handleResourceFormChange('owner', e.target.value)}
                                >
                                    <option value="">Use current user</option>
                                    {users.map((user) => (
                                        <option key={user._id} value={user._id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tags</label>
                                <input
                                    className="form-control"
                                    type="text"
                                    value={resourceFormData.tags}
                                    onChange={(e) => handleResourceFormChange('tags', e.target.value)}
                                    placeholder="design, backend, qa"
                                />
                            </div>

                            <div className="form-group form-group--full">
                                <label className="form-label">Collaborators</label>
                                <select
                                    className="form-control form-control--multiselect"
                                    multiple
                                    value={resourceFormData.collaborators}
                                    onChange={handleCollaboratorsChange}
                                >
                                    {users.map((user) => (
                                        <option key={user._id} value={user._id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Sprint Start <span className="form-required">*</span></label>
                                <input
                                    className="form-control"
                                    type="date"
                                    value={resourceFormData.startDate}
                                    onChange={(e) => handleResourceFormChange('startDate', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Sprint End <span className="form-required">*</span></label>
                                <input
                                    className="form-control"
                                    type="date"
                                    value={resourceFormData.endDate}
                                    onChange={(e) => handleResourceFormChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>

                        {resourceFormError && <p className="form-error">{resourceFormError}</p>}

                        <button
                            type="submit"
                            disabled={resourceFormLoading}
                            className={`app-button ${resourceFormLoading ? 'button-disabled' : 'app-button--primary'}`}
                        >
                            {resourceFormLoading ? 'Creating...' : 'Create Resource'}
                        </button>
                    </form>
                )}

                <div className="detail-list">
                    {project.resources?.length ? project.resources.map((resource) => (
                        <div key={resource._id ?? resource.title} className="detail-list__item detail-list__item--resource">
                            <div className="detail-list__content">
                                {resource._id ? (
                                    <Link className="table-link" to={`/resources/${resource._id}`}>
                                        {resource.title}
                                    </Link>
                                ) : (
                                    <span>{resource.title}</span>
                                )}
                                <div className="detail-list__meta">
                                    <span className={`status-pill resource-status--${resource.status}`}>{resource.status}</span>
                                    <span>Owner: {getResourceOwnerName(resource)}</span>
                                    <span>Collaborators: {getCollaboratorNames(resource)}</span>
                                </div>
                            </div>
                            {user?.role === 'admin' && (
                                <button
                                    type="button"
                                    onClick={() => void handleDeleteResource(resource._id)}
                                    disabled={resourceActionLoading === resource._id}
                                    className="app-button app-button--danger"
                                >
                                    {resourceActionLoading === resource._id ? 'Deleting...' : 'Delete'}
                                </button>
                            )}
                        </div>
                    )) : <div className="detail-list__item">No resources assigned.</div>}
                </div>
            </div>

            {user?.role === 'admin' && (
                <div className="detail-actions">
                    <button onClick={handleDelete} className="app-button app-button--danger">
                        Delete Project
                    </button>
                </div>
            )}
        </div>
    )
}

export default ProjectDetail