import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import SimulatorPage from "@/pages/simulator/page";
import AuthPage from "@/pages/auth/page";
import PendingPage from "@/pages/pending/page";
import AdminPage from "@/pages/admin/page";
import InquiryPage from "@/pages/inquiry/page";
import AuthGuard from "@/components/feature/AuthGuard";

const routes: RouteObject[] = [
  {
    path: "/",
    element: (
      <AuthGuard>
        <SimulatorPage />
      </AuthGuard>
    ),
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/pending",
    element: <PendingPage />,
  },
  {
    path: "/inquiry",
    element: <InquiryPage />,
  },
  {
    path: "/admin",
    element: (
      <AuthGuard requireAdmin>
        <AdminPage />
      </AuthGuard>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;