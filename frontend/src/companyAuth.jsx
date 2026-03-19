import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlert } from './context/AlertContext'
import API from './api/axios.js'
import './style/auth.css'
import logo from './assets/orvix-white-logo.png'

const companyAuth = () => {
    const navigate = useNavigate()

    const [companyLoginEmail, setCompanyLoginEmail] = useState('')
    const [password, setPassword] = useState('')

    const [companyName, setCompanyName] = useState('')
    const [companyEmail, setCompanyEmail] = useState('')
    const [companyPassword, setCompanyPassword] = useState('')

    const alertContext = useAlert()
    const errorMsg = alertContext?.errorMsg || (() => { })

    const initUserRegistrationHandler = (e) => {
        e.preventDefault()

    }

    const loginSubmitHandler = async (e) => {
        e.preventDefault()
        try {
            const response = await API.post('/company/login', {
                companyLoginEmail,
                password,
            });

            if (response.data.success) {
                navigate('/company/dashboard', {
                    state: { loginSuccess: true }
                });
            }
        } catch (err) {
            errorMsg("Invalid credentials or store not found.")
        }
    }
    return (
        <div className="auth-wrapper">
            <div className="candidate-login-container">
                <div className="login-content">
                    <div className="top">
                        <img src={logo} alt="Orvix Logo" className='logo-image' />
                        <h2>Company Panel Login</h2>
                    </div>
                    <div className="bottom">
                        <form action="" onSubmit={loginSubmitHandler}>
                            <div className="input-group">
                                <label htmlFor="userid">
                                    <i className="fa-solid fa-envelope"></i>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    id='userid'
                                    placeholder='Your email'
                                    value={companyLoginEmail}
                                    onChange={(e) => {
                                        setCompanyLoginEmail(e.target.value)
                                    }} />
                            </div>
                            <div className="input-group">
                                <label htmlFor="password">
                                    <i className="fa-solid fa-unlock-keyhole"></i>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id='password'
                                    required
                                    placeholder='Your password'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <button type='submit' className='login-btn'>Login</button>
                            <p className='alt-login-text'>
                                Dont have an account ? <button to='/storeLogin'>Register here</button>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default companyAuth
