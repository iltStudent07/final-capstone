export type User = {
  _id: string
  name: string
  email: string
  role: string
}

export interface ChecklistItem {
  label: string
  done: boolean
}

export type Task = {
  _id: string
  resource: string | Resource | null
  assignee: string | User | null
  title: string
  details: string
  estimateHours: number
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in-progress' | 'review' | 'done'
  checklist: ChecklistItem[]
  dueDate?: string | Date
  attachments: string[]
  createdAt?: string | Date
  updatedAt?: string | Date
}

export type Project = {
  _id: string
  title: string
  description: string
  status: string
  priority: string
  tasks?: Task[] | null
  assignee?: string | User | null
}

export type SprintWindow = {
  startDate: Date | string
  endDate: Date | string
}

export type ProgressEntry = {
  label: string
  percentComplete: number
  recordedAt: Date | string
}

export type Resource = {
  _id?: string
  title: string
  description: string
  budget: number
  status: 'planning' | 'active' | 'blocked' | 'completed'
  tags: string[]
  owner: string | User
  collaborators: Array<string | User>
  sprintWindow: SprintWindow
  progressHistory: ProgressEntry[]
  createdAt?: string | Date
  updatedAt?: string | Date
}

export type RecentTasks = {
  _id: string
  title: string
  project: {
    _id: string
    title: string
  }
  status: string
  dueDate: string
}

export type DashboardStats = {
  totalTasks: number
  totalPolicies: number
  totalUsers: number
  recentTasks: RecentTasks[]
  tasksByStatus?: Array<{ status: string; count: number }> | Record<string, number>
}

export type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    role: 'admin' | 'member',
  ) => Promise<void>
  logout: () => void
}