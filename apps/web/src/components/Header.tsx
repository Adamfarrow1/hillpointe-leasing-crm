import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/prospects': 'Prospects',
    '/units': 'Units',
    '/tours': 'Tours',
    '/tasks': 'Tasks',
    '/activity': 'Activity',
};

export function Header() {
    const { pathname } = useLocation();
    const title = pageTitles[pathname] ?? 'Hillpointe';

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

            <div className="flex items-center gap-4">
                

                <div className="flex items-center gap-2.5 pl-4 border-l border-gray-200">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        AT
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-medium text-gray-800">Alex Thompson</p>
                        <p className="text-xs text-gray-500">Leasing Agent</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
