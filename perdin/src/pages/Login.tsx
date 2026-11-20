import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Eye, EyeOff, Loader2, LockKeyhole, User } from "lucide-react";
import { Brand } from "../components/Brand";
import { useAuth } from "../contexts/useAuth";
import api, { apiMessage } from "../api/axios";
import coast from "../assets/dinasflow-coast.webp";
import type { LoginResponse } from "../types";

const demos = [
  { name: "Admin", username: "demo_admin" },
  { name: "SDM", username: "demo_sdm" },
  { name: "Pegawai", username: "demo_pegawai" },
];

export default function Login() {
  const { login, isAuthenticated, isLoading: checkingSession } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checkingSession || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post<LoginResponse>("/api/auth/login", { username: username.trim(), password });
      login(data);
    } catch (err) {
      setError(apiMessage(err) || "Gagal masuk. Periksa nama pengguna dan kata sandi Anda.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="df-login">
      <aside className="df-login-hero" aria-label="Perjalanan dinas">
        <img src={coast} alt="" className="df-coast" fetchPriority="high" />
        <div className="df-hero-shade" />
        <div className="df-hero-brand"><Brand /></div>
        <div className="df-route" aria-hidden="true">
          <span className="df-route-start" />
          <span className="df-route-arc" />
          <span className="df-route-end" />
        </div>
        <div className="df-hero-copy">
          <p className="df-kicker">Ruang kerja perjalanan dinas</p>
          <p className="df-hero-title">Setiap perjalanan<br />lebih <em>terarah.</em></p>
          <p className="df-hero-caption">Ajukan perjalanan, tinjau persetujuan, dan pantau statusnya dalam satu tempat.</p>
        </div>
      </aside>

      <section className="df-login-side">
        <div className="df-login-content">
          <div className="df-login-mobile-brand"><Brand /></div>
          <div className="df-login-heading">
            <h1>Masuk ke DinasFlow</h1>
            <p>Gunakan akun Anda untuk membuka ruang kerja.</p>
          </div>
          <form onSubmit={submit} className="df-login-form" aria-busy={submitting}>
            {error && <p role="alert" className="df-error">{error}</p>}
            <div>
              <label htmlFor="username">Nama pengguna</label>
              <div className="df-field">
                <User size={18} aria-hidden="true" />
                <input id="username" name="username" autoComplete="username" autoCapitalize="none" required value={username} onChange={e => setUsername(e.target.value)} placeholder="Masukkan nama pengguna" />
              </div>
            </div>
            <div>
              <label htmlFor="password">Kata sandi</label>
              <div className="df-field">
                <LockKeyhole size={18} aria-hidden="true" />
                <input id="password" name="password" autoComplete="current-password" type={visible ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan kata sandi" />
                <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="df-login-submit" disabled={checkingSession || submitting}>
              {submitting ? <><Loader2 size={18} className="animate-spin" /> Sedang masuk…</> : <>Masuk <ArrowRight size={18} /></>}
            </button>
            <p className="df-login-help">Lupa kata sandi? Hubungi administrator.</p>
          </form>
          <div className="df-demo">
            <h2>Coba akun demo</h2>
            <p>Pilih peran untuk mengisi nama pengguna. Gunakan kata sandi demo dari portofolio.</p>
            <div className="df-demo-roles">
              {demos.map(demo => (
                <button key={demo.username} type="button" aria-pressed={username === demo.username} disabled={submitting} onClick={() => {
                  setUsername(demo.username);
                  setError("");
                  document.getElementById("password")?.focus();
                }}>
                  {demo.name}<ArrowUpRight size={14} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
