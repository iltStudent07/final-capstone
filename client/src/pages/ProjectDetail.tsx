import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'
import type { Project } from '../types/types'

function ProjectDetail() {
    const { id } = useParams<{id: string}>()
    const nav = useNavigate()
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [status, setStatus] = useState<string>('')
    const [updating, setUpdating] = useState<boolean>(false)

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await api.get(`/projects/${id}`)
                setProject(response.data)
                setStatus(response.data.status)
                setLoading(false)
            } catch {
                setLoading(false)
            }
        }
        fetchProjects()
    }, [id])

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

    if (loading) return <p className="page-message">Loading project...</p>
    if (!project) return <p className="page-message page-message--error">Project not found. <button className="app-button" onClick={() => nav('/projects')}>Back to Projects</button></p>

    const ownerName = typeof project.assignee === 'string'
        ? project.assignee
        : project.assignee?.name || 'Unassigned'

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
            </div>

            <div className="detail-card">
                <h2>Tasks</h2>
                <div className="detail-list">
                    {project.tasks?.length ? project.tasks.map((task) => (
                        <div key={task._id} className="detail-list__item">
                            {task.title}
                        </div>
                    )) : <div className="detail-list__item">No tasks assigned.</div>}
                </div>
            </div>

            <div className="detail-actions">
                <button onClick={handleDelete} className="app-button app-button--danger">
                    Delete Project
                </button>
            </div>
        </div>
    )
}

export default ProjectDetail