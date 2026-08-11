import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // could render a spinner here

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'tutor') {
    return <Navigate to="/tutor/dashboard" replace />;
  }
  if (user.role === 'parent') {
    return <Navigate to="/parent/dashboard" replace />;
  }
  if (user.role === 'centre') {
    return <Navigate to="/centre/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
