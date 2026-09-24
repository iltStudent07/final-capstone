import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider'
import api from '../services/api'
import type { Task } from '../types/types'

function TaskDetail() {
    const { user } = useAuth()
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

    const isTaskOverdue = (dueDate?: string | Date, taskStatus?: string) => {
        if (!dueDate || taskStatus === 'done') return false

        const due = new Date(dueDate)

        if (Number.isNaN(due.getTime())) return false

        const endOfDueDate = new Date(due)
        endOfDueDate.setHours(23, 59, 59, 999)

        return endOfDueDate < new Date()
    }

    if (loading) return <p className="page-message">Loading task...</p>
    if (!task) return <p className="page-message page-message--error">Task not found. <button className="app-button" onClick={() => nav('/tasks')}>Back to Tasks</button></p>

    return (
        <div className="detail-page">
            <div className="detail-hero">
                <div>
                    <p className="page-eyebrow">Task Details</p>
                    <h1 className="detail-hero__title">{task.title}</h1>
                </div>
                <button className="app-button" onClick={() => nav('/tasks')}>← Back to Tasks</button>
            </div>

            <div className="detail-card">
                <div className="detail-grid">
                    <div className="detail-item">
                        <strong>Due Date</strong>
                        <div className="due-date-cell">
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            {isTaskOverdue(task.dueDate, task.status) && (
                                <span className="status-pill due-status--overdue">Past Due</span>
                            )}
                        </div>
                    </div>
                    <div className="detail-item"><strong>Priority</strong>{task.priority}</div>
                    <div className="detail-item"><strong>Status</strong>{task.status}</div>
                </div>
            </div>

            <div className="detail-card">
                <h2>Update Status</h2>
                <div className="detail-status-control">
                    <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="todo">Todo</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                    </select>
                    <button onClick={handleStatusUpdate} disabled={updating} className="app-button app-button--primary">
                        {updating ? 'Updating...' : 'Update Status'}
                    </button>
                </div>
            </div>

            <div className="detail-card">
                <h2>Details</h2>
                <p>{task.details}</p>
            </div>

            {user?.role === 'admin' && (
                <div className="detail-actions">
                    <button onClick={handleDelete} className="app-button app-button--danger">
                        Delete Task
                    </button>
                </div>
            )}
        </div>
    )
}

export default TaskDetail