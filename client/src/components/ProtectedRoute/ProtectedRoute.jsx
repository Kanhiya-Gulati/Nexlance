import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../Spinner/Spinner';

/**
 * ProtectedRoute - Guards routes that require authentication.
 * Optionally enforces a specific user role.
 * @param {React.ReactNode} children - The content to render if authorized
 * @param {string} [role] - 'client' | 'freelancer' — if provided, user must match
 */
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  // While auth state is loading, show a spinner
  if (loading) {
    return <Spinner size="lg" fullPage />;
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect to correct dashboard
  if (role && user.role !== role) {
    const redirect = user.role === 'client' ? '/dashboard/client' : '/dashboard/freelancer';
    return <Navigate to={redirect} replace />;
  }

  return children;
};

export default ProtectedRoute;
