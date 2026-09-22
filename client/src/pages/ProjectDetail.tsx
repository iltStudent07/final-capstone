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

    if (loading) return <p>Loading...</p>
    if (!project) return <p>Project not found. <button onClick={() => nav('/projects')}>Back to Projects</button></p>

    const ownerName = typeof project.assignee === 'string'
        ? project.assignee
        : project.assignee?.name || 'Unassigned'

    return (
        <div>
            <button onClick={() => nav('/projects')}>← Back to Projects</button>

            {/* Policy Information */}
            <div>
                <h1>{project.title}</h1>
                <div>
                    <div><strong>Description:</strong> {project.description}</div>
                    <div><strong>Status:</strong>{project.status}</div>
                    <div><strong>Priority:</strong> {project.priority}</div>
                    <div><strong>Assigned To:</strong> {ownerName}</div>
                    <div><strong>Tasks:</strong>  {project.tasks?.map((task) => <div key={task._id}>{task.title}</div>)}</div>
                </div>
            </div>

            {/* Status Update */}
            <div className="status-update">
                <h2>Update Status</h2>
                <div className="control-group">
                    <select value={status} onChange={(e) =>     setStatus(e.target.value)}>
                        <option value="todo">Todo</option>
                        <option value="inprogress">In-Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
  
                    </select>
                    <button onClick={handleStatusUpdate} disabled={updating} className="app-button">
                        {updating ? 'Updating...' : 'Update Status'}
                    </button>
                </div>
            </div>

            {/* Delete Button */}
            <div className="actions">
                <button onClick={handleDelete} className="app-button delete-button">
                    Delete Policy
                </button>
            </div>
        </div>
    )
}

export default ProjectDetail