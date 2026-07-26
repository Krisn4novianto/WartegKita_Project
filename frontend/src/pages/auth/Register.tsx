import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api.post("/auth/register", { ...form, role: "CUSTOMER" });
    navigate("/login");
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Buat Akun</h1>
        <input placeholder="Nama" onChange={(e) => update("name", e.target.value)} />
        <input placeholder="Email" onChange={(e) => update("email", e.target.value)} />
        <input placeholder="Nomor Telepon" onChange={(e) => update("phone", e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e) => update("password", e.target.value)} />
        <button className="button full">Register</button>
        <p>Sudah punya akun? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}
