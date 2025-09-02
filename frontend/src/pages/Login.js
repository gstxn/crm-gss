import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import './Login.css';
import axios from 'axios';

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [forgotPassword, setForgotPassword] = useState(false);

  // Schema de validação com Yup
  const loginSchema = Yup.object().shape({
    username: Yup.string().required('Campo obrigatório'),
    password: Yup.string().required('Campo obrigatório'),
  });

  const forgotPasswordSchema = Yup.object().shape({
    email: Yup.string().email('E-mail inválido').required('Campo obrigatório'),
  });

  // Função para lidar com o login
  const handleLogin = async (values, { setSubmitting }) => {
    try {
      const response = await axios.post('/api/users/login', {
        username: values.username,
        password: values.password,
      });
      const { token } = response.data;
      // Caso a API retorne campos de usuário diretamente (sem wrapper 'user')
      const user = response.data.user || (() => {
        const { token: _tok, senha, password, ...rest } = response.data;
        return rest;
      })();

      localStorage.setItem('token', token);
      localStorage.setItem('userInfo', JSON.stringify(user));
      setIsAuthenticated(true);
      navigate('/');
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setSubmitting(false);
    }
  };

  // Função para lidar com a recuperação de senha
  const handleForgotPassword = async (values, { setSubmitting }) => {
    try {
      // Aqui seria feita uma chamada à API para enviar e-mail de recuperação
      // Simulando o envio de e-mail
      setTimeout(() => {
        toast.success('E-mail de recuperação enviado com sucesso!');
        setForgotPassword(false);
      }, 1000);
    } catch (error) {
      toast.error('Erro ao enviar e-mail de recuperação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>GSS CRM</h1>
          <h2>{forgotPassword ? 'Recuperar Senha' : 'Login'}</h2>
        </div>

        {!forgotPassword ? (
          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={handleLogin}
          >
            {({ isSubmitting }) => (
              <Form className="login-form">
                <div className="form-group">
                  <label htmlFor="username">Usuário (E-mail ou CPF)</label>
                  <Field type="text" name="username" className="form-control" />
                  <ErrorMessage name="username" component="div" className="error-message" />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Senha</label>
                  <Field type="password" name="password" className="form-control" />
                  <ErrorMessage name="password" component="div" className="error-message" />
                </div>

                <button 
                  type="button" 
                  className="forgot-password-link"
                  onClick={() => setForgotPassword(true)}
                >
                  Esqueci minha senha
                </button>

                <button 
                  type="button" 
                  className="forgot-password-link"
                  onClick={() => navigate('/register')}
                >
                  Criar conta
                </button>

                <button 
                  type="submit" 
                  className="btn login-btn" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </button>
              </Form>
            )}
          </Formik>
        ) : (
          <Formik
            initialValues={{ email: '' }}
            validationSchema={forgotPasswordSchema}
            onSubmit={handleForgotPassword}
          >
            {({ isSubmitting }) => (
              <Form className="login-form">
                <div className="form-group">
                  <label htmlFor="email">E-mail</label>
                  <Field type="email" name="email" className="form-control" />
                  <ErrorMessage name="email" component="div" className="error-message" />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setForgotPassword(false)}
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit" 
                    className="btn login-btn" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
};

export default Login;