import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", response.data.token);
    navigate("/");
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>WartegKita</h1>
        <p>Masuk untuk mulai pesan makanan.</p>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="button full">Login</button>
        <p>Belum punya akun? <Link to="/register">Register</Link></p>
      </form>
    </div>
  );
}
