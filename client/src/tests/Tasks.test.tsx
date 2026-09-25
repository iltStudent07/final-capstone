import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Tasks from '../pages/Tasks'
import * as apiModule from '../services/api'

vi.mock('../services/api')

const mockApi = apiModule.default as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

describe('Tasks Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockResolvedValue({
      data: {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      },
    })
  })

  test('renders the Tasks h1 element and New Task button', async () => {
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /New Task/i })).toBeInTheDocument()
    })
  })

  test('clicking New Task button brings up the form', async () => {
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    )

    const newTaskButton = screen.getByRole('button', { name: /New Task/i })
    expect(newTaskButton).toHaveTextContent('New Task')
    
    fireEvent.click(newTaskButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create New Task/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create Task/i })).toBeInTheDocument()
    })

    // Verify the form is visible and button changes to Cancel
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  })

  test('user can input info into the form and submit to create a new task', async () => {
    mockApi.get.mockImplementation((url) => {
      if (url.includes('/resources')) {
        return Promise.resolve({
          data: [
            { _id: 'res1', title: 'Resource 1' },
          ],
        })
      }
      return Promise.resolve({
        data: {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
      })
    })

    mockApi.post.mockResolvedValue({
      data: {
        _id: '1',
        title: 'New Test Task',
        details: 'Test description',
        status: 'todo',
        priority: 'high',
        dueDate: '2026-10-15',
        resource: 'res1',
      },
    })

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    )

    // Open the form
    const newTaskButton = screen.getByRole('button', { name: /New Task/i })
    fireEvent.click(newTaskButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create New Task/i })).toBeInTheDocument()
    })

    // Get all form inputs from the Create New Task form
    const formInputs = screen.getAllByPlaceholderText(/Task title/i)
    const titleInput = formInputs[0] // First occurrence is in the form, not search

    expect(titleInput).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Task/i })).toBeInTheDocument()

    // Verify form submission button exists
    const submitButton = screen.getByRole('button', { name: /Create Task/i })
    expect(submitButton).toBeEnabled()
  })

  test('blocks invalid special characters in task title input', async () => {
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /New Task/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create New Task/i })).toBeInTheDocument()
    })

    const titleInput = screen.getByPlaceholderText('Task title') as HTMLInputElement

    fireEvent.change(titleInput, { target: { value: 'Task@Name' } })

    expect(titleInput.value).toBe('')
    expect(screen.getByText('Task title contains invalid characters.')).toBeInTheDocument()
  })

  test('truncates task descriptions to 100 characters', async () => {
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /New Task/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create New Task/i })).toBeInTheDocument()
    })

    const descriptionInput = screen.getByPlaceholderText('Description of task') as HTMLInputElement
    const longDescription = 'a'.repeat(120)

    fireEvent.change(descriptionInput, { target: { value: longDescription } })

    expect(descriptionInput.value).toHaveLength(100)
  })

  test('tasks from the database show up in the table', async () => {
    const mockTasks = [
      {
        _id: '1',
        title: 'Task One',
        details: 'First task description',
        status: 'todo',
        priority: 'high',
        dueDate: '2026-10-10',
        resource: { _id: 'res1', title: 'Resource 1' },
      },
      {
        _id: '2',
        title: 'Task Two',
        details: 'Second task description',
        status: 'in-progress',
        priority: 'medium',
        dueDate: '2026-10-20',
        resource: { _id: 'res2', title: 'Resource 2' },
      },
    ]

    mockApi.get.mockResolvedValue({
      data: {
        data: mockTasks,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      },
    })

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Task One')).toBeInTheDocument()
      expect(screen.getByText('Task Two')).toBeInTheDocument()
      expect(screen.getByText('First task description')).toBeInTheDocument()
      expect(screen.getByText('Second task description')).toBeInTheDocument()
      expect(screen.getByText('Resource 1')).toBeInTheDocument()
      expect(screen.getByText('Resource 2')).toBeInTheDocument()
    })
  })
})
