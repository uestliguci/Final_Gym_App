import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Activity, Target, Trophy } from "lucide-react";

const workoutData = [
  { month: "Jan", workouts: 12 },
  { month: "Feb", workouts: 15 },
  { month: "Mar", workouts: 18 },
  { month: "Apr", workouts: 16 },
  { month: "May", workouts: 21 },
  { month: "Jun", workouts: 19 },
];

const ProgressPage = () => {
  console.log("Progress page rendered");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Progress</h1>
          <p className="text-gray-400">Track your fitness journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Activity className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-gray-400">Weekly Goal</p>
                <h3 className="text-2xl font-bold text-white">4/5</h3>
              </div>
            </div>
            <ProgressBar value={80} className="mt-4" />
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Target className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-gray-400">Current Streak</p>
                <h3 className="text-2xl font-bold text-white">12 days</h3>
              </div>
            </div>
            <ProgressBar value={60} className="mt-4" />
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-gray-400">Achievement Points</p>
                <h3 className="text-2xl font-bold text-white">850</h3>
              </div>
            </div>
            <ProgressBar value={85} className="mt-4" />
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Workout History</h3>
          <div className="h-[300px]">
            <ChartContainer
              className="h-full"
              config={{
                primary: {
                  theme: {
                    light: "#8B5CF6",
                    dark: "#8B5CF6",
                  },
                },
              }}
            >
              <BarChart data={workoutData}>
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Bar
                  dataKey="workouts"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                />
                <ChartTooltip />
              </BarChart>
            </ChartContainer>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProgressPage;