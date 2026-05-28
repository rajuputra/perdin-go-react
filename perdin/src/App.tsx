import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { DashboardLayout } from "./layouts/DashboardLayout";

// Pages
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import CityMaster from "./pages/Admin/CityMaster";
import UserMaster from "./pages/Admin/UserMaster";
import PerdinList from "./pages/Pegawai/PerdinList";
import ApprovalList from "./pages/SDM/ApprovalList";
import { useAuth } from "./contexts/AuthContext";

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const userRoles = user.roles || [];

  if (userRoles.includes("ADMIN"))
    return <Navigate to="/admin/cities" replace />;
  if (userRoles.includes("PEGAWAI"))
    return <Navigate to="/pegawai/perdin" replace />;
  if (userRoles.includes("DIVISI_SDM"))
    return <Navigate to="/sdm/perdin" replace />;

  return <Navigate to="/unauthorized" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes inside Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Default Redirect based on role */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Admin & SDM Shared Routes */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "DIVISI_SDM"]} />}>
                <Route path="/admin/cities" element={<CityMaster />} />
              </Route>

              {/* Admin-only Routes */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/admin/users" element={<UserMaster />} />
              </Route>

              {/* Pegawai Routes */}
              <Route element={<ProtectedRoute allowedRoles={["PEGAWAI"]} />}>
                <Route path="/pegawai/perdin" element={<PerdinList />} />
              </Route>

              {/* SDM Routes */}
              <Route element={<ProtectedRoute allowedRoles={["DIVISI_SDM"]} />}>
                <Route path="/sdm/perdin" element={<ApprovalList />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
