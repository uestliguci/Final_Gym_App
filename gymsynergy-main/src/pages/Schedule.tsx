import { DashboardLayout } from "@/components/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const Schedule = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  console.log("Schedule page rendered with date:", date);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Schedule</h1>
          <p className="text-gray-400">Manage your training sessions and appointments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Calendar</h2>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="bg-card rounded-lg"
            />
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Upcoming Sessions</h2>
            <div className="space-y-4">
              {date ? (
                <p className="text-gray-400">No sessions scheduled for {date.toLocaleDateString()}</p>
              ) : (
                <p className="text-gray-400">Select a date to view sessions</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Schedule;