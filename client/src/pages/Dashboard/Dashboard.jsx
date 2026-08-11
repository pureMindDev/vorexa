import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiZap, FiTrendingUp, FiTarget, FiBookOpen, FiClock, FiMessageCircle,
  FiCpu, FiVideo, FiStar, FiAward,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getCourses } from '../../services/courseService';
import { getResults } from '../../services/cbtService';
import { getMyLiveClasses } from '../../services/liveClassService';
import { getMyFollowing } from '../../services/followService';
import { getTutors } from '../../services/tutorService';
import styles from './Dashboard.module.scss';

const quickActions = [
  { label: 'Continue Learning', icon: FiBookOpen, to: '/learning', color: 'blue' },
  { label: 'Start CBT', icon: FiClock, to: '/cbt', color: 'purple' },
  { label: 'Ask AI Tutor', icon: FiMessageCircle, to: '/ai-tutor', color: 'green' },
  { label: 'View Progress', icon: FiTrendingUp, to: '/profile', color: 'amber' },
];

const ICON_BG = {
  blue: '#EFF6FF', purple: '#F5F3FF', green: '#ECFDF5', amber: '#FFFBEB',
};
const ICON_COLOR = {
  blue: '#2563EB', purple: '#7C3AED', green: '#10B981', amber: '#F59E0B',
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [continueLearning, setContinueLearning] = useState([]);
  const [cbtAverage, setCbtAverage] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [coursesInProgress, setCoursesInProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const [nextLiveClass, setNextLiveClass] = useState(null);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [suggestedTutors, setSuggestedTutors] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesRes, resultsRes, liveClassesRes, followingRes, tutorsRes] = await Promise.all([
          getCourses(),
          getResults(),
          getMyLiveClasses().catch(() => ({ data: { liveClasses: [] } })),
          getMyFollowing().catch(() => ({ data: { following: [] } })),
          getTutors().catch(() => ({ data: { tutors: [] } })),
        ]);

        const allCourses = coursesRes.data.courses;
        const inProgress = allCourses.filter((c) => c.progress > 0 && c.progress < 100);
        setContinueLearning(inProgress.slice(0, 3));
        setCoursesInProgress(inProgress.length);

        const results = resultsRes.data.results;
        setRecentResults(results.slice(0, 3));
        if (results.length > 0) {
          const avg = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
          setCbtAverage(avg);
        }

        const now = new Date();
        const upcoming = liveClassesRes.data.liveClasses
          .filter((c) => c.status === 'live' || (c.status === 'scheduled' && new Date(c.scheduledFor) >= now))
          .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
        setNextLiveClass(upcoming[0] || null);

        const following = followingRes.data.following;
        setFollowingCount(following.length);
        setOnlineFriends(following.filter((f) => f.online).slice(0, 6));

        setSuggestedTutors(tutorsRes.data.tutors.slice(0, 3));
      } catch {
        // dashboard sections just show empty states on failure
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const readiness = cbtAverage ?? 0;

  const coachTip = recentResults.length === 0
    ? "You haven't taken a CBT yet — start one practice exam today and I'll build your personalized study plan around your results."
    : (() => {
        const weakest = [...recentResults].sort((a, b) => a.score - b.score)[0];
        return `Your last ${weakest.subjects?.join(', ')} attempt scored ${weakest.score}% — spend 15 extra minutes there today to bring it up.`;
      })();

  return (
    <div>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--amber']}`}><FiZap size={18} /></div>
          <div className={styles.statValue}>{user?.streakCount ?? 0} days</div>
          <div className={styles.statLabel}>Study streak</div>
          <div className={styles.statDescription}>Stay consistent to keep it alive</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--green']}`}><FiTrendingUp size={18} /></div>
          <div className={styles.statValue}>{user?.xp ?? 0}</div>
          <div className={styles.statLabel}>Total XP</div>
          <div className={styles.statDescription}>Earned from lessons &amp; CBT</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><FiTarget size={18} /></div>
          <div className={styles.statValue}>{cbtAverage !== null ? `${cbtAverage}%` : '—'}</div>
          <div className={styles.statLabel}>CBT average</div>
          <div className={styles.statDescription}>Across all practice exams</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--purple']}`}><FiBookOpen size={18} /></div>
          <div className={styles.statValue}>{coursesInProgress}</div>
          <div className={styles.statLabel}>Courses in progress</div>
          <div className={styles.statDescription}>Keep the momentum going</div>
        </div>
      </div>

      <div className={styles.goalBanner}>
        <div>
          <div className={styles.goalLabel}>Exam readiness</div>
          <div className={styles.goalTitle}>Your path to exam day</div>
          <div className={styles.goalSub}>Based on your CBT performance so far</div>
        </div>
        <div className={styles.goalRingWrap}>
          <div className={styles.goalBarTrack}>
            <div className={styles.goalBarFill} style={{ width: `${readiness}%` }} />
          </div>
          <span className={styles.goalPercent}>{readiness}%</span>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div>
          <div className={styles.coachCard}>
            <div className={styles.coachHeader}>
              <div className={styles.coachIcon}><FiCpu size={18} /></div>
              <span className={styles.coachLabel}>AI Coach</span>
            </div>
            <p className={styles.coachTip}>{coachTip}</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Continue learning</h2>
              <span className={styles.link} onClick={() => navigate('/learning')}>See all</span>
            </div>
            {loading && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</p>}
            {!loading && continueLearning.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No courses in progress yet — head to Learning to get started.
              </p>
            )}
            {continueLearning.map((item) => (
              <div key={item._id} className={styles.continueItem} onClick={() => navigate(`/learning/${item._id}`)}>
                <div className={styles.thumb}><FiBookOpen size={20} /></div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitle}>{item.title}</div>
                  <div className={styles.itemSub}>{item.subject}</div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Quick actions</h2>
            </div>
            <div className={styles.quickActions}>
              {quickActions.map(({ label, icon: Icon, to, color }) => (
                <div key={label} className={styles.quickAction} onClick={() => navigate(to)}>
                  <div
                    className={styles.quickActionIcon}
                    style={{ background: ICON_BG[color], color: ICON_COLOR[color] }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className={styles.quickActionLabel}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Upcoming</h2>
              <span className={styles.link} onClick={() => navigate('/live-classes')}>See all</span>
            </div>
            {!nextLiveClass && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Nothing scheduled — check Live Classes to join or book a session.
              </p>
            )}
            {nextLiveClass && (
              <div className={styles.upcomingItem} onClick={() => navigate(`/live-classes/${nextLiveClass.id}`)} style={{ cursor: 'pointer' }}>
                <div className={styles.upcomingIcon} style={{ background: '#FEF2F2', color: '#EF4444' }}>
                  <FiVideo size={16} />
                </div>
                <div>
                  <div className={styles.upcomingTitle}>{nextLiveClass.title}</div>
                  <div className={styles.upcomingMeta}>
                    {nextLiveClass.subject || 'Live class'} &middot;{' '}
                    {nextLiveClass.status === 'live' ? 'Happening now' : new Date(nextLiveClass.scheduledFor).toLocaleString()}
                  </div>
                </div>
                <span className={styles.liveBadge}>{nextLiveClass.status === 'live' ? 'LIVE' : 'SOON'}</span>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Online friends</h2>
            </div>
            {followingCount === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Follow other students from their profile to see when they're online.
              </p>
            )}
            {followingCount > 0 && onlineFriends.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No one you follow is online right now.</p>
            )}
            {onlineFriends.length > 0 && (
              <div className={styles.avatarRow}>
                {onlineFriends.map((f) => (
                  <div key={f.id} className={styles.friendAvatar} style={{ background: '#2563EB' }}>
                    {f.name?.charAt(0)?.toUpperCase()}
                    <span className={styles.onlineDot} />
                  </div>
                ))}
                <span className={styles.friendsCount}>{onlineFriends.length} studying now</span>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Available tutors</h2>
              <span className={styles.link} onClick={() => navigate('/tutors')}>See all</span>
            </div>
            {suggestedTutors.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No tutors available yet.</p>
            )}
            {suggestedTutors.map((t) => (
              <div key={t.id} className={styles.tutorCard} onClick={() => navigate(`/tutors/${t.id}`)} style={{ cursor: 'pointer' }}>
                <div className={styles.tutorAvatar}>{t.name?.charAt(0)}</div>
                <div>
                  <div className={styles.tutorName}>{t.name}</div>
                  <div className={styles.tutorMeta}>{t.subjects?.[0] ? `${t.subjects[0]} tutor` : 'Tutor'}</div>
                </div>
                <span className={styles.rating}><FiStar size={11} style={{ verticalAlign: '-1px' }} /> {t.rating?.toFixed(1) ?? 'New'}</span>
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Recent CBT results</h2>
            </div>
            {recentResults.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No CBT attempts yet.
              </p>
            )}
            {recentResults.map((r) => (
              <div key={r._id} className={styles.continueItem} style={{ cursor: 'default' }}>
                <div className={styles.thumb}><FiAward size={20} /></div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitle}>{r.subjects?.join(', ')}</div>
                  <div className={styles.itemSub}>{r.score}% &middot; {new Date(r.submittedAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
