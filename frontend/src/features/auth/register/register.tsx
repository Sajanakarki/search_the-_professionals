import { useState } from 'react';
import './resgister.css';
import { registerApi } from '../../../shared/config/api';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    location: ''
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setErrorMsg('Username, email, and password are required');
      return;
    }
    if (form.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }
    if (form.password !== form.confirm) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (!form.phone.trim()) {
      setErrorMsg('Phone number is required');
      return;
    }
    const phonePattern = /^[0-9+\-\s()]{7,20}$/;
    if (!phonePattern.test(form.phone.trim())) {
      setErrorMsg('Enter a valid phone number');
      return;
    }
    if (!form.location.trim()) {
      setErrorMsg('Location is required');
      return;
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
      location: form.location.trim()
    };

    try {
      setSubmitting(true);
      await registerApi(payload);
      setSuccessMsg(' Registration successful! Redirecting to login...');
      setForm({
        username: '',
        email: '',
        password: '',
        confirm: '',
        phone: '',
        location: ''
      });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="register-wrapper">
      <form className="register-card" onSubmit={handleSubmit} noValidate>
        <h2>Register</h2>

        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        {errorMsg &&   <div className="alert alert-error">{errorMsg}</div>}

        <div className="register-field">
          <label htmlFor="username">Name</label>
          <input id="username" type="text" name="username" value={form.username} onChange={handleChange} required />
        </div>

        <div className="register-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required />
        </div>

        <div className="register-field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
        </div>

        <div className="register-field">
          <label htmlFor="confirm">Confirm Password</label>
          <input id="confirm" type="password" name="confirm" value={form.confirm} onChange={handleChange} required />
        </div>

        <div className="register-field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+977-98xxxxxxx" required />
        </div>

        <div className="register-field">
          <label htmlFor="location">Location</label>
          <input id="location" type="text" name="location" value={form.location} onChange={handleChange} placeholder="Kathmandu, NP" required />
        </div>

        <button className="register-btn" type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Sign Up'}
        </button>
      </form>

      
      <div className="register-alt">
        <span>Already registered?</span>
        <Link to="/login" className="login-link">Log in</Link>
      </div>
    </main>
  );
}

export default Register;
