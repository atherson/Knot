import { Outlet } from 'react-router-dom';

export function MobileLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-green-50/30">
      <Outlet />
    </div>
  );
}
