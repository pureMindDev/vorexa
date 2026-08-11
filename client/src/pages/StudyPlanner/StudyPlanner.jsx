import { useState, useEffect } from 'react';
import { FiCheck, FiTrash2, FiZap, FiBell, FiFlag } from 'react-icons/fi';
import { createTask, getTasks, toggleTask, deleteTask } from '../../services/taskService';
import { createHabit, getHabits, toggleHabitToday, deleteHabit } from '../../services/habitService';
import { createReminder, getReminders, deleteReminder, createGoal, getGoals, toggleGoal, deleteGoal } from '../../services/productivityService';
import styles from './StudyPlanner.module.scss';

const StudyPlanner = () => {
  const [tab, setTab] = useState('tasks');

  // Tasks
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Habits
  const [habits, setHabits] = useState([]);
  const [habitName, setHabitName] = useState('');
  const [loadingHabits, setLoadingHabits] = useState(true);

  // Reminders
  const [reminders, setReminders] = useState([]);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [loadingReminders, setLoadingReminders] = useState(true);

  // Goals
  const [goals, setGoals] = useState([]);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [loadingGoals, setLoadingGoals] = useState(true);

  const [error, setError] = useState('');

  const loadTasks = async () => {
    try { const { data } = await getTasks(); setTasks(data.tasks); } finally { setLoadingTasks(false); }
  };
  const loadHabits = async () => {
    try { const { data } = await getHabits(); setHabits(data.habits); } finally { setLoadingHabits(false); }
  };
  const loadReminders = async () => {
    try { const { data } = await getReminders(); setReminders(data.reminders); } finally { setLoadingReminders(false); }
  };
  const loadGoals = async () => {
    try { const { data } = await getGoals(); setGoals(data.goals); } finally { setLoadingGoals(false); }
  };

  useEffect(() => {
    loadTasks();
    loadHabits();
    loadReminders();
    loadGoals();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setError('');
    try {
      await createTask({ title: taskTitle, subject: taskSubject, dueDate: taskDueDate || null });
      setTaskTitle(''); setTaskSubject(''); setTaskDueDate('');
      loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add task.');
    }
  };

  const handleToggleTask = async (id) => {
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, completed: !t.completed } : t)));
    try { await toggleTask(id); } catch { loadTasks(); }
  };

  const handleDeleteTask = async (id) => {
    setTasks((prev) => prev.filter((t) => t._id !== id));
    try { await deleteTask(id); } catch { loadTasks(); }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    setError('');
    try {
      await createHabit({ name: habitName });
      setHabitName('');
      loadHabits();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add habit.');
    }
  };

  const handleToggleHabit = async (id) => {
    try {
      const { data } = await toggleHabitToday(id);
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, doneToday: data.doneToday, streak: data.streak } : h)));
    } catch { loadHabits(); }
  };

  const handleDeleteHabit = async (id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    try { await deleteHabit(id); } catch { loadHabits(); }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderTime) return;
    setError('');
    try {
      await createReminder({ title: reminderTitle, remindAt: reminderTime });
      setReminderTitle(''); setReminderTime('');
      loadReminders();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add reminder.');
    }
  };

  const handleDeleteReminder = async (id) => {
    setReminders((prev) => prev.filter((r) => r._id !== id));
    try { await deleteReminder(id); } catch { loadReminders(); }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    setError('');
    try {
      await createGoal({ title: goalTitle, targetDate: goalTargetDate || null });
      setGoalTitle(''); setGoalTargetDate('');
      loadGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add goal.');
    }
  };

  const handleToggleGoal = async (id) => {
    setGoals((prev) => prev.map((g) => (g._id === id ? { ...g, completed: !g.completed } : g)));
    try { await toggleGoal(id); } catch { loadGoals(); }
  };

  const handleDeleteGoal = async (id) => {
    setGoals((prev) => prev.filter((g) => g._id !== id));
    try { await deleteGoal(id); } catch { loadGoals(); }
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Study Planner</h1>
        <p className={styles.subtitle}>Tasks, habits, reminders, and goals — all in one place.</p>
      </div>

      <div className={styles.tabs}>
        <div className={`${styles.tab} ${tab === 'tasks' ? styles['tab--active'] : ''}`} onClick={() => setTab('tasks')}>Tasks</div>
        <div className={`${styles.tab} ${tab === 'habits' ? styles['tab--active'] : ''}`} onClick={() => setTab('habits')}>Habit Tracker</div>
        <div className={`${styles.tab} ${tab === 'reminders' ? styles['tab--active'] : ''}`} onClick={() => setTab('reminders')}>Reminders</div>
        <div className={`${styles.tab} ${tab === 'goals' ? styles['tab--active'] : ''}`} onClick={() => setTab('goals')}>Goals</div>
      </div>

      {error && <p style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</p>}

      {tab === 'tasks' && (
        <>
          <form className={styles.form} onSubmit={handleAddTask}>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label}>Task</label>
                <input className={styles.input} placeholder="e.g. Review Waves and Optics" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              </div>
              <div className={styles.narrowField}>
                <label className={styles.label}>Subject (optional)</label>
                <input className={styles.input} placeholder="e.g. Physics" value={taskSubject} onChange={(e) => setTaskSubject(e.target.value)} />
              </div>
              <div className={styles.narrowField}>
                <label className={styles.label}>Due date (optional)</label>
                <input type="date" className={styles.input} value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
              </div>
              <button className={styles.addBtn} type="submit">Add task</button>
            </div>
          </form>

          {loadingTasks && <p style={{ color: 'var(--text-secondary)' }}>Loading tasks...</p>}
          {!loadingTasks && tasks.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No tasks yet — add one above to get started.</p>}

          {tasks.map((t) => (
            <div key={t._id} className={`${styles.taskItem} ${t.completed ? styles['taskItem--completed'] : ''}`}>
              <div className={`${styles.checkbox} ${t.completed ? styles['checkbox--checked'] : ''}`} onClick={() => handleToggleTask(t._id)}>
                {t.completed && <FiCheck size={14} />}
              </div>
              <div className={styles.taskInfo}>
                <div className={styles.taskTitle}>{t.title}</div>
                {(t.subject || t.dueDate) && (
                  <div className={styles.taskMeta}>
                    {t.subject}{t.subject && t.dueDate ? ' · ' : ''}
                    {t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : ''}
                  </div>
                )}
              </div>
              <button className={styles.deleteBtn} onClick={() => handleDeleteTask(t._id)} aria-label="Delete task"><FiTrash2 size={15} /></button>
            </div>
          ))}
        </>
      )}

      {tab === 'habits' && (
        <>
          <form className={styles.form} onSubmit={handleAddHabit}>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label}>New habit</label>
                <input className={styles.input} placeholder="e.g. Study for 30 minutes" value={habitName} onChange={(e) => setHabitName(e.target.value)} />
              </div>
              <button className={styles.addBtn} type="submit">Add habit</button>
            </div>
          </form>

          {loadingHabits && <p style={{ color: 'var(--text-secondary)' }}>Loading habits...</p>}
          {!loadingHabits && habits.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No habits yet — add one above to start building a streak.</p>}

          <div className={styles.habitGrid}>
            {habits.map((h) => (
              <div key={h.id} className={styles.habitCard}>
                <button className={styles.habitDeleteBtn} onClick={() => handleDeleteHabit(h.id)} aria-label="Delete habit"><FiTrash2 size={14} /></button>
                <div className={styles.habitIcon}>{h.icon}</div>
                <div className={styles.habitName}>{h.name}</div>
                <div className={styles.habitStreak}><FiZap size={12} style={{ verticalAlign: '-1px' }} /> {h.streak} day streak</div>
                <button className={`${styles.habitToggle} ${h.doneToday ? styles['habitToggle--done'] : ''}`} onClick={() => handleToggleHabit(h.id)}>
                  {h.doneToday ? 'Done today ✓' : 'Mark done today'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'reminders' && (
        <>
          <form className={styles.form} onSubmit={handleAddReminder}>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label}>Reminder</label>
                <input className={styles.input} placeholder="e.g. Start revision for Physics CBT" value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} />
              </div>
              <div className={styles.narrowField}>
                <label className={styles.label}>Remind me at</label>
                <input type="datetime-local" className={styles.input} value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
              </div>
              <button className={styles.addBtn} type="submit">Add reminder</button>
            </div>
          </form>

          {loadingReminders && <p style={{ color: 'var(--text-secondary)' }}>Loading reminders...</p>}
          {!loadingReminders && reminders.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No reminders set — add one above and you'll get a notification when it's time.</p>}

          {reminders.map((r) => (
            <div key={r._id} className={styles.taskItem}>
              <div className={styles.checkbox} style={{ cursor: 'default' }}><FiBell size={12} /></div>
              <div className={styles.taskInfo}>
                <div className={styles.taskTitle}>{r.title}</div>
                <div className={styles.taskMeta}>
                  {r.notified ? 'Notified' : 'Upcoming'} · {new Date(r.remindAt).toLocaleString()}
                </div>
              </div>
              <button className={styles.deleteBtn} onClick={() => handleDeleteReminder(r._id)} aria-label="Delete reminder"><FiTrash2 size={15} /></button>
            </div>
          ))}
        </>
      )}

      {tab === 'goals' && (
        <>
          <form className={styles.form} onSubmit={handleAddGoal}>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label}>Goal</label>
                <input className={styles.input} placeholder="e.g. Score 280+ in JAMB" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} />
              </div>
              <div className={styles.narrowField}>
                <label className={styles.label}>Target date (optional)</label>
                <input type="date" className={styles.input} value={goalTargetDate} onChange={(e) => setGoalTargetDate(e.target.value)} />
              </div>
              <button className={styles.addBtn} type="submit">Add goal</button>
            </div>
          </form>

          {loadingGoals && <p style={{ color: 'var(--text-secondary)' }}>Loading goals...</p>}
          {!loadingGoals && goals.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No goals yet — set your first one above.</p>}

          {goals.map((g) => (
            <div key={g._id} className={`${styles.taskItem} ${g.completed ? styles['taskItem--completed'] : ''}`}>
              <div className={`${styles.checkbox} ${g.completed ? styles['checkbox--checked'] : ''}`} onClick={() => handleToggleGoal(g._id)}>
                {g.completed ? <FiCheck size={14} /> : <FiFlag size={11} />}
              </div>
              <div className={styles.taskInfo}>
                <div className={styles.taskTitle}>{g.title}</div>
                {g.targetDate && <div className={styles.taskMeta}>Target: {new Date(g.targetDate).toLocaleDateString()}</div>}
              </div>
              <button className={styles.deleteBtn} onClick={() => handleDeleteGoal(g._id)} aria-label="Delete goal"><FiTrash2 size={15} /></button>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default StudyPlanner;
