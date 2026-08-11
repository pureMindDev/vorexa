import styles from './Input.module.scss';

const Input = ({ label, error, id, ...rest }) => {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${styles.input} ${error ? styles['input--error'] : ''}`}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};

export default Input;
