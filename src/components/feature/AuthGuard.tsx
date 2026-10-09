import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PageLoader from "@/components/feature/PageLoader";

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { loading, session, profile, isAdmin, isApproved } = useAuth();
  const navigate = useNavigate();

  const needProfile = Boolean(session) && profile === null;

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/auth");
      return;
    }
    if (profile === null) return;
    if (requireAdmin) {
      if (!isAdmin) navigate("/");
      return;
    }
    if (!isApproved) navigate("/pending");
  }, [loading, session, profile, isAdmin, isApproved, requireAdmin, navigate]);

  if (loading || (needProfile && profile === null)) {
    return <PageLoader />;
  }
  if (!session) return null;
  if (requireAdmin && profile !== null && !isAdmin) return null;
  if (!requireAdmin && profile !== null && !isApproved) return null;
  if (profile === null) return <PageLoader />;

  return <>{children}</>;
}