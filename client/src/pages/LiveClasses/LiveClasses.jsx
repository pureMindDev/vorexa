import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiVideo, FiX } from 'react-icons/fi';
import { getMyLiveClasses, createLiveClass } from '../../services/liveClassService';
import { getGroups } from '../../services/groupService';
import { getMyBookingsAsStudent } from '../../services/bookingService';
import { getMyCentre } from '../../services/centreService';
import { liveClassesBasePath } from '../../utils/roleRoutes';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import styles from './LiveClasses.module.scss';

// Fallback poll in case a socket push is missed — a class going live is time-sensitive enough
// that we don't want to rely on the socket alone.
const POLL_INTERVAL_MS = 30000;

const LiveClasses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const isCentre = user?.role === 'centre';
  const isTutor = user?.role === 'tutor';
  const roomBasePath = liveClassesBasePath(user?.role);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [groups, setGroups] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [centreId, setCentreId] = useState(null);
  const [form, setForm] = useState({ title: '', subject: '', scheduledFor: '', durationMinutes: 60, target: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMyLiveClasses();
      setClasses(data.liveClasses);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load live classes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // A class going live is time-sensitive — poll periodically, and refresh instantly on the
  // socket push from the host starting/ending the class.
  useEffect(() => {
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const handleStatusChange = () => load();
    socket.on('live:class-status-changed', handleStatusChange);
    return () => socket.off('live:class-status-changed', handleStatusChange);
  }, [socket, load]);

  const openForm = async () => {
    setShowForm(true);
    if (isCentre) {
      try {
        const { data } = await getMyCentre();
        setCentreId(data.centre._id);
      } catch {
        setError('Create your centre profile before scheduling classes.');
      }
      return;
    }
    // Tutors don't need to pick a booking to schedule — an untied class is automatically
    // open to every student with an accepted booking with them (see the note in the form).
    // Only fetch bookings for students, who do still need to pick one.
    try {
      if (isTutor) {
        const { data } = await getGroups({ mine: 'true' });
        setGroups(data.groups);
      } else {
        const [groupsRes, bookingsRes] = await Promise.all([
          getGroups({ mine: 'true' }),
          getMyBookingsAsStudent(),
        ]);
        setGroups(groupsRes.data.groups);
        setBookings((bookingsRes.data.bookings || []).filter((b) => b.status === 'accepted'));
      }
    } catch {
      // form still usable with whatever loaded
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    // Students still need to pick a group or booking; tutors don't — an untied class opens
    // automatically to every student with an accepted booking with them.
    if (!form.title.trim() || !form.scheduledFor || (!isCentre && !isTutor && !form.target)) {
      setError('Please fill in a title, time, and choose a group or booking.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        subject: form.subject.trim(),
        scheduledFor: form.scheduledFor,
        durationMinutes: Number(form.durationMinutes) || 60,
      };
      if (isCentre) {
        payload.centreId = centreId;
      } else if (form.target) {
        const [type, targetId] = form.target.split(':');
        payload[type === 'group' ? 'groupId' : 'bookingId'] = targetId;
      }
      // else: tutor left it untied on purpose — open class, no groupId/bookingId sent.
      await createLiveClass(payload);
      setShowForm(false);
      setForm({ title: '', subject: '', scheduledFor: '', durationMinutes: 60, target: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not schedule the class.');
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const live = classes.filter((c) => c.status === 'live');
  const upcoming = classes.filter((c) => c.status === 'scheduled' && new Date(c.scheduledFor) >= now);
  const past = classes.filter((c) => c.status === 'ended' || (c.status === 'scheduled' && new Date(c.scheduledFor) < now));

  const renderClassCard = (c) => (
    <div key={c.id} className={styles.card} onClick={() => navigate(`${roomBasePath}/${c.id}`)}>
      <div className={styles.info}>
        <div className={styles.primaryText}>{c.title}</div>
        <div className={styles.secondaryText}>
          {c.hostName ? `Hosted by ${c.hostName} · ` : ''}
          {new Date(c.scheduledFor).toLocaleString()} · {c.durationMinutes} min
        </div>
      </div>
      <span className={`${styles.badge} ${styles[`badge--${c.status}`]}`}>
        {c.status === 'live' ? '🔴 Live now' : c.status}
      </span>
    </div>
  );

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Live Classes</h1>
        <button className={styles.scheduleBtn} onClick={openForm}>
          <FiPlus size={15} /> Schedule
        </button>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {loading && <p className={styles.loadingText}>Loading...</p>}

      {live.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}><FiVideo size={16} /> Live now</h2>
          {live.map(renderClassCard)}
        </>
      )}

      <h2 className={styles.sectionTitle}>Upcoming</h2>
      {!loading && upcoming.length === 0 && <p className={styles.emptyState}>Nothing scheduled yet.</p>}
      {upcoming.map(renderClassCard)}

      {past.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Past</h2>
          {past.map(renderClassCard)}
        </>
      )}

      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Schedule a live class</span>
              <FiX size={18} style={{ cursor: 'pointer' }} onClick={() => setShowForm(false)} />
            </div>
            <form onSubmit={handleCreate}>
              <input
                className={styles.modalInput}
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <input
                className={styles.modalInput}
                placeholder="Subject (optional)"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
              <select
                className={styles.modalInput}
                value={form.target}
                onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                style={isCentre ? { display: 'none' } : undefined}
              >
                <option value="">
                  {isTutor ? 'Open to all your students (default) — or pick a group...' : 'Select a group or booking...'}
                </option>
                {groups.length > 0 && (
                  <optgroup label="Study Groups">
                    {groups.map((g) => (
                      <option key={g.id} value={`group:${g.id}`}>{g.name}</option>
                    ))}
                  </optgroup>
                )}
                {!isTutor && bookings.length > 0 && (
                  <optgroup label="Tutor Bookings">
                    {bookings.map((b) => (
                      <option key={b.id} value={`booking:${b.id}`}>
                        {b.subject || 'Session'} with {b.tutorName}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {isCentre && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  This class will be scheduled for all active members of your centre.
                </p>
              )}
              {isTutor && !form.target && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Every student with an accepted booking with you will be able to join — no need to pick one.
                </p>
              )}
              <label className={styles.fieldLabel} htmlFor="live-class-datetime">Date &amp; time</label>
              <input
                id="live-class-datetime"
                className={styles.modalInput}
                type="datetime-local"
                min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                value={form.scheduledFor}
                onChange={(e) => setForm((f) => ({ ...f, scheduledFor: e.target.value }))}
                required
              />
              <label className={styles.fieldLabel} htmlFor="live-class-duration">Duration (minutes)</label>
              <input
                id="live-class-duration"
                className={styles.modalInput}
                type="number"
                min="15"
                step="15"
                placeholder="e.g. 60"
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
              />
              <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? 'Scheduling...' : 'Schedule class'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClasses;
