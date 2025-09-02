import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setError('Preencha e-mail e senha válidos');
      return;
    }
    try {
      setLoading(true);
      await axios.post('/api/admin/auth/login', form, { withCredentials: true });
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 p-6 rounded shadow">
        <h1 className="text-xl font-semibold text-center mb-6">Login Admin</h1>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="password">Senha</label>
            <input id="password" name="password" type="password" value={form.password} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;