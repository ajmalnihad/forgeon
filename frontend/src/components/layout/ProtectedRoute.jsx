import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { EmptyState } from "../ui/Feedback.jsx";
import Button from "../ui/Button.jsx";
import { useNavigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, booting } = useAuth();
  const location = useLocation();
  if (booting) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

/** UX-level guard only — the backend enforces real permissions. */
export function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  if (!isAdmin) {
    return (
      <div className="py-16">
        <EmptyState
          icon="alert"
          title="Admin access required"
          description="This module is only available to Admin users."
          action={
            <Button variant="secondary" onClick={() => navigate("/")}>
              Back to dashboard
            </Button>
          }
        />
      </div>
    );
  }
  return children;
}

export default ProtectedRoute;
