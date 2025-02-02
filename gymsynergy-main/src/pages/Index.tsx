import * as React from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Card } from "../components/ui/card";
import { Calendar, Video, Users, Trophy, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

const QuickAction = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => (
  <Link to={path} className="group">
    <Card className="p-4 bg-card hover:bg-gray-800 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <span className="text-gray-300 group-hover:text-white transition-colors">{label}</span>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
      </div>
    </Card>
  </Link>
);

const ActionLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Link> & { variant?: "default" | "ghost" | "outline" }
>(({ className, variant = "default", ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "text-primary hover:text-primary hover:bg-primary/10",
    outline: "border border-primary text-primary hover:bg-primary hover:text-white"
  };

  return (
    <Link
      ref={ref}
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    />
  );
});
ActionLink.displayName = "ActionLink";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back, Alex</h1>
          <p className="text-gray-400">Track your fitness journey and connect with top instructors</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/schedule">
            <Card className="p-6 bg-card hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Upcoming Sessions</p>
                  <p className="text-2xl font-bold text-white">3</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/videos">
            <Card className="p-6 bg-card hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Watched Videos</p>
                  <p className="text-2xl font-bold text-white">28</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/instructors">
            <Card className="p-6 bg-card hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active Instructors</p>
                  <p className="text-2xl font-bold text-white">5</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/progress">
            <Card className="p-6 bg-card hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Achievements</p>
                  <p className="text-2xl font-bold text-white">12</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAction icon={Video} label="Browse Workout Videos" path="/videos" />
            <QuickAction icon={Calendar} label="Schedule a Session" path="/schedule" />
            <QuickAction icon={Users} label="Find an Instructor" path="/instructors" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6 bg-card">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                  <div className="h-12 w-12 bg-gray-700 rounded-lg"></div>
                  <div>
                    <h3 className="font-medium text-white">Upper Body Workout</h3>
                    <p className="text-sm text-gray-400">Completed 2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <ActionLink 
                to="/progress"
                variant="ghost"
                className="px-4 py-2"
              >
                View All Activity
              </ActionLink>
            </div>
          </Card>

          <Card className="p-6 bg-card">
            <h2 className="text-xl font-semibold text-white mb-4">Upcoming Sessions</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-700 rounded-lg"></div>
                    <div>
                      <h3 className="font-medium text-white">HIIT with Sarah</h3>
                      <p className="text-sm text-gray-400">Tomorrow at 10:00 AM</p>
                    </div>
                  </div>
                  <ActionLink 
                    to="#"
                    variant="outline"
                    className="px-4 py-2"
                  >
                    Join
                  </ActionLink>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <ActionLink 
                to="/schedule"
                variant="ghost"
                className="px-4 py-2"
              >
                View Schedule
              </ActionLink>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
