import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import {
  BarChart3,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Video,
  User,
} from "lucide-react";

interface InstructorDashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: ReactNode;
}

export default function InstructorDashboardLayout({
  children,
}: InstructorDashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/instructor/dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Profile",
      href: "/instructor/profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      title: "Clients",
      href: "/instructor/clients",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Schedule",
      href: "/instructor/schedule",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Workout Plans",
      href: "/instructor/workout-plans",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Workout Guides",
      href: "/instructor/workout-guides",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Videos",
      href: "/instructor/videos",
      icon: <Video className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/instructor/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-white text-2xl font-bold">GymSynergy</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start ${
                      isActive ? "bg-gray-900" : "hover:bg-gray-700"
                    }`}
                    onClick={() => navigate(item.href)}
                  >
                    {item.icon}
                    <span className="ml-3">{item.title}</span>
                  </Button>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex bg-gray-700 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:bg-gray-600 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Log out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-gray-800 text-white w-full">
        <h1 className="text-xl font-bold">GymSynergy</h1>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64">
        <main className="flex-1 overflow-y-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
