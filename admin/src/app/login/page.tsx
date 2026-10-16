"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({ email: z.email("Enter a valid email address."), password: z.string().min(1, "Enter your password.") });
type LoginFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const form = useForm<LoginFields>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function submit(values: LoginFields) {
    setFormError("");
    try {
      await adminRequest("/auth/login", { method: "POST", body: JSON.stringify(values) });
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Sign in failed. Please try again.");
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel"><Link className="admin-brand login-brand" href="/"><span>RED BULL <b>TUT</b><small>ADMIN CONSOLE</small></span></Link><div className="login-brand-message"><span className="eyebrow">CAMPUS NOTICEBOARD</span><h1>Keep the<br /><em>campus moving.</em></h1><p>Manage published events and announcements across the five TUT campuses.</p></div><span className="login-panel-foot">AUTHORIZED ADMINISTRATORS ONLY</span></section>
      <section className="login-form-panel"><form className="login-form" onSubmit={form.handleSubmit(submit)} noValidate><span className="login-form-icon"><LockKeyhole size={19} /></span><span className="eyebrow">ADMINISTRATOR ACCESS</span><h2>Welcome back</h2><p>Sign in to manage campus content.</p>
        <label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="username" {...form.register("email")} aria-invalid={Boolean(form.formState.errors.email)} />{form.formState.errors.email && <span className="field-error">{form.formState.errors.email.message}</span>}
        <label htmlFor="password">Password</label><div className="password-field"><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" {...form.register("password")} aria-invalid={Boolean(form.formState.errors.password)} /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{form.formState.errors.password && <span className="field-error">{form.formState.errors.password.message}</span>}
        {formError && <div className="form-alert" role="alert">{formError}</div>}
        <Button className="login-submit" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Signing in…" : "Sign in"}</Button><p className="login-note">Access is provisioned by a platform administrator. Public registration is not available.</p></form></section>
    </main>
  );
}
