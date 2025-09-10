import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import './Relatorios.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

const Relatorios = () => {
  const [loading, setLoading] = useState(true);
  interface Stats {
    oportunidades: number;
    medicos: number;
    clientes: number;
  }
  
  interface Count {
    _id: string;
    count: number;
  }
  
  const [stats, setStats] = useState<Stats>({ oportunidades: 0, medicos: 0, clientes: 0 });
  const [oportunidadesStatus, setOportunidadesStatus] = useState<Count[]>([]);
  const [medicosEspecialidade, setMedicosEspecialidade] = useState<Count[]>([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(data.stats);
        setOportunidadesStatus(data.oportunidadesPorStatus);
        setMedicosEspecialidade(data.medicosPorEspecialidade);
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return <div className="loading">Carregando relatórios...</div>;

  const kpiItems = [
    { label: 'Oportunidades', value: stats.oportunidades, color: 'bg-blue-500' },
    { label: 'Médicos', value: stats.medicos, color: 'bg-green-500' },
    { label: 'Clientes', value: stats.clientes, color: 'bg-purple-500' }
  ];

  const chartStatusData = {
    labels: oportunidadesStatus.map((s) => s._id || 'Indefinido'),
    datasets: [
      {
        label: 'Oportunidades por Status',
        data: oportunidadesStatus.map((s) => s.count),
        backgroundColor: '#3b82f6'
      }
    ]
  };

  const chartMedicosData = {
    labels: medicosEspecialidade.map((e) => e._id || 'Indefinido'),
    datasets: [
      {
        label: 'Médicos por Especialidade',
        data: medicosEspecialidade.map((e) => e.count),
        backgroundColor: '#10b981'
      }
    ]
  };

  return (
    <div className="relatorios-container p-4 space-y-8">
      <h1 className="text-2xl font-semibold mb-4">Relatórios</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg shadow p-6 text-white flex flex-col items-center ${item.color}`}
          >
            <span className="text-3xl font-bold">{item.value}</span>
            <span className="uppercase tracking-wider mt-2 text-sm">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
          <Bar data={chartStatusData} options={{ responsive: true, maintainAspectRatio: false }} height={300} />
        </div>
        <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
          <Bar data={chartMedicosData} options={{ responsive: true, maintainAspectRatio: false }} height={300} />
        </div>
      </div>
    </div>
  );
};

export default Relatorios;