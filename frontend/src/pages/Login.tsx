import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/useAuth';
import { TokenExpiredError } from '@/context/auth-context';
import { loginRequest } from '@/features/auth/auth-api';

const ERROR_MESSAGES = {
  invalidInput: 'Please enter username/email and password.',
  invalidCredentials: 'Invalid username/email or password.',
  tokenExpired: 'Your session has expired. Please log in again.',
  networkError: 'Unable to reach the server. Please try again.',
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const data = await loginRequest(usernameOrEmail, password);
      login(data.token);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        setError(ERROR_MESSAGES.tokenExpired);
      } else if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 400) {
          setError(ERROR_MESSAGES.invalidInput);
        } else if (status === 401 || status === 403) {
          setError(ERROR_MESSAGES.invalidCredentials);
        } else {
          setError(ERROR_MESSAGES.networkError);
        }
      } else {
        setError(ERROR_MESSAGES.networkError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="login-welcome">Welcome</p>
        <h1>Log in</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="usernameOrEmail">Username or email</label>
          <input
            id="usernameOrEmail"
            name="usernameOrEmail"
            autoComplete="username"
            value={usernameOrEmail}
            onChange={(event) => setUsernameOrEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" className="login-primary" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>

          {error ? <p className="login-error">{error}</p> : null}
        </form>

        <p className="login-link">
          <a href="#" onClick={(e) => e.preventDefault()}>
            Dont have an account? Sign up here
          </a>
        </p>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <button type="button" className="login-google" disabled aria-label="Continue with Google">
          <span className="login-google-icon" aria-hidden="true">G</span>
          <span>Continue with Google</span>
        </button>
      </section>
    </main>
  );
}
