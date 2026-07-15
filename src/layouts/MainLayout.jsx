import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  CreditCard, 
  UserPlus,
  LogOut, 
  Menu,
  X,
  Bell,
  User as UserIcon,
  Leaf,
  CheckSquare,
  ArrowLeftRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import NotificationPopup from '../components/NotificationPopup';
import ProfilePopup from '../components/ProfilePopup';

const adminNavItems = [
  { name: 'Dashboard',  path: '/dashboard',  icon: LayoutDashboard },
  { name: 'Members',    path: '/clients',    icon: Users },
  { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
  { name: 'Memberships',path: '/memberships',icon: CreditCard },
  { name: 'Visitor',    path: '/visitor',    icon: UserPlus },
  { name: 'Closing',    path: '/closing',    icon: CheckSquare },
  { name: 'Other Club', path: '/other-club-members', icon: ArrowLeftRight },
];

const memberNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Members',    path: '/clients',    icon: Users },
  { name: 'Other Club', path: '/other-club-members', icon: ArrowLeftRight },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, user } = useAppContext();
  const navigate = useNavigate();
  const navItems = adminNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white text-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-gray-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center space-x-2 group cursor-pointer">
          <div className="w-8 h-8 bg-forest rounded flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900 uppercase">
            Super Way
          </span>
        </div>
        <button onClick={toggleSidebar} className="lg:hidden text-gray-500 hover:text-gray-900 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col flex-1 px-3 py-6 space-y-1 overflow-y-auto no-scrollbar h-[calc(100vh-140px)]">
        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Management</p>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 font-medium group relative ${
                isActive 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-forest rounded-r-full"></div>
                )}
                
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-forest' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="relative z-10">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center mb-4 px-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mr-3">
            <UserIcon size={18} className="text-gray-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Coach Aditi'}</p>
            <p className="text-xs text-gray-500 font-medium truncate">{user?.role || 'Lead Practitioner'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full px-4 py-2 text-sm font-semibold text-red-600 bg-white rounded-lg hover:bg-red-50 transition-colors border border-red-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

const Header = ({ toggleSidebar }) => {
  const { user, notifications } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unreadCount = notifications.length;

  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-8 bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 mr-3 text-gray-600 bg-gray-50 rounded-md lg:hidden hover:bg-gray-100 transition-colors border border-gray-200"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Namaste, {user?.name?.split(' ')[0] || 'Aditi'}</h2>
        </div>
      </div>

      <div className="flex items-center space-x-3 relative">
        <button 
          onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
          className={`relative p-2 text-gray-600 border border-gray-200 rounded-lg transition-colors group ${showNotifications ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}
        >
          <Bell size={18} className="group-hover:text-gray-900" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          )}
        </button>
        {showNotifications && <NotificationPopup onClose={() => setShowNotifications(false)} />}

        <div 
          onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
          className={`w-9 h-9 rounded-full border border-gray-200 p-0.5 overflow-hidden flex items-center justify-center cursor-pointer transition-colors ${showProfile ? 'ring-2 ring-forest/20' : 'bg-white hover:border-gray-300'}`}
        >
             <img 
               src={`https://ui-avatars.com/api/?name=${user?.name || 'Aditi'}&background=14532D&color=FFFFFF&bold=true`} 
               alt="Avatar" 
               className="w-full h-full rounded-full object-cover" 
             />
        </div>

        {showProfile && <ProfilePopup onClose={() => setShowProfile(false)} />}
      </div>
    </header>
  );
};



export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mainRef = useRef(null);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div className="h-screen bg-offwhite overflow-hidden text-gray-900">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="lg:ml-64 flex flex-col h-screen transition-all duration-300">
        <Header toggleSidebar={toggleSidebar} />
        
        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-12 relative">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
            <Outlet />
          </div>
        </main>
      </div>



      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
