import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axios from 'axios';
import './Login.css';

const Register = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const registerSchema = Yup.object().shape({
    nome: Yup.string().required('Campo obrigatório'),
    email: Yup.string().email('E-mail inválido').required('Campo obrigatório'),
    cpf: Yup.string().required('Campo obrigatório'),
    senha: Yup.string().required('Campo obrigatório'),
    cargo: Yup.string().required('Campo obrigatório'),
    telefone: Yup.string().required('Campo obrigatório'),
  });

  const handleRegister = async (values, { setSubmitting }) => {
    try {
      const response = await axios.post('/api/users/register', {
        nome: values.nome,
        email: values.email,
        cpf: values.cpf,
        senha: values.senha,
        cargo: values.cargo,
        telefone: values.telefone,
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userInfo', JSON.stringify(user));
      setIsAuthenticated(true);
      navigate('/');
      toast.success('Cadastro realizado com sucesso!');
    } catch (error) {
      console.error('Erro no cadastro:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>GSS CRM</h1>
          <h2>Cadastro</h2>
        </div>
        <Formik
          initialValues={{
            nome: '',
            email: '',
            cpf: '',
            senha: '',
            cargo: '',
            telefone: '',
          }}
          validationSchema={registerSchema}
          onSubmit={handleRegister}
        >
          {({ isSubmitting }) => (
            <Form className="login-form">
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <Field type="text" name="nome" className="form-control" />
                <ErrorMessage name="nome" component="div" className="error-message" />
              </div>
              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <Field type="email" name="email" className="form-control" />
                <ErrorMessage name="email" component="div" className="error-message" />
              </div>
              <div className="form-group">
                <label htmlFor="cpf">CPF</label>
                <Field type="text" name="cpf" className="form-control" />
                <ErrorMessage name="cpf" component="div" className="error-message" />
              </div>
              <div className="form-group">
                <label htmlFor="senha">Senha</label>
                <Field type="password" name="senha" className="form-control" />
                <ErrorMessage name="senha" component="div" className="error-message" />
              </div>
              <div className="form-group">
                <label htmlFor="cargo">Cargo</label>
                <Field type="text" name="cargo" className="form-control" />
                <ErrorMessage name="cargo" component="div" className="error-message" />
              </div>
              <div className="form-group">
                <label htmlFor="telefone">Telefone</label>
                <Field type="text" name="telefone" className="form-control" />
                <ErrorMessage name="telefone" component="div" className="error-message" />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/login')}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="btn login-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Register;