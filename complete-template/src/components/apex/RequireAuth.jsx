import { Navigate, useLocation } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useAuth } from '@/context/AuthContext';
import { getToken } from '@/services/api';

function RequireAuth({ children }) {
	const { user, loading } = useAuth();
	const location = useLocation();

	if (loading) {
		return (
			<Box display="flex" justifyContent="center" py={8}>
				<CircularProgress />
			</Box>
		);
	}

	if (!user && !getToken()) {
		return <Navigate to="/apex/login" replace state={{ from: location }} />;
	}

	return children;
}

export default RequireAuth;
