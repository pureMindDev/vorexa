import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import styles from './ThemeToggle.module.scss';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className={styles.toggle} onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
    </button>
  );
};

export default ThemeToggle;
