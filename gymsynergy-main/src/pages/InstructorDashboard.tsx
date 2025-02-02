import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Star,
  TrendingUp,
  Activity,
} from "lucide-react";

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalSessions: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  workoutPlans: number;
  upcomingSessions: number;
}

export default function InstructorDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    totalSessions: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    workoutPlans: 0,
    upcomingSessions: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);

        // Fetch instructor profile
        const instructorDoc = await getDoc(doc(db, 'instructor_profiles', currentUser.uid));
        const instructorData = instructorDoc.data();

        // Fetch workout plans count
        const plansQuery = query(
          collection(db, 'workout_plans'),
          where('instructorId', '==', currentUser.uid)
        );
        const plansSnapshot = await getDocs(plansQuery);

        // Fetch upcoming sessions
        const now = new Date();
        const sessionsQuery = query(
          collection(db, 'sessions'),
          where('instructorId', '==', currentUser.uid),
          where('startTime', '>=', now)
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);

        setStats({
          totalClients: instructorData?.stats?.totalClients || 0,
          activeClients: instructorData?.stats?.activeClients || 0,
          totalSessions: instructorData?.stats?.totalSessions || 0,
          totalEarnings: instructorData?.stats?.totalEarnings || 0,
          averageRating: instructorData?.profile?.rating || 0,
          totalReviews: instructorData?.profile?.reviewCount || 0,
          workoutPlans: plansSnapshot.size,
          upcomingSessions: sessionsSnapshot.size,
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const statCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      description: `${stats.activeClients} active clients`,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      onClick: () => navigate("/instructor/clients"),
    },
    {
      title: "Total Sessions",
      value: stats.totalSessions,
      description: `${stats.upcomingSessions} upcoming sessions`,
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
      onClick: () => navigate("/instructor/schedule"),
    },
    {
      title: "Total Earnings",
      value: `$${stats.totalEarnings.toLocaleString()}`,
      description: "All time earnings",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      onClick: () => navigate("/instructor/earnings"),
    },
    {
      title: "Average Rating",
      value: stats.averageRating.toFixed(1),
      description: `${stats.totalReviews} total reviews`,
      icon: <Star className="h-4 w-4 text-muted-foreground" />,
      onClick: () => navigate("/instructor/profile"),
    },
    {
      title: "Workout Plans",
      value: stats.workoutPlans,
      description: "Active workout plans",
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
      onClick: () => navigate("/instructor/workout-plans"),
    },
    {
      title: "Client Growth",
      value: "+12%",
      description: "vs. last month",
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      onClick: () => navigate("/instructor/analytics"),
    },
  ];

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your clients.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/instructor/workout-plans")}>
            <FileText className="mr-2 h-4 w-4" />
            Create Workout Plan
          </Button>
          <Button onClick={() => navigate("/instructor/schedule")}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Session
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={stat.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Weekly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Revenue chart will be implemented here
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center">
                  <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      New client signed up
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2 hours ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
