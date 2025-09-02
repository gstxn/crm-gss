import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaBriefcase, FaUserMd, FaHospital, FaChartBar, FaSignOutAlt, FaEnvelope, FaCheckCircle, FaClipboardList } from 'react-icons/fa';
import MensagemBadge from './MensagemBadge';
import './Sidebar.css';
import { FaBars } from 'react-icons/fa';

const Sidebar = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  const handleToggle = () => setCollapsed(!collapsed);
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}> 
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={handleToggle}><FaBars /></button>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaHome className="icon" />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/oportunidades" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaBriefcase className="icon" />
              <span>Oportunidades</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/medicos" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaUserMd className="icon" />
              <span>Médicos</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/clientes" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaHospital className="icon" />
              <span>Clientes</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/relatorios" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaChartBar className="icon" />
              <span>Relatórios</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/mensagens" className={({ isActive }) => isActive ? 'active' : ''}>
              <div className="icon-container">
                <FaEnvelope className="icon" />
                <MensagemBadge />
              </div>
              <span>Mensagens</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/tarefas-pendentes" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaClipboardList className="icon" />
              <span>Tarefas Pendentes</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/tarefas-concluidas" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaCheckCircle className="icon" />
              <span>Tarefas Concluídas</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt className="icon" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;