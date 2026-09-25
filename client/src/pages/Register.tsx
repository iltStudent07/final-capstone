import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { getLiveValidationError, validateEmail, validateName, validatePassword } from '../utils/validation'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [error, setError] = useState('')
  const nav = useNavigate()
  const { register } = useAuth()

  const handleNameChange = (value: string) => {
    const validationError = getLiveValidationError('name', value, 'Name')

    if (validationError) {
      setError(validationError)
      return
    }

    setName(value)
    setError('')
  }

  const handleEmailChange = (value: string) => {
    const validationError = getLiveValidationError('email', value, 'Email')

    if (validationError) {
      setError(validationError)
      return
    }

    setEmail(value)
    setError('')
  }

  const handlePasswordChange = (value: string) => {
    const validationError = getLiveValidationError('password', value, 'Password')

    if (validationError) {
      setError(validationError)
      return
    }

    setPassword(value)
    setError('')
  }

  return (
    <div className="auth-page">
      <div className="panel auth-card">
        <p className="page-eyebrow" style={{ textAlign: 'center' }}>Get Started</p>
        <h1>Register</h1>
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault()

            const nameError = validateName(name)

            if (nameError) {
              setError(nameError)
              return
            }

            const emailError = validateEmail(email)

            if (emailError) {
              setError(emailError)
              return
            }

            const passwordError = validatePassword(password)

            if (passwordError) {
              setError(passwordError)
              return
            }

            try {
              await register(name, email, password, role)
              nav('/login')
            } catch {
              setError('There was an error registering user')
            }
          }}
        >
          <input className="form-control" type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Name" />

          <input className="form-control" type="email" value={email} onChange={(e) => handleEmailChange(e.target.value)} placeholder="Email" />

          <input className="form-control" type="password" value={password} onChange={(e) => handlePasswordChange(e.target.value)} placeholder="Password" />

          <select className="form-control" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'member')}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>

          <button className="app-button app-button--primary auth-submit">Register</button>
          <p className="auth-link">
            Already have an account? <Link to="/login">Click Here!</Link>
          </p>
        </form>

        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  )
}

export default Register