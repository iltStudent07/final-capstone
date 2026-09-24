import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../components/Navbar'
import * as AuthContext from '../context/AuthProvider'

vi.mock('../context/AuthProvider')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders and shows user name and role when logged in', () => {
    const mockLogout = vi.fn()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: {
        _id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
      },
      login: vi.fn(),
      logout: mockLogout,
      token: 'test-token',
      loading: false,
      register: vi.fn(),
    })

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  test('clicking on nav links navigates to corresponding pages', async () => {
    const mockLogout = vi.fn()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: {
        _id: '123',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'member',
      },
      login: vi.fn(),
      logout: mockLogout,
      token: 'test-token',
      loading: false,
      register: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>
    )

    // Check that all nav links are present
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i })
    const projectsLink = screen.getByRole('link', { name: /Projects/i })
    const tasksLink = screen.getByRole('link', { name: /Tasks/i })

    expect(dashboardLink).toBeInTheDocument()
    expect(projectsLink).toBeInTheDocument()
    expect(tasksLink).toBeInTheDocument()

    // Verify they have the correct href attributes
    expect(dashboardLink).toHaveAttribute('href', '/')
    expect(projectsLink).toHaveAttribute('href', '/projects')
    expect(tasksLink).toHaveAttribute('href', '/tasks')
  })

  test('clicking logout button logs out user and calls logout function', async () => {
    const mockLogout = vi.fn()
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: {
        _id: '123',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'admin',
      },
      login: vi.fn(),
      logout: mockLogout,
      token: 'test-token',
      loading: false,
      register: vi.fn(),
    })

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    const logoutButton = screen.getByRole('button', { name: /Logout/i })
    expect(logoutButton).toBeInTheDocument()

    fireEvent.click(logoutButton)

    expect(mockLogout).toHaveBeenCalled()
  })
})
