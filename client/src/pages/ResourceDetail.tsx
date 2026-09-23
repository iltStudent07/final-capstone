import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import type { Resource } from '../types/types'

function ResourceDetail() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<Resource['status']>('planning')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const response = await api.get(`/resources/${id}`)
        setResource(response.data)
        setStatus(response.data.status)
      } catch {
        setResource(null)
      } finally {
        setLoading(false)
      }
    }

    void fetchResource()
  }, [id])

  const projectId = useMemo(() => {
    if (!resource?.project) return null
    return typeof resource.project === 'string' ? resource.project : resource.project._id
  }, [resource])

  const projectTitle = useMemo(() => {
    if (!resource?.project) return 'Unknown project'
    return typeof resource.project === 'string' ? resource.project : resource.project.title
  }, [resource])

  const ownerName = useMemo(() => {
    if (!resource?.owner) return 'Unassigned'
    if (typeof resource.owner === 'string') return resource.owner
    return resource.owner.name || resource.owner.email
  }, [resource])

  const collaborators = useMemo(() => {
    if (!resource?.collaborators.length) return 'None'

    return resource.collaborators
      .map((collaborator) => {
        if (typeof collaborator === 'string') return collaborator
        return collaborator.name || collaborator.email
      })
      .join(', ')
  }, [resource])

  const sprintDates = useMemo(() => {
    if (!resource?.sprintWindow) return '—'

    const start = new Date(resource.sprintWindow.startDate).toLocaleDateString()
    const end = new Date(resource.sprintWindow.endDate).toLocaleDateString()
    return `${start} - ${end}`
  }, [resource])

  const handleStatusUpdate = async () => {
    if (!resource || !id) return

    setUpdating(true)
    try {
      const response = await api.put(`/resources/${id}`, { status })
      setResource(response.data)
      setStatus(response.data.status)
    } catch (error) {
      console.error('Failed to update resource status', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      await api.delete(`/resources/${id}`)
      if (projectId) {
        nav(`/projects/${projectId}`)
        return
      }
      nav('/projects')
    } catch (error) {
      console.error('Failed to delete resource', error)
      setDeleting(false)
    }
  }

  if (loading) return <p className="page-message">Loading resource...</p>
  if (!resource) return <p className="page-message page-message--error">Resource not found. <button className="app-button" onClick={() => nav('/projects')}>Back to Projects</button></p>

  return (
    <div className="detail-page">
      <div className="detail-hero">
        <div>
          <p className="page-eyebrow">Resource Details</p>
          <h1 className="detail-hero__title">{resource.title}</h1>
        </div>
        <button className="app-button" onClick={() => projectId ? nav(`/projects/${projectId}`) : nav('/projects')}>
          ← Back to Project
        </button>
      </div>

      <div className="detail-card">
        <div className="detail-grid">
          <div className="detail-item">
            <strong>Project</strong>
            {projectId ? <Link className="table-link" to={`/projects/${projectId}`}>{projectTitle}</Link> : projectTitle}
          </div>
          <div className="detail-item"><strong>Status</strong>{resource.status}</div>
          <div className="detail-item"><strong>Budget</strong>${resource.budget.toLocaleString()}</div>
          <div className="detail-item"><strong>Owner</strong>{ownerName}</div>
          <div className="detail-item"><strong>Collaborators</strong>{collaborators}</div>
          <div className="detail-item"><strong>Sprint Window</strong>{sprintDates}</div>
        </div>
      </div>

      <div className="detail-card">
        <h2>Update Status</h2>
        <div className="detail-status-control">
          <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value as Resource['status'])}>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={handleStatusUpdate} disabled={updating} className="app-button app-button--primary">
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>

      <div className="detail-card">
        <h2>Description</h2>
        <p>{resource.description || 'No description provided.'}</p>
      </div>

      <div className="detail-card">
        <h2>Tags</h2>
        <div className="detail-list">
          {resource.tags.length ? resource.tags.map((tag) => (
            <div key={tag} className="detail-list__item">{tag}</div>
          )) : <div className="detail-list__item">No tags assigned.</div>}
        </div>
      </div>

      <div className="detail-actions">
        <button onClick={handleDelete} disabled={deleting} className="app-button app-button--danger">
          {deleting ? 'Deleting...' : 'Delete Resource'}
        </button>
      </div>
    </div>
  )
}

export default ResourceDetail
