import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalBackground3D } from '../3d/GlobalBackground3D';
import { Cursor } from '../common/Cursor';

export const AppLayout: React.FC = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      {/* Subtle Circular Custom Cursor */}
      <Cursor />

      {/* Persistent Fixed 3D Background */}
      <GlobalBackground3D showFullScene={true} />

      <div className="relative z-10 flex w-full h-full overflow-hidden">
        {/* Desktop Fixed Sidebar */}
        <Sidebar />

        {/* Central Application Column */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Desktop Fixed Header */}
          <Header />

          {/* Central Page Content - Scrolls Independently */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 scrollbar-thin relative z-10">
            <div className="max-w-7xl mx-auto w-full pb-16">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
