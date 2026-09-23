import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import * as apiModule from '../services/api'

vi.mock('../services/api')

const mockApi = apiModule.default as unknown as { get: ReturnType<typeof vi.fn> }

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders the tasks by status section', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        totals: {
          tasks: 4,
          resources: 2,
          projects: 1,
        },
        grouped: {
          tasksByStatus: [
            { status: 'Todo', statusKey: 'todo', count: 1 },
            { status: 'In Progress', statusKey: 'inprogress', count: 2 },
            { status: 'Review', statusKey: 'review', count: 1 },
            { status: 'Done', statusKey: 'done', count: 0 },
          ],
        },
        recent: {
          tasks: [],
        },
      },
    })

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Tasks by Status')).toBeInTheDocument()
      expect(screen.getByText('Todo')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Review')).toBeInTheDocument()
    })
  })

  test('renders recent tasks section with tasks', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        totals: {
          tasks: 2,
          resources: 1,
          projects: 1,
        },
        grouped: {
          tasksByStatus: [
            { status: 'Todo', statusKey: 'todo', count: 2 },
            { status: 'In Progress', statusKey: 'inprogress', count: 0 },
            { status: 'Review', statusKey: 'review', count: 0 },
            { status: 'Done', statusKey: 'done', count: 0 },
          ],
        },
        recent: {
          tasks: [
            {
              _id: '1',
              title: 'Task 1',
              status: 'todo',
              dueDate: '2026-09-30',
              resource: { _id: 'r1', title: 'Resource 1' },
            },
            {
              _id: '2',
              title: 'Task 2',
              status: 'in-progress',
              dueDate: '2026-10-05',
              resource: { _id: 'r2', title: 'Resource 2' },
            },
          ],
        },
      },
    })

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Recent Tasks')).toBeInTheDocument()
      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
      expect(screen.getByText('Resource 1')).toBeInTheDocument()
      expect(screen.getByText('Resource 2')).toBeInTheDocument()
    })
  })

  test('shows 2 overdue tasks when there are two past due tasks', async () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    mockApi.get.mockResolvedValue({
      data: {
        totals: {
          tasks: 4,
          resources: 1,
          projects: 1,
        },
        grouped: {
          tasksByStatus: [
            { status: 'Todo', statusKey: 'todo', count: 2 },
            { status: 'In Progress', statusKey: 'inprogress', count: 1 },
            { status: 'Review', statusKey: 'review', count: 0 },
            { status: 'Done', statusKey: 'done', count: 1 },
          ],
        },
        recent: {
          tasks: [
            {
              _id: '1',
              title: 'Overdue Task 1',
              status: 'todo',
              dueDate: yesterday.toISOString(),
              resource: { _id: 'r1', title: 'Resource 1' },
            },
            {
              _id: '2',
              title: 'Overdue Task 2',
              status: 'in-progress',
              dueDate: twoDaysAgo.toISOString(),
              resource: { _id: 'r2', title: 'Resource 2' },
            },
            {
              _id: '3',
              title: 'Not Overdue Task',
              status: 'todo',
              dueDate: tomorrow.toISOString(),
              resource: { _id: 'r3', title: 'Resource 3' },
            },
            {
              _id: '4',
              title: 'Done Task',
              status: 'done',
              dueDate: yesterday.toISOString(),
              resource: { _id: 'r4', title: 'Resource 4' },
            },
          ],
        },
      },
    })

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      const overdueCardValue = screen.getByText('Overdue Tasks').parentElement?.querySelector('.stat-card__value')
      expect(overdueCardValue?.textContent).toBe('2')
    })
  })
})
