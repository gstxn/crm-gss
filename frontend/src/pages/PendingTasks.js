import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './PendingTasks.css';
import { FaPlus, FaCheck } from 'react-icons/fa';

const PendingTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ titulo: '', descricao: '', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch pending tasks
  const fetchPending = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/tasks/pending', axiosConfig);
      setTasks(data);
    } catch (err) {
      setError('Erro ao carregar tarefas pendentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create task
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    try {
      setSubmitting(true);
      await axios.post('/api/tasks', form, axiosConfig);
      setForm({ titulo: '', descricao: '', dueDate: '' });
      fetchPending();
    } catch (err) {
      setError('Erro ao criar tarefa');
    } finally {
      setSubmitting(false);
    }
  };

  // Mark task completed
  const markCompleted = async (id) => {
    try {
      await axios.put(`/api/tasks/${id}`, { status: 'completed' }, axiosConfig);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      setError('Erro ao atualizar tarefa');
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="pending-tasks-page">
      <h2>Tarefas Pendentes</h2>

      <form className="task-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="titulo"
          placeholder="Título da tarefa"
          value={form.titulo}
          onChange={handleChange}
          required
        />
        <textarea
          name="descricao"
          placeholder="Descrição (opcional)"
          value={form.descricao}
          onChange={handleChange}
        />
        <input
          type="date"
          name="dueDate"
          value={form.dueDate}
          onChange={handleChange}
        />
        <button type="submit" disabled={submitting}>
          <FaPlus /> Adicionar
        </button>
      </form>

      {tasks.length === 0 ? (
        <p>Nenhuma tarefa pendente.</p>
      ) : (
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Descrição</th>
              <th>Data limite</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id}>
                <td>{task.titulo}</td>
                <td>{task.descricao}</td>
                <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                <td>
                  <button className="complete-btn" onClick={() => markCompleted(task._id)}>
                    <FaCheck /> Concluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PendingTasks;