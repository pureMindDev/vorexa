import { Outlet } from 'react-router-dom';
import AdminSidebar from '../AdminSidebar/AdminSidebar';
import Topbar from '../Topbar/Topbar';
import styles from '../TutorLayout/TutorLayout.module.scss';

const AdminLayout = () => {
  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
