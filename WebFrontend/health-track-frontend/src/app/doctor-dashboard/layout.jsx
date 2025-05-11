import DoctorNavbar from './components/DoctorNavbar';
import DoctorDrawer from './components/DoctorDrawer';

export default function DoctorDashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <DoctorDrawer />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DoctorNavbar />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}