import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TimeEntryList from './TimeEntryList';

interface TimeTrackerProps {
  customerId: string;
  subscriptionItemId: string;
}

const RATE_PER_MINUTE = 0.84; // $0.84 AUD per minute

export default function TimeTracker({ customerId, subscriptionItemId }: TimeTrackerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    // Set current time as default start time when component mounts
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    setStartTime(timeString);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const calculateMinutes = (start: string, end: string): number => {
    if (!start || !end) return 0;
    
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    
    let totalMinutes = (endHours - startHours) * 60 + (endMinutes - startMinutes);
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Handle crossing midnight
    }
    return totalMinutes;
  };

  const calculatedCost = useMemo(() => {
    const minutes = calculateMinutes(startTime, endTime);
    return (minutes * RATE_PER_MINUTE).toFixed(2);
  }, [startTime, endTime]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) return;

    if (!subscriptionItemId || !subscriptionItemId.startsWith('si_')) {
      console.error('Invalid subscription item ID:', subscriptionItemId);
      alert('Invalid subscription item ID. Please select a customer again.');
      return;
    }

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    let totalMinutes = (endHours - startHours) * 60 + (endMinutes - startMinutes);
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Handle crossing midnight
    }

    if (totalMinutes > 0) {
      setIsSaving(true);
      try {
        const selectedDateObj = new Date(selectedDate);
        selectedDateObj.setHours(startHours, startMinutes, 0, 0);
        
        const requestData = {
          subscriptionItemId,
          minutes: totalMinutes,
          timestamp: Math.floor(Date.now() / 1000), // Use current timestamp for Stripe
          description: notes,
          // Additional data for our database
          timeEntry: {
            customerId,
            startTime: selectedDateObj.toISOString(),
            endTime: new Date(selectedDate).setHours(endHours, endMinutes, 0, 0),
            description: notes,
            minutes: totalMinutes
          }
        };

        console.log('Saving time entry with data:', requestData);

        const response = await fetch('/api/meter-events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        const responseData = await response.json();
        console.log('API Response:', {
          status: response.status,
          ok: response.ok,
          data: responseData
        });

        if (!response.ok) {
          console.error('Server error details:', responseData);
          throw new Error(responseData.error || responseData.details || 'Failed to save time entry');
        }

        console.log('Time entry saved successfully:', responseData);

        // Reset form
        setNotes('');
        const now = new Date();
        setStartTime(now.toLocaleTimeString('en-US', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        }));
        setEndTime('');
        setTimerSeconds(0);
        setTimerRunning(false);
      } catch (error) {
        console.error('Error saving time entry:', error);
        alert(error instanceof Error ? error.message : 'Failed to save time entry. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <Tabs defaultValue="new" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new">New Entry</TabsTrigger>
            <TabsTrigger value="entries">History</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <div className="flex justify-between items-center mb-6">
              <div className="text-3xl font-mono">
                {formatTimer(timerSeconds)}
                <Button 
                  variant="outline" 
                  size="icon"
                  className="ml-2"
                  onClick={() => setTimerRunning(!timerRunning)}
                >
                  {timerRunning ? '⏸' : '▶'}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="ml-2"
                  onClick={() => setTimerSeconds(0)}
                >
                  ⏹
                </Button>
              </div>
              {startTime && endTime && (
                <div className="text-lg font-semibold">
                  Estimated Cost: <span className="text-green-600">${calculatedCost} AUD</span>
                  <div className="text-sm text-gray-500">
                    ({calculateMinutes(startTime, endTime)} minutes @ $0.84/min)
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSaving || !startTime || !endTime}
                className="w-full"
              >
                Add Entry
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="entries">
            <TimeEntryList customerId={customerId} />
          </TabsContent>

          <TabsContent value="reports">
            <div className="p-4 text-center text-gray-500">
              Reports coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 