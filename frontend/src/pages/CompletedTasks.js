import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CompletedTasks.css';

const CompletedTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/dashboard/tasks/completed', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(data);
      } catch (err) {
        setError('Erro ao carregar tarefas concluídas');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedTasks();
  }, []);

  if (loading) return <div className="loading">Carregando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="completed-tasks-page">
      <h2>Tarefas Concluídas</h2>
      {tasks.length === 0 ? (
        <p>Nenhuma tarefa concluída encontrada.</p>
      ) : (
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Data de Conclusão</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.finishedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CompletedTasks;