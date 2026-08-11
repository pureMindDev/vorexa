import { Outlet } from 'react-router-dom';
import ParentSidebar from '../ParentSidebar/ParentSidebar';
import Topbar from '../Topbar/Topbar';
import styles from '../TutorLayout/TutorLayout.module.scss';

const ParentLayout = () => {
  return (
    <div className={styles.layout}>
      <ParentSidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ParentLayout;
