import { Outlet } from "react-router-dom";
import BottomNavigation from "./BottomNavigation.jsx";
import DesktopSidebar from "./DesktopSidebar.jsx";

export function AppShell() {
  return (
    <div className="min-h-full bg-bg">
      <DesktopSidebar />
      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 lg:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}

export default AppShell;
