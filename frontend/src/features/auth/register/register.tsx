import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import { registerApi, loginApi } from "../../../shared/config/api";
import "./resgister.css";

type FormValues = {
  username: string;
  email: string;
  phone: string;         // collected for UI; not sent (your backend expects only 3 fields)
  locationText: string;  // collected for UI; not sent
  password: string;
  confirm: string;
};

/* Validation rules */
const NAME_REGEX = /^(?! )[A-Za-z ]{3,50}(?<! )$/;                   // letters+spaces, 3–50, no edge spaces
const EMAIL_REGEX = /^\S+@\S+\.\S+$/i;                               // general email format
const PHONE_REGEX = /^\d{10}$/;                                      // exactly 10 digits
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/; // 8+, 1 letter, 1 number, 1 special

export default function Register() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    criteriaMode: "firstError",
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      locationText: "",
      password: "",
      confirm: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setBanner(null);
      clearErrors();

      // Type payload EXACTLY as registerApi expects to avoid TS inference errors
      const payload: Parameters<typeof registerApi>[0] = {
        username: data.username.replace(/\s+/g, " ").trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      };

      // 1) Register
      await registerApi(payload);

      // 2) Auto-login (your backend logs in with username + password)
      const loginRes = await loginApi({
        username: payload.username,
        password: payload.password,
      });

      // 3) Persist & go home
      const u = (loginRes?.data?.user ?? loginRes?.data ?? {}) as any;
      u.role = (u.role || "user").toString().toLowerCase();

      localStorage.setItem("token", loginRes.data.token);
      localStorage.setItem("currentUser", JSON.stringify(u));

      navigate("/home");
    } catch (err) {
      const e = err as AxiosError<any>;
      const msg = e.response?.data?.message || "Registration failed. Please try again.";
      setBanner({ type: "err", text: msg });

      // Attach error to a likely field for better UX
      const lower = msg.toLowerCase();
      if (lower.includes("name") || lower.includes("user")) {
        setError("username", { message: msg }, { shouldFocus: true });
      } else if (lower.includes("mail")) {
        setError("email", { message: msg }, { shouldFocus: true });
      } else if (lower.includes("password")) {
        setError("password", { message: msg }, { shouldFocus: true });
      } else {
        setError("confirm", { message: msg }, { shouldFocus: true });
      }
    }
  };

  return (
    <main className="register-wrapper">
      <form className="register-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2 className="register-title">Register</h2>

        {banner && (
          <div className={`alert ${banner.type === "ok" ? "alert-success" : "alert-error"}`} role="alert">
            {banner.text}
          </div>
        )}

        {/* Name */}
        <div className="register-field">
          <label htmlFor="username">Name</label>
          <input
            id="username"
            type="text"
            placeholder="Name"
            autoComplete="name"
            {...register("username", {
              required: "Name is required",
              pattern: { value: NAME_REGEX, message: "Only letters & spaces (3–50 chars)" },
              onChange: (e) => {
                e.target.value = e.target.value
                  .replace(/[^A-Za-z ]/g, "")
                  .replace(/\s{2,}/g, " ")
                  .slice(0, 50);
              },
            })}
            className={errors.username ? "has-error" : undefined}
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? "username-error" : undefined}
          />
          {errors.username && (
            <div id="username-error" className="field-error">{errors.username.message}</div>
          )}
        </div>

        {/* Email */}
        <div className="register-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            {...register("email", {
              required: "Email is required",
              pattern: { value: EMAIL_REGEX, message: "Enter a valid email" },
              onChange: (e) => (e.target.value = e.target.value.trim()),
            })}
            className={errors.email ? "has-error" : undefined}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <div id="email-error" className="field-error">{errors.email.message}</div>
          )}
        </div>

        {/* Phone (client-side only) */}
        <div className="register-field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="tel"
            placeholder="10-digit mobile number"
            inputMode="numeric"
            {...register("phone", {
              required: "Mobile number is required",
              pattern: { value: PHONE_REGEX, message: "Enter a 10-digit mobile number" },
              onChange: (e) => (e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10)),
            })}
            className={errors.phone ? "has-error" : undefined}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <div id="phone-error" className="field-error">{errors.phone.message}</div>
          )}
        </div>

        {/* Location (client-side only) */}
        <div className="register-field">
          <label htmlFor="locationText">Location</label>
          <input
            id="locationText"
            type="text"
            placeholder="Your location"
            {...register("locationText", {
              required: "Location is required",
              onChange: (e) => (e.target.value = e.target.value.replace(/\s+/g, " ").slice(0, 60)),
            })}
            className={errors.locationText ? "has-error" : undefined}
            aria-invalid={!!errors.locationText}
            aria-describedby={errors.locationText ? "location-error" : undefined}
          />
          {errors.locationText && (
            <div id="location-error" className="field-error">{errors.locationText.message}</div>
          )}
        </div>

        {/* Password */}
        <div className="register-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            {...register("password", {
              required: "Password is required",
              pattern: {
                value: PASSWORD_REGEX,
                message: "Min 8, include a letter, a number and a special character",
              },
            })}
            className={errors.password ? "has-error" : undefined}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <div id="password-error" className="field-error">{errors.password.message}</div>
          )}
        </div>

        {/* Confirm */}
        <div className="register-field">
          <label htmlFor="confirm">Confirm Password</label>
          <input
            id="confirm"
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            {...register("confirm", {
              required: "Please confirm your password",
              validate: (v) => v === getValues("password") || "Passwords do not match",
            })}
            className={errors.confirm ? "has-error" : undefined}
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? "confirm-error" : undefined}
          />
          {errors.confirm && (
            <div id="confirm-error" className="field-error">{errors.confirm.message}</div>
          )}
        </div>

        <button className="register-btn" type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? "Creating…" : "Sign Up"}
        </button>
      </form>

      <div className="register-alt">
        <span>Already registered?</span>
        <Link to="/login" className="login-link">Log in</Link>
      </div>
    </main>
  );
}
