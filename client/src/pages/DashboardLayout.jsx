import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

/**
 * DASHBOARD LAYOUT
 * This wrapper is applied to all Dashboard pages.
 * It puts the Sidebar on the left and the Page Content on the right.
 * The <Outlet /> is where the specific page (Home, Settings, etc.) appears.
 */
const DashboardLayout = () => {
  return (
    <div className="flex bg-mvp-bg min-h-screen text-mvp-text font-sans">
      {/* 1. Fixed Sidebar */}
      <Sidebar />

      {/* 2. Main Content Area */}
      {/* We add 'ml-64' because the sidebar is 64 units (256px) wide */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* This is where the specific page content renders */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
