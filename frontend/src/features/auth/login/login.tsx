import { useState } from 'react';
import './login.css';
import type { AxiosError, AxiosResponse } from 'axios';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../../../shared/config/api';

function Login() {
  const [form, setFormData] = useState({ username: '', password: '' });

  // Inline page messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    
    setSuccessMsg('');
    setErrorMsg('');

    loginApi(form)
      .then((res: AxiosResponse) => {
        
        const u = (res?.data?.user ?? res?.data ?? {}) as any;
        u.role = (u.role || 'user').toString().toLowerCase();

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('currentUser', JSON.stringify(u));

        
        setSuccessMsg('Login successful');
        setErrorMsg('');
        setTimeout(() => navigate('/home'), 800);
      })
      .catch((error: AxiosError<any>) => {
        const status = error.response?.status;

        
        if (status === 400 || status === 401) {
          setErrorMsg("Username or password doesn't match");
        } else {
          const message =
            error.response?.data?.message || 'Login failed. Please try again.';
          setErrorMsg(message);
        }
        setSuccessMsg('');
      });
  };

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2 className="login-title">Login</h2>

        
        {successMsg ? (
          <div style={{ marginBottom: 12, color: '#0a7a28', background: '#e8f6ed', padding: '8px 10px', borderRadius: 6 }}>
            {successMsg}
          </div>
        ) : null}
        {errorMsg ? (
          <div style={{ marginBottom: 12, color: '#af1f1f', background: '#fdecec', padding: '8px 10px', borderRadius: 6 }}>
            {errorMsg}
          </div>
        ) : null}

        <div className="login-field">
          <label htmlFor="username" style={{ fontWeight: 'bold' }}>
            Username:
          </label>
          <input
            id="username"
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="password" style={{ fontWeight: 'bold' }}>
            Password:
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <button className="login-btn" type="submit">
          Sign In
        </button>

        <h4 style={{ textAlign: 'center', fontWeight: 'normal' }}>
          Don&apos;t have an account? <a href="/register">Register</a>
        </h4>
      </form>
    </div>
  );
}

export default Login;
