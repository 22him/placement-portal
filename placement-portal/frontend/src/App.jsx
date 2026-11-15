import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireRole } from './components/Layout';
import Landing from './pages/Landing';
import { Login, Register, Forgot, Reset } from './pages/Auth';
import Dashboard from './pages/student/Dashboard';
import Resume from './pages/student/Resume';
import Interview from './pages/student/Interview';
import Aptitude from './pages/student/Aptitude';
import Coding from './pages/student/Coding';
import Roadmap from './pages/student/Roadmap';
import Drives from './pages/student/Drives';
import Recommendations from './pages/student/Recommendations';
import Analytics from './pages/student/Analytics';
import Profile from './pages/student/Profile';
import AdminOverview from './pages/admin/Overview';
import AdminStudents from './pages/admin/Students';
import AdminApplications from './pages/admin/Applications';
import AdminReports from './pages/admin/Reports';
import { CompaniesAdmin, DrivesAdmin, CodingAdmin } from './pages/admin/Manage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<Forgot />} />
      <Route path="/reset-password/:token" element={<Reset />} />

      <Route path="/student" element={<RequireRole role="student" />}>
        <Route index element={<Dashboard />} />
        <Route path="resume" element={<Resume />} />
        <Route path="interview" element={<Interview />} />
        <Route path="aptitude" element={<Aptitude />} />
        <Route path="coding" element={<Coding />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="drives" element={<Drives />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="/admin" element={<RequireRole role="admin" />}>
        <Route index element={<AdminOverview />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="companies" element={<CompaniesAdmin />} />
        <Route path="drives" element={<DrivesAdmin />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="coding" element={<CodingAdmin />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
