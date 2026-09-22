export type User = {
    _id: string
    name: string
    email: string
    role: string
}

interface ChecklistItem {
  label: string
  done: boolean
}

export type Task = {
    _id: string
    resource: string
    assignee: string | User | null
    title: string
    details: string
    estimatedHours: number
    priority: string
    status: string
    checklist: ChecklistItem[]
    dueDate?: string
    attachments: string[]
  
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

export type sprintWindow = {
    startDate: Date
    endDate: Date
}

export type progressEntry = {
    label: string
    percentComplete: number
    recordedAt: Date
}

export type Resource = {
    title: string
    description: string
    budget: string
    status: string
    tags: string[]
    owner: User
    collaborators: User[]
    sprintWindow: sprintWindow
    progressEntry: progressEntry[]

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
    totals: {
        totalUsers: number
        totalResources: number
        tasks: number
    }

    grouped: {
        usersByRole: number
        resoucesByStatus: number
        tasksByStatus: number
        tasksByPriority: number
    }
    
    recent: {
            users: User[]
            resources: Resource[]
            tasks: RecentTasks[]
    }

    metrics: {
            openResources: number
            overdueTasks: number
            averageResourceBudget: number
        }
}

export type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: string,
  ) => Promise<void>;
  logout: () => void;
};