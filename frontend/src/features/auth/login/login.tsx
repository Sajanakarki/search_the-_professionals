import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { AxiosError } from "axios";
import { loginApi } from "../../../shared/config/api"; 
import "./login.css";

type FormValues = {
  username: string;
  password: string;
};

const NAME_REGEX = /^(?! )[A-Za-z ]{3,50}(?<! )$/;                   // letters+spaces, 3–50, no edge spaces
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/; // 8+, 1 letter, 1 number, 1 special

export default function Login() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    criteriaMode: "firstError",
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setBanner(null);
      clearErrors();

      const payload = {
        username: data.username.replace(/\s+/g, " ").trim(),
        password: data.password,
      };

      const res = await loginApi(payload);

      localStorage.setItem("token", res.data?.token || "");
      localStorage.setItem("currentUser", JSON.stringify(res.data?.user || {}));

      navigate("/home");
    } catch (err) {
      const e = err as AxiosError<any>;
      const msg =
        e.response?.data?.message ||
        (e.code === "ERR_NETWORK" ? "Cannot reach server. Is the backend running?" : "Login failed");

      setBanner({ type: "err", text: msg });

      const lower = msg.toLowerCase();
      if (lower.includes("user") || lower.includes("name")) {
        setError("username", { message: msg }, { shouldFocus: true });
      } else if (lower.includes("password")) {
        setError("password", { message: msg }, { shouldFocus: true });
      }
    }
  };

  return (
    <main className="login-wrapper">
      <form className="login-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2 className="login-title">Login</h2>
        <p className="welcome-back">Welcome back, please login</p>

        {banner && (
          <div className={`alert ${banner.type === "ok" ? "alert-success" : "alert-error"}`} role="alert">
            {banner.text}
          </div>
        )}

        {/* Username */}
        <div className="login-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Name"
            autoComplete="username"
            {...register("username", {
              required: "Username is required",
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

        {/* Password */}
        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
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

        <button className="login-btn" type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? "Signing in…" : "Login"}
        </button>
      </form>

      <div className="login-alt">
        <span>New here?</span>
        <Link to="/register" className="alt-link">Create account</Link>
      </div>
    </main>
  );
}
