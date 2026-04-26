import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  createUserRequest,
  listUsersRequest,
} from '@/features/users/users-api';
import type { User, UserRole } from '@/features/users/types';

type CreateFormState = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
};

const INITIAL_FORM: CreateFormState = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phone: '',
  role: 'user',
  password: '',
};

function readErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const apiMessage = err.response?.data?.error;
    if (typeof apiMessage === 'string' && apiMessage.length > 0) {
      return apiMessage;
    }
  }
  return fallback;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(query);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateFormState>(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createInfo, setCreateInfo] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function run() {
      setLoading(true);
      setListError(null);
      try {
        const data = await listUsersRequest({ q: query || undefined });
        if (!canceled) {
          setUsers(data.users);
        }
      } catch (err) {
        if (!canceled) {
          setListError(readErrorMessage(err, 'Benutzerliste konnte nicht geladen werden.'));
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      canceled = true;
    };
  }, [query]);

  const canCreate = useMemo(() => {
    return (
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      form.username.trim().length > 0 &&
      form.email.trim().length > 0
    );
  }, [form]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed.length === 0) {
      setSearchParams({});
      return;
    }
    setSearchParams({ q: trimmed });
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) {
      return;
    }

    setCreateError(null);
    setCreateInfo(null);
    setCreating(true);

    try {
      const response = await createUserRequest({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        password: form.password.trim() || undefined,
      });

      setForm(INITIAL_FORM);
      const list = await listUsersRequest({ q: query || undefined });
      setUsers(list.users);

      if (response.temporaryPassword) {
        setCreateInfo(`Temporäres Passwort: ${response.temporaryPassword}`);
      } else {
        setCreateInfo('Benutzer wurde erstellt.');
      }
    } catch (err) {
      setCreateError(readErrorMessage(err, 'Benutzer konnte nicht erstellt werden.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="page user-management-page">
      <h1>Benutzer verwalten</h1>
      <div className="users-two-pane">
        <section className="users-list-pane">
          <form className="users-search-row" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              placeholder="Benutzer suchen"
              aria-label="Benutzer suchen"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit">Suchen</button>
          </form>

          {listError ? <p className="form-error">{listError}</p> : null}
          {loading ? <p>Lade Benutzer...</p> : null}

          {!loading && !listError ? (
            <ul className="users-list">
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="users-list-item"
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    <span className="users-list-name">
                      {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username}
                    </span>
                    <span className="users-list-meta">
                      {user.email} · {user.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="users-form-pane">
          <h2>Benutzer anlegen</h2>
          <form className="users-create-form" onSubmit={handleCreateSubmit}>
            <label>
              Vorname
              <input
                value={form.firstName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, firstName: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Nachname
              <input
                value={form.lastName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, lastName: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Benutzername
              <input
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({ ...current, username: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Telefonnummer
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </label>
            <label>
              Rolle
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({ ...current, role: event.target.value as UserRole }))
                }
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label>
              Passwort (optional)
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                minLength={8}
              />
            </label>

            <button type="submit" disabled={!canCreate || creating}>
              {creating ? 'Erstelle...' : 'Benutzer anlegen'}
            </button>

            {createError ? <p className="form-error">{createError}</p> : null}
            {createInfo ? <p className="form-info">{createInfo}</p> : null}
          </form>
        </section>
      </div>
    </section>
  );
}
