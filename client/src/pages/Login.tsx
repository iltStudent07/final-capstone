import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { getLiveValidationError, validateEmail, validatePassword } from '../utils/validation'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const nav = useNavigate()
    const { login } = useAuth()

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
            <p className="page-eyebrow" style={{ textAlign: 'center' }}>Welcome Back</p>
            <h1>Sign In</h1>
            <form
                className="auth-form"
                onSubmit={async e=>{e.preventDefault()
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
                        await login(email, password)
                        nav('/dashboard')
                    } catch {
                        setError("Email or Password is incorrect")
                    }
                }}>
                <input className="form-control" type='email' value={email} onChange={e=>handleEmailChange(e.target.value)} placeholder="Email"/>

                <input className="form-control" type="password" value={password} onChange={e=>handlePasswordChange(e.target.value)} placeholder="Password"/>

                <button className="app-button app-button--primary auth-submit">Login</button>
            </form>

            {error&&<p className="form-error">{error}</p>}

            <p className="auth-link">Need to register? <Link to='/register'>Click Here!</Link></p>
            </div>
        </div>
    )
}

export default Login