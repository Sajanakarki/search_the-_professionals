import { useState } from 'react';
import './resgister.css';
import { registerApi } from '../../../shared/config/api';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
  });

  // inline messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setSuccessMsg('');
    setErrorMsg('');

    if (form.password !== form.confirm) {
      setErrorMsg('Passwords do not match');
      return;
    }

    // payload without role
    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    registerApi(payload)
      .then(() => {
        setSuccessMsg('Registration successful. Please log in.');
        setTimeout(() => navigate('/login'), 1000);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message || 'Registration failed. Try again.';
        setErrorMsg(msg);
      });
  };

  return (
    <div className="register-wrapper">
      <form className="register-card" onSubmit={handleSubmit}>
        <h2>Register</h2>

        {/* Inline messages */}
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

        {/* Name */}
        <div className="register-field">
          <label htmlFor="username">Name</label>
          <input
            id="username"
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>

        {/* Email */}
        <div className="register-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Password */}
        <div className="register-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Confirm password */}
        <div className="register-field">
          <label htmlFor="confirm">Confirm Password</label>
          <input
            id="confirm"
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            required
          />
        </div>

        <button className="register-btn" type="submit">
          Sign Up
        </button>
      </form>
    </div>
  );
}

export default Register;
