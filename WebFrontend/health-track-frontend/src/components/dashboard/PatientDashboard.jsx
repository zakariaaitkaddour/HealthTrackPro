import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import OverviewSection from "./OverviewSection";
import HealthTrackingSection from "./HealthTrackingSection";
import MedicationsSection from "./MedicationsSection";
import AppointmentsSection from "./AppointmentsSection";
import ProfileSection from "./ProfileSection";

export default function PatientDashboard({ dashboardData }) {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<OverviewSection data={dashboardData} />} />
        <Route path="/health-tracking" element={<HealthTrackingSection medicalData={dashboardData.medicalData} />} />
        <Route path="/medications" element={<MedicationsSection medications={dashboardData.medications} />} />
        <Route path="/appointments" element={<AppointmentsSection appointments={dashboardData.appointments} />} />
        <Route path="/profile" element={<ProfileSection profile={dashboardData.profile} />} />
      </Routes>
    </DashboardLayout>
  );
}