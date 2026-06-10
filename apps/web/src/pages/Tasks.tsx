interface ComingSoonProps {
    title: string;
    description: string;
}

function ComingSoon({ title, description }: ComingSoonProps) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            <p className="mt-2 text-gray-500 max-w-sm">{description}</p>
            <span className="mt-4 inline-block px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
                Coming soon
            </span>
        </div>
    );
}

export function Tasks() {
    return (
        <ComingSoon
            title="Tasks"
            description="Track follow-ups, confirm tours, and manage your daily leasing workflow."
        />
    );
}
