import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { signOut, profile } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex-1 md:flex-none">
          <h1 className="text-lg font-semibold text-gray-900">DelivTrack</h1>
        </div>

        <div className="flex items-center gap-4">
          {profile && (
            <span className="text-sm text-gray-600 hidden sm:inline">
              {profile.full_name}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
