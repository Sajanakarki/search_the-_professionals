import { useState } from 'react';
import './resgister.css';
import { registerApi } from '../../../shared/config/api';
import { useNavigate, Link } from 'react-router-dom';

type Form = {
  username: string;
  email: string;
  password: string;
  confirm: string;
  phone: string;
  locationText: string;
};

type Errors = Partial<Record<keyof Form, string>>;
type Touched = Partial<Record<keyof Form, boolean>>;

/* Validation rules */
const FULLNAME_REGEX = /^[A-Za-z][A-Za-z' -]{2,49}$/;                  // letters, spaces, ', -, 3–50
const EMAIL_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/i;                     // Gmail only
const NEPAL_MOBILE_REGEX = /^(?:\+?977[- ]?)?(?:9[78]\d{8})$/;          // +977 optional, 98/97 + 8 digits
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;    // 8+, 1 letter, 1 number, 1 special

function Register() {
  const [form, setForm] = useState<Form>({
    username: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    locationText: '',
  });

  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({});
  const [submitted, setSubmitted] = useState(false);

  const [apiMsg, setApiMsg] = useState<{ ok?: string; err?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const normalizeName = (v: string) => v.replace(/\s+/g, ' ').trim();

  const validate = (v: Form): Errors => {
    const e: Errors = {};

    const name = normalizeName(v.username);
    if (!name) e.username = 'Name is required';
    else if (!FULLNAME_REGEX.test(name))
      e.username = "Use letters, spaces, ' or -. 3–50 characters";

    if (!v.email.trim()) e.email = 'Email is required';
    else if (!EMAIL_REGEX.test(v.email.trim()))
      e.email = 'Use a Gmail address (username@gmail.com)';

    if (!v.phone.trim()) e.phone = 'Phone number is required';
    else if (!NEPAL_MOBILE_REGEX.test(v.phone.trim()))
      e.phone = 'Use 98/97 + 8 digits (e.g., 98XXXXXXXX), +977 optional';

    if (!v.password) e.password = 'Password is required';
    else if (!PASSWORD_REGEX.test(v.password))
      e.password = 'Min 8 chars with a letter, a number, and a special';

    if (!v.confirm) e.confirm = 'Please confirm your password';
    else if (v.password !== v.confirm)
      e.confirm = 'Passwords do not match';

    if (!v.locationText.trim()) e.locationText = 'Location is required';

    return e;
  };

  /** Only show error after submit, or after user touched & entered some text */
  const showError = (field: keyof Form) => {
    const val = String((form[field] as string) ?? '');
    const hasText = val.trim() !== '';
    return (submitted || (touched[field] && hasText)) && !!errors[field];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let val = value;

    if (name === 'username') {
      // allow letters, spaces, apostrophes and hyphens; collapse multiple spaces
      val = value.replace(/[^A-Za-z' -]/g, '').replace(/\s{2,}/g, ' ');
    }
    if (name === 'phone') {
      // allow digits, +, space and dash
      val = value.replace(/[^\d+ -]/g, '');
    }
    if (name === 'email') {
      // remove spaces and lowercase to match gmail rule
      val = value.replace(/\s+/g, '').toLowerCase();
    }

    setForm(prev => {
      const next = { ...prev, [name]: val } as Form;

      // live-validate only if submitted OR the field has been touched and has text
      const nextVal = String(next[name as keyof Form] ?? '');
      const hasText = nextVal.trim() !== '';
      if (submitted || (touched as any)[name]) {
        const fieldErr = hasText ? validate(next)[name as keyof Form] : undefined;
        setErrors(p => ({ ...p, [name]: fieldErr }));
      } else {
        setErrors(p => ({ ...p, [name]: undefined }));
      }
      return next;
    });

    setApiMsg({});
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof Form;
    setTouched(p => ({ ...p, [name]: true }));

    // On blur: validate only if there's text OR after submit
    const hasText = (form[name] as string)?.trim() !== '';
    const fieldErr = (submitted || hasText) ? validate(form)[name] : undefined;
    setErrors(p => ({ ...p, [name]: fieldErr }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setApiMsg({});

    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    const payload = {
      username: normalizeName(form.username),
      email: form.email.trim().toLowerCase(), // keep lowercase
      password: form.password,
      phone: form.phone.trim(),
      locationText: form.locationText.trim(),
    };

    try {
      setSubmitting(true);
      await registerApi(payload);
      setApiMsg({ ok: 'Registration successful. Redirecting to login…' });
      setForm({
        username: '',
        email: '',
        password: '',
        confirm: '',
        phone: '',
        locationText: '',
      });
      setTouched({});
      setSubmitted(false);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Try again.';
      setApiMsg({ err: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="register-wrapper">
      <form className="register-card" onSubmit={handleSubmit} noValidate>
        <h2>Register</h2>

        {apiMsg.ok && <div className="alert alert-success">{apiMsg.ok}</div>}
        {apiMsg.err && <div className="alert alert-error">{apiMsg.err}</div>}

        <div className="register-field">
          <label htmlFor="username">Name</label>
          <input
            id="username"
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="name"
            maxLength={50}
            required
          />
          {showError('username') && <div className="field-error">{errors.username}</div>}
        </div>

        <div className="register-field">
          <label htmlFor="email">Email </label>
          <input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="email"
            required
          />
          {showError('email') && <div className="field-error">{errors.email}</div>}
        </div>

        <div className="register-field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            inputMode="tel"
            required
          />
          {showError('phone') && <div className="field-error">{errors.phone}</div>}
        </div>

        <div className="register-field">
          <label htmlFor="locationText">Location</label>
          <input
            id="locationText"
            type="text"
            name="locationText"
            value={form.locationText}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {showError('locationText') && (
            <div className="field-error">{errors.locationText}</div>
          )}
        </div>

        <div className="register-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="new-password"
            required
          />
          {showError('password') && <div className="field-error">{errors.password}</div>}
        </div>

        <div className="register-field">
          <label htmlFor="confirm">Confirm Password</label>
          <input
            id="confirm"
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="new-password"
            required
          />
          {showError('confirm') && <div className="field-error">{errors.confirm}</div>}
        </div>

        <button className="register-btn" type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Sign Up'}
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
