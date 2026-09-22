export type User = {
    _id: string
    name: string
    email: string
    role: string
}

export type Task = {
  _id: string
  title: string
  project: Project
  description: string
  status: string
  priority: string
  dueDate: string
  assignee?: string | User | null
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