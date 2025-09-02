import React, { useState } from 'react';
import { FaSave } from 'react-icons/fa';

type ConfiguracaoGeral = {
  nomeEmpresa: string;
  emailContato: string;
  telefoneContato: string;
  enderecoEmpresa: string;
  logoUrl: string;
};

type ConfiguracaoEmail = {
  smtpServer: string;
  smtpPorta: string;
  smtpUsuario: string;
  smtpSenha: string;
  emailRemetente: string;
  nomeRemetente: string;
};

type ConfiguracaoNotificacao = {
  notificarNovasOportunidades: boolean;
  notificarAtualizacoesOportunidades: boolean;
  notificarNovosMedicos: boolean;
  notificarNovosClientes: boolean;
  emailsNotificacao: string;
};

const AdminConfiguracoes: React.FC = () => {
  // Estado para as configurações gerais
  const [configGeral, setConfigGeral] = useState<ConfiguracaoGeral>({
    nomeEmpresa: 'CRM Médico',
    emailContato: 'contato@crmmedico.com',
    telefoneContato: '(11) 3456-7890',
    enderecoEmpresa: 'Av. Paulista, 1000, São Paulo - SP',
    logoUrl: '/logo.png',
  });

  // Estado para as configurações de email
  const [configEmail, setConfigEmail] = useState<ConfiguracaoEmail>({
    smtpServer: 'smtp.exemplo.com',
    smtpPorta: '587',
    smtpUsuario: 'usuario@exemplo.com',
    smtpSenha: '********',
    emailRemetente: 'noreply@crmmedico.com',
    nomeRemetente: 'CRM Médico',
  });

  // Estado para as configurações de notificação
  const [configNotificacao, setConfigNotificacao] = useState<ConfiguracaoNotificacao>({
    notificarNovasOportunidades: true,
    notificarAtualizacoesOportunidades: true,
    notificarNovosMedicos: false,
    notificarNovosClientes: true,
    emailsNotificacao: 'admin@crmmedico.com, gerente@crmmedico.com',
  });

  // Manipuladores de alteração para cada tipo de configuração
  const handleGeralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfigGeral((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfigEmail((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificacaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfigNotificacao((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Função para salvar todas as configurações
  const handleSaveConfig = () => {
    console.log('Salvando configurações...');
    console.log('Configurações Gerais:', configGeral);
    console.log('Configurações de Email:', configEmail);
    console.log('Configurações de Notificação:', configNotificacao);
    // Aqui seria implementada a chamada à API para salvar as configurações
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Configurações do Sistema</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
          onClick={handleSaveConfig}
        >
          <FaSave size={14} />
          <span>Salvar Configurações</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Configurações Gerais */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Configurações Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nomeEmpresa" className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Empresa
              </label>
              <input
                type="text"
                id="nomeEmpresa"
                name="nomeEmpresa"
                value={configGeral.nomeEmpresa}
                onChange={handleGeralChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="emailContato" className="block text-sm font-medium text-gray-700 mb-1">
                Email de Contato
              </label>
              <input
                type="email"
                id="emailContato"
                name="emailContato"
                value={configGeral.emailContato}
                onChange={handleGeralChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="telefoneContato" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone de Contato
              </label>
              <input
                type="text"
                id="telefoneContato"
                name="telefoneContato"
                value={configGeral.telefoneContato}
                onChange={handleGeralChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="enderecoEmpresa" className="block text-sm font-medium text-gray-700 mb-1">
                Endereço da Empresa
              </label>
              <input
                type="text"
                id="enderecoEmpresa"
                name="enderecoEmpresa"
                value={configGeral.enderecoEmpresa}
                onChange={handleGeralChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                URL do Logo
              </label>
              <input
                type="text"
                id="logoUrl"
                name="logoUrl"
                value={configGeral.logoUrl}
                onChange={handleGeralChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Configurações de Email */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Configurações de Email</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="smtpServer" className="block text-sm font-medium text-gray-700 mb-1">
                Servidor SMTP
              </label>
              <input
                type="text"
                id="smtpServer"
                name="smtpServer"
                value={configEmail.smtpServer}
                onChange={handleEmailChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="smtpPorta" className="block text-sm font-medium text-gray-700 mb-1">
                Porta SMTP
              </label>
              <input
                type="text"
                id="smtpPorta"
                name="smtpPorta"
                value={configEmail.smtpPorta}
                onChange={handleEmailChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="smtpUsuario" className="block text-sm font-medium text-gray-700 mb-1">
                Usuário SMTP
              </label>
              <input
                type="text"
                id="smtpUsuario"
                name="smtpUsuario"
                value={configEmail.smtpUsuario}
                onChange={handleEmailChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="smtpSenha" className="block text-sm font-medium text-gray-700 mb-1">
                Senha SMTP
              </label>
              <input
                type="password"
                id="smtpSenha"
                name="smtpSenha"
                value={configEmail.smtpSenha}
                onChange={handleEmailChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="emailRemetente" className="block text-sm font-medium text-gray-700 mb-1">
                Email do Remetente
              </label>
              <input
                type="email"
                id="emailRemetente"
                name="emailRemetente"
                value={configEmail.emailRemetente}
                onChange={handleEmailChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="nomeRemetente" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Remetente
              </label>
              <input
                type="text"
                id="nomeRemetente"
                name="nomeRemetente"
                value={configEmail.nomeRemetente}
                onChange={handleEmailChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Configurações de Notificação */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Configurações de Notificação</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notificarNovasOportunidades"
                name="notificarNovasOportunidades"
                checked={configNotificacao.notificarNovasOportunidades}
                onChange={handleNotificacaoChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notificarNovasOportunidades" className="ml-2 block text-sm text-gray-700">
                Notificar sobre novas oportunidades
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notificarAtualizacoesOportunidades"
                name="notificarAtualizacoesOportunidades"
                checked={configNotificacao.notificarAtualizacoesOportunidades}
                onChange={handleNotificacaoChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notificarAtualizacoesOportunidades" className="ml-2 block text-sm text-gray-700">
                Notificar sobre atualizações de oportunidades
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notificarNovosMedicos"
                name="notificarNovosMedicos"
                checked={configNotificacao.notificarNovosMedicos}
                onChange={handleNotificacaoChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notificarNovosMedicos" className="ml-2 block text-sm text-gray-700">
                Notificar sobre novos médicos cadastrados
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notificarNovosClientes"
                name="notificarNovosClientes"
                checked={configNotificacao.notificarNovosClientes}
                onChange={handleNotificacaoChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notificarNovosClientes" className="ml-2 block text-sm text-gray-700">
                Notificar sobre novos clientes cadastrados
              </label>
            </div>
            <div className="mt-4">
              <label htmlFor="emailsNotificacao" className="block text-sm font-medium text-gray-700 mb-1">
                Emails para Notificação (separados por vírgula)
              </label>
              <input
                type="text"
                id="emailsNotificacao"
                name="emailsNotificacao"
                value={configNotificacao.emailsNotificacao}
                onChange={handleNotificacaoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConfiguracoes;