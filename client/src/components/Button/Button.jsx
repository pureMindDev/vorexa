import styles from './Button.module.scss';

const Button = ({
  children,
  variant = 'primary',
  loading = false,
  type = 'button',
  disabled = false,
  onClick,
  ...rest
}) => {
  const classNames = [
    styles.btn,
    styles[`btn--${variant}`],
    loading ? styles['btn--loading'] : '',
  ].join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
