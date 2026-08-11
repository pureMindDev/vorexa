import { Outlet } from 'react-router-dom';
import TutorSidebar from '../TutorSidebar/TutorSidebar';
import Topbar from '../Topbar/Topbar';
import styles from './TutorLayout.module.scss';

const TutorLayout = () => {
  return (
    <div className={styles.layout}>
      <TutorSidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default TutorLayout;
