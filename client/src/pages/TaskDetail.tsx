import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'
import type { Task } from '../types/types'

function TaskDetail() {
    const { id } = useParams<{id: string}>()
    const nav = useNavigate()
    const [task, setTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [status, setStatus] = useState<string>('')
    const [updating, setUpdating] = useState<boolean>(false)

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const response = await api.get(`/tasks/${id}`)
                setTask(response.data)
                setStatus(response.data.status)
                setLoading(false)
            } catch {
                setLoading(false)
            }
        }
        fetchTask()
    }, [id])

    const getProjectLabel = (project: Task['project']) => {
        if (typeof project === 'string') return project
        return project?.title || 'Unknown Project'
    }

    const handleStatusUpdate = async () => {
        if (!task) return
        setUpdating(true)
        try {
            const response = await api.put(`/tasks/${id}`, { status })
            setTask(response.data)
            setStatus(response.data.status)
        } catch (error) {
            console.error('Failed to update status', error)
        } finally {
            setUpdating(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            return
        }
        try {
            await api.delete(`/tasks/${id}`)
            nav('/tasks')
        } catch (error) {
            console.error('Failed to delete task', error)
        }
    }

    if (loading) return <p>Loading...</p>
    if (!task) return <p>Task not found. <button onClick={() => nav('/tasks')}>Back to Tasks</button></p>

    return (
        <div>
            <button onClick={() => nav('/tasks')}>← Back to Tasks</button>

            {/* Claim Information */}
            <div>
                <h1>{task.title}</h1>
                <div>
                    <div><strong>Project:</strong> {getProjectLabel(task.project)}</div>
                    <div><strong>Due Date:</strong> {new Date(task.dueDate).toLocaleDateString()}</div>
                    <div><strong>Priority:</strong> ${task.priority}</div>
                    <div><strong>Status:</strong> {task.status}</div>
                </div>
            </div>

            {/* Status Update */}
            <div className="status-update">
                <h2>Update Status</h2>
                <div className="control-group">
                    <select value={status} onChange={(e) =>     setStatus(e.target.value)}>
                        <option value="submitted">Submitted</option>
                        <option value="under-review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                        <option value="closed">Closed</option>
                    </select>
                    <button onClick={handleStatusUpdate} disabled={updating} className="app-button">
                        {updating ? 'Updating...' : 'Update Status'}
                    </button>
                </div>
            </div>

            {/* Description */}
            <div className="description-section">
                <h2>Description</h2>
                <p>{task.description}</p>
            </div>

            {/* Delete Button */}
            <div>
                <button onClick={handleDelete}>
                    Delete Claim
                </button>
            </div>
        </div>
    )
}

export default TaskDetail