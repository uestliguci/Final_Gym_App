import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar";
import { Home, Calendar, Video, Users, Settings, BarChart, ChevronRight, LogOut, User } from "lucide-react";
import { Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../lib/firebase";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "./ui/navigation-menu";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/", related: ["/videos", "/schedule"] },
  { icon: Video, label: "Videos", path: "/videos", related: ["/instructors", "/progress"] },
  { icon: Calendar, label: "Schedule", path: "/schedule", related: ["/instructors"] },
  { icon: Users, label: "Instructors", path: "/instructors", related: ["/videos", "/schedule"] },
  { icon: BarChart, label: "Progress", path: "/progress", related: ["/videos"] },
  { icon: Settings, label: "Settings", path: "/settings", related: [] },
];

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { currentUser, userProfile, loading } = useAuth();
  const currentItem = menuItems.find(item => item.path === location.pathname) || menuItems[0];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser || !userProfile) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-900">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <div className="p-4">
                <h1 className="text-2xl font-bold text-white">FitConnect</h1>
              </div>
              <SidebarGroupContent>
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild>
                        <Link 
                          to={item.path}
                          className={`flex items-center gap-3 transition-colors ${
                            isActive 
                              ? "text-white bg-primary/10 border-l-4 border-primary pl-[14px]" 
                              : "text-gray-300 hover:text-white pl-4"
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <NavigationMenu className="flex-1">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link 
                      to="/"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Dashboard
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                {location.pathname !== "/" && (
                  <>
                    <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link 
                          to={currentItem.path}
                          className="text-white"
                        >
                          {currentItem.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </>
                )}
              </NavigationMenuList>
            </NavigationMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName} />
                  <AvatarFallback>{userProfile.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-200">{userProfile.displayName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    auth.signOut();
                  }}
                  className="text-red-500 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {currentItem.related.length > 0 && (
              <div className="mt-4 flex gap-2">
                {currentItem.related.map((path) => {
                  const relatedItem = menuItems.find(item => item.path === path);
                  if (!relatedItem) return null;
                  return (
                    <Link
                      key={path}
                      to={path}
                      className="inline-flex items-center gap-2 px-3 py-1 text-sm text-gray-400 hover:text-white bg-gray-800/50 rounded-full transition-colors"
                    >
                      <relatedItem.icon className="h-4 w-4" />
                      {relatedItem.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
