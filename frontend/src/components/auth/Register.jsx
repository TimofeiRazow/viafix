import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth';

const Register = ({ onLanguageSelect }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    language: 'ru'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (formData.username.length < 3) {
      newErrors.username = 'Имя пользователя должно быть не менее 3 символов';
    }

    if (!formData.email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.email = 'Введите корректный email';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      if (onLanguageSelect) {
        onLanguageSelect(formData.language);
      }
      navigate('/complaints');
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data?.detail) {
        setErrors({ submit: error.response.data.detail });
      } else {
        setErrors({ submit: 'Ошибка регистрации. Попробуйте еще раз.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          color: 'var(--primary-color)',
          marginBottom: '0.5rem'
        }}>
          ViaFix
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Регистрация администратора</p>
      </div>

      {errors.submit && (
        <div style={{
          background: 'var(--error-color)',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}>
            Имя пользователя *
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${errors.username ? 'var(--error-color)' : 'var(--border)'}`,
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            placeholder="Введите имя пользователя"
          />
          {errors.username && (
            <span style={{ 
              color: 'var(--error-color)', 
              fontSize: '0.875rem',
              marginTop: '0.25rem',
              display: 'block'
            }}>
              {errors.username}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}>
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${errors.email ? 'var(--error-color)' : 'var(--border)'}`,
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            placeholder="Введите email"
          />
          {errors.email && (
            <span style={{ 
              color: 'var(--error-color)', 
              fontSize: '0.875rem',
              marginTop: '0.25rem',
              display: 'block'
            }}>
              {errors.email}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}>
            Пароль *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${errors.password ? 'var(--error-color)' : 'var(--border)'}`,
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            placeholder="Введите пароль"
          />
          {errors.password && (
            <span style={{ 
              color: 'var(--error-color)', 
              fontSize: '0.875rem',
              marginTop: '0.25rem',
              display: 'block'
            }}>
              {errors.password}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}>
            Подтверждение пароля *
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${errors.confirmPassword ? 'var(--error-color)' : 'var(--border)'}`,
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            placeholder="Повторите пароль"
          />
          {errors.confirmPassword && (
            <span style={{ 
              color: 'var(--error-color)', 
              fontSize: '0.875rem',
              marginTop: '0.25rem',
              display: 'block'
            }}>
              {errors.confirmPassword}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}>
            Язык / Language
          </label>
          <select 
            name="language"
            value={formData.language}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '1rem',
              background: 'var(--surface)'
            }}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="kz">Қазақша</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border)'
      }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          Уже есть аккаунт?{' '}
        </span>
        <Link 
          to="/login" 
          style={{ 
            color: 'var(--primary-color)',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Войти
        </Link>
      </div>
    </div>
  );
};

export default Register;