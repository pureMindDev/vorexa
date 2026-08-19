import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiZap,
  FiEdit3,
  FiVideo,
  FiUsers,
  FiAward,
  FiFileText,
  FiTrendingUp,
} from 'react-icons/fi';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import Footer from '../../components/Footer/Footer';
import styles from './Landing.module.scss';

const SAMPLE_QUESTIONS = [
  {
    subject: 'Mathematics',
    prompt: 'If 3x + 7 = 22, what is the value of x?',
    options: ['3', '5', '7', '9'],
    correct: 1,
  },
  {
    subject: 'English Language',
    prompt: 'Choose the option nearest in meaning to the word "candid".',
    options: ['Distant', 'Frank', 'Careful', 'Loud'],
    correct: 1,
  },
  {
    subject: 'Physics',
    prompt: 'What is the SI unit of electric current?',
    options: ['Volt', 'Watt', 'Ampere', 'Ohm'],
    correct: 2,
  },
];

const FEATURES = [
  {
    icon: FiZap,
    tint: 'primary',
    title: 'AI Tutor, on call 24/7',
    text: 'Ask a question at midnight before an exam and get a clear, patient explanation — not just an answer.',
  },
  {
    icon: FiEdit3,
    tint: 'accent',
    title: 'Real CBT practice',
    text: 'Timed multiple-choice practice that mirrors the actual JAMB and WAEC computer-based test format.',
  },
  {
    icon: FiVideo,
    tint: 'purple',
    title: 'Live classes',
    text: 'Join scheduled sessions with real tutors, ask questions live, and rewatch the parts you need.',
  },
  {
    icon: FiUsers,
    tint: 'primary',
    title: 'Book a tutor directly',
    text: 'Browse tutors by subject, see reviews from other students, and book a session that fits your schedule.',
  },
  {
    icon: FiAward,
    tint: 'accent',
    title: 'Streaks, XP and badges',
    text: 'Study consistency actually shows up — track your streak, level up, and climb the leaderboard.',
  },
  {
    icon: FiFileText,
    tint: 'purple',
    title: 'CV builder & opportunities',
    text: 'Put together a CV and find scholarships, internships and opportunities worth applying to.',
  },
];

const ROLES = [
  {
    title: 'Students',
    text: 'Practice for JAMB and WAEC, get AI help, book tutors, and study alongside your accountability partners.',
    linkText: 'Start learning',
    to: '/register',
  },
  {
    title: 'Tutors',
    text: 'Set your subjects and availability, run live classes, and get paid for sessions you accept.',
    linkText: 'Apply to tutor',
    to: '/tutor/register',
  },
  {
    title: 'Parents',
    text: "Link your child's account and check their progress, streaks and exam results without hovering.",
    linkText: 'Create a parent account',
    to: '/parent/register',
  },
  {
    title: 'Exam centres',
    text: 'Run mock exams for your students, build custom CBT papers, and see results and reports in one place.',
    linkText: 'Register your centre',
    to: '/centre/register',
  },
];

const Landing = () => {
  const [qIndex, setQIndex] = useState(0);
  const [seconds, setSeconds] = useState(45);

  useEffect(() => {
    const tick = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 45 : s - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const advance = setInterval(() => {
      setQIndex((i) => (i + 1) % SAMPLE_QUESTIONS.length);
      setSeconds(45);
    }, 5000);
    return () => clearInterval(advance);
  }, []);

  const question = SAMPLE_QUESTIONS[qIndex];
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <span className={styles.logo}>Vorexa</span>
          <ul className={styles.navLinks}>
            <li><Link to="/tutors">Find a tutor</Link></li>
            <li><Link to="/become-tutor">Become a tutor</Link></li>
          </ul>
          <div className={styles.navActions}>
            <ThemeToggle />
            <Link to="/login" className={styles.navLoginLink}>Log in</Link>
            <Link to="/register" className={styles.navCta}>Get started</Link>
          </div>
        </div>
      </nav>

      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>JAMB · WAEC · Post-UTME</span>
          <h1 className={styles.headline}>
            Study smarter for the exam that decides <span className={styles.headlineAccent}>everything.</span>
          </h1>
          <p className={styles.subhead}>
            Vorexa brings CBT practice, an AI tutor, live classes and real human tutors into one place —
            built around how JAMB and WAEC actually work.
          </p>
          <div className={styles.heroActions}>
            <Link to="/register" className={styles.ctaPrimary}>Create free account</Link>
            <Link to="/login" className={styles.ctaSecondary}>Log in</Link>
          </div>
          <p className={styles.trustLine}>Free to start. No card required.</p>
        </div>

        <div className={styles.mockWrap}>
          <div className={styles.examCard}>
            <div className={styles.examHeader}>
              <span className={styles.examSubject}>{question.subject}</span>
              <span className={styles.examTimer}>
                <span className={styles.timerDot} />
                {mm}:{ss}
              </span>
            </div>

            <div className={styles.examQuestionNum}>Question {qIndex + 1} of {SAMPLE_QUESTIONS.length}</div>
            <p className={styles.examQuestion}>{question.prompt}</p>

            <div className={styles.examOptions}>
              {question.options.map((opt, i) => (
                <div
                  key={opt}
                  className={`${styles.examOption} ${i === question.correct ? styles.examOptionActive : ''}`}
                >
                  <span className={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
                  {opt}
                </div>
              ))}
            </div>

            <div className={styles.examProgress}>
              {SAMPLE_QUESTIONS.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.progressDot} ${
                    i < qIndex ? styles.progressDotDone : i === qIndex ? styles.progressDotActive : ''
                  }`}
                />
              ))}
            </div>

            <div className={styles.xpBadge}>
              <FiTrendingUp size={14} />
              +30 XP
            </div>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionEyebrow}>Everything you need</div>
          <h2 className={styles.sectionTitle}>One app, not six tabs</h2>
          <p className={styles.sectionSub}>
            Practice questions, tutoring, live classes and progress tracking — usually scattered across
            different apps and group chats — live in one place.
          </p>
        </div>

        <div className={styles.featureGrid}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const tintMap = {
              primary: { bg: '#EFF6FF', color: '#2563EB' },
              accent: { bg: '#ECFDF5', color: '#047857' },
              purple: { bg: '#F5F3FF', color: '#6D28D9' },
            };
            const t = tintMap[f.tint];
            return (
              <div className={styles.featureCard} key={f.title}>
                <div className={styles.featureIcon} style={{ background: t.bg, color: t.color }}>
                  <Icon size={18} />
                </div>
                <div className={styles.featureTitle}>{f.title}</div>
                <p className={styles.featureText}>{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.rolesSection}>
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionEyebrow}>Built for the whole journey</div>
            <h2 className={styles.sectionTitle}>Not just for students</h2>
            <p className={styles.sectionSub}>
              Vorexa has a dedicated space for everyone involved in getting a student through their exams.
            </p>
          </div>

          <div className={styles.roleGrid}>
            {ROLES.map((r) => (
              <Link to={r.to} className={styles.roleCard} key={r.title}>
                <div className={styles.roleTitle}>{r.title}</div>
                <p className={styles.roleText}>{r.text}</p>
                <span className={styles.roleLink}>{r.linkText} &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.ctaBand}>
          <h2 className={styles.ctaBandTitle}>Your first practice exam is two minutes away</h2>
          <p className={styles.ctaBandSub}>
            Create an account, pick your subjects, and start practicing — no card, no waiting.
          </p>
          <div className={styles.ctaBandActions}>
            <Link to="/register" className={styles.ctaPrimary}>Create free account</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
