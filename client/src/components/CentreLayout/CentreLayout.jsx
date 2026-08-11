import { Outlet } from 'react-router-dom';
import CentreSidebar from '../CentreSidebar/CentreSidebar';
import Topbar from '../Topbar/Topbar';
import styles from '../TutorLayout/TutorLayout.module.scss';

const CentreLayout = () => {
  return (
    <div className={styles.layout}>
      <CentreSidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CentreLayout;
