import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getCalendarMonth, createEvent } from '../../services/productivityService';
import styles from './Calendar.module.scss';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toDateKey = (d) => d.toISOString().slice(0, 10);

const Calendar = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [items, setItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [eventTitle, setEventTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      const { data } = await getCalendarMonth(year, month);
      setItems(data.items);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const changeMonth = (delta) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) { newMonth = 12; newYear -= 1; }
    if (newMonth > 12) { newMonth = 1; newYear += 1; }
    setMonth(newMonth);
    setYear(newYear);
  };

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const itemsByDate = {};
  items.forEach((item) => {
    const key = toDateKey(new Date(item.date));
    if (!itemsByDate[key]) itemsByDate[key] = [];
    itemsByDate[key].push(item);
  });

  const selectedItems = itemsByDate[selectedDate] || [];

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    setAdding(true);
    try {
      await createEvent({ title: eventTitle, eventDate: selectedDate });
      setEventTitle('');
      load();
    } finally {
      setAdding(false);
    }
  };

  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendar</h1>
          <p className={styles.subtitle}>Task due dates, deadlines, and events — all in one view.</p>
        </div>
        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={() => changeMonth(-1)}><FiChevronLeft size={16} /></button>
          <span className={styles.monthLabel}>{MONTH_NAMES[month - 1]} {year}</span>
          <button className={styles.navBtn} onClick={() => changeMonth(1)}><FiChevronRight size={16} /></button>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.grid}>
          <div className={styles.weekdays}>
            {WEEKDAYS.map((w, i) => <div key={i} className={styles.weekday}>{w}</div>)}
          </div>
          <div className={styles.days}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} className={`${styles.day} ${styles['day--empty']}`} />;
              const dateKey = toDateKey(new Date(year, month - 1, d));
              const isToday = dateKey === toDateKey(today);
              const isSelected = dateKey === selectedDate;
              const hasItems = !!itemsByDate[dateKey];
              return (
                <div
                  key={i}
                  className={`${styles.day} ${isToday ? styles['day--today'] : ''} ${isSelected ? styles['day--selected'] : ''}`}
                  onClick={() => setSelectedDate(dateKey)}
                >
                  {d}
                  {hasItems && <span className={styles.dayDot} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.sidePanel}>
          <div className={styles.panelTitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>

          {selectedItems.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Nothing on this day.</p>
          )}
          {selectedItems.map((item) => (
            <div key={item.id} className={styles.item}>
              <span className={`${styles.itemDot} ${styles[`itemDot--${item.type}`]}`} />
              <div>
                <div className={styles.itemTitle}>{item.title}</div>
                <div className={styles.itemType}>{item.type}</div>
              </div>
            </div>
          ))}

          <form className={styles.form} onSubmit={handleAddEvent}>
            <input
              className={styles.input}
              placeholder="Add an event to this day..."
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
            />
            <button className={styles.addBtn} type="submit" disabled={adding}>
              {adding ? 'Adding...' : 'Add event'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
