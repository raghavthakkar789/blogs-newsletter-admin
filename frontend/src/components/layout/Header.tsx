import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome back, {user?.firstName}!
          </h2>
        </div>
      </div>
    </header>
  );
}

