import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {/* Keyed on pathname so routed content re-mounts and animates in */}
                    <div key={location.pathname} className="page-enter">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
