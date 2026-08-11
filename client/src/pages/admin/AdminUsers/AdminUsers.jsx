import { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUserStatus, updateUserRole } from '../../../services/adminService';
import styles from '../adminShared.module.scss';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
      });
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    const timeout = setTimeout(load, 300); // debounce search typing
    return () => clearTimeout(timeout);
  }, [load]);

  const handleStatusChange = async (id, status) => {
    setBusyId(id);
    try {
      await updateUserStatus(id, status);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status } : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update user status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleToggle = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    setBusyId(id);
    try {
      await updateUserRole(id, newRole);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role: newRole } : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update user role.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className={styles.title}>Users</h1>

      <div className={styles.filterBar}>
        <input
          className={styles.searchInput}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className={styles.select}
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
        >
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="tutor">Tutor</option>
          <option value="admin">Admin</option>
        </select>
        <select
          className={styles.select}
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {loading && <p className={styles.loadingText}>Loading...</p>}
      {!loading && users.length === 0 && <p className={styles.emptyState}>No users match these filters.</p>}

      {users.map((u) => (
        <div key={u._id} className={styles.card}>
          <div className={styles.info}>
            <div className={styles.primaryText}>{u.name}</div>
            <div className={styles.secondaryText}>
              {u.email} · {u.xp} XP · Joined {new Date(u.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className={styles.rowActions}>
            <span className={`${styles.badge} ${styles[`badge--${u.role}`]}`}>{u.role}</span>
            <span className={`${styles.badge} ${styles[`badge--${u.status}`]}`}>{u.status}</span>

            {u.status === 'active' ? (
              <>
                <button
                  className={`${styles.btn} ${styles['btn--ghost']}`}
                  disabled={busyId === u._id}
                  onClick={() => handleStatusChange(u._id, 'suspended')}
                >
                  Suspend
                </button>
                <button
                  className={`${styles.btn} ${styles['btn--danger']}`}
                  disabled={busyId === u._id}
                  onClick={() => handleStatusChange(u._id, 'banned')}
                >
                  Ban
                </button>
              </>
            ) : (
              <button
                className={`${styles.btn} ${styles['btn--success']}`}
                disabled={busyId === u._id}
                onClick={() => handleStatusChange(u._id, 'active')}
              >
                Reactivate
              </button>
            )}

            {u.role !== 'tutor' && (
              <button
                className={`${styles.btn} ${styles['btn--ghost']}`}
                disabled={busyId === u._id}
                onClick={() => handleRoleToggle(u._id, u.role)}
              >
                {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
              </button>
            )}
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={`${styles.btn} ${styles['btn--ghost']}`}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className={styles.secondaryText}>
            Page {page} of {totalPages}
          </span>
          <button
            className={`${styles.btn} ${styles['btn--ghost']}`}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
