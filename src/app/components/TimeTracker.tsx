import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TimeEntryList from './TimeEntryList';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  email: string;
  subscriptionItemId: string | null;
  subscriptionStatus: string | null;
  subscriptionId: string | null;
  priceId: string | null;
  productId: string | null;
  productName: string | null;
  current_period_end?: number;
}

interface TimeTrackerProps {
  customerId: string;
  subscriptionItemId: string;
  customer: Customer | null;
}

const RATE_PER_MINUTE = 0.84; // $0.84 AUD per minute

export default function TimeTracker({ 
  customerId: initialCustomerId, 
  subscriptionItemId: initialSubscriptionItemId,
  customer: initialCustomer 
}: TimeTrackerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer);

  useEffect(() => {
    setSelectedCustomer(initialCustomer);
  }, [initialCustomer]);

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
    if (!startTime || !endTime) {
      toast.error('Please select both start and end times');
      return;
    }

    if (!selectedCustomer?.subscriptionItemId || !selectedCustomer.subscriptionItemId.startsWith('si_')) {
      toast.error('Invalid subscription. Please select a customer with an active subscription.');
      return;
    }

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    let totalMinutes = (endHours - startHours) * 60 + (endMinutes - startMinutes);
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Handle crossing midnight
    }

    if (totalMinutes <= 0) {
      toast.error('Invalid time range', {
        description: 'End time must be after start time',
      });
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Saving time entry...');
    
    try {
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(startHours, startMinutes, 0, 0);
      
      const requestData = {
        subscriptionItemId: selectedCustomer.subscriptionItemId,
        minutes: totalMinutes,
        timestamp: Math.floor(Date.now() / 1000),
        description: notes,
        timeEntry: {
          customerId: selectedCustomer.id,
          startTime: selectedDateObj.toISOString(),
          endTime: new Date(selectedDate).setHours(endHours, endMinutes, 0, 0),
          description: notes,
          minutes: totalMinutes
        }
      };

      const response = await fetch('/api/meter-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || 'Failed to save time entry');
      }

      if (!responseData.success || !responseData.data) {
        throw new Error('Invalid response format from server');
      }

      toast.success('Time entry saved successfully', {
        id: toastId,
        description: `${totalMinutes} minutes recorded for ${selectedCustomer.name}`,
      });

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

      // Optionally refresh the time entry list if it's visible
      // You could add a ref to the TimeEntryList component and call a refresh method
    } catch (error) {
      console.error('Error saving time entry:', error);
      toast.error('Failed to save time entry', {
        id: toastId,
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(e);
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(null);
    // Reset form when customer changes
    setNotes('');
    setEndTime('');
    setTimerSeconds(0);
    setTimerRunning(false);
    toast.info('Customer selection cleared');
  };

  // Add these new functions for timer controls
  const handleTimerToggle = () => {
    setTimerRunning(!timerRunning);
    toast(timerRunning ? 'Timer paused' : 'Timer started', {
      duration: 2000,
    });
  };

  const handleTimerReset = () => {
    setTimerSeconds(0);
    setTimerRunning(false);
    toast('Timer reset', {
      duration: 2000,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        {selectedCustomer ? (
          <Tabs defaultValue="new-entry" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="new-entry">New Entry</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="new-entry">
              <Card>
                <CardHeader>
                  <CardTitle>New Time Entry for {selectedCustomer.name}</CardTitle>
                  <p className="text-sm text-gray-500">Customer ID: {selectedCustomer.id}</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-6">
                        <div className="text-3xl font-mono">
                          {formatTimer(timerSeconds)}
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="ml-2"
                            onClick={handleTimerToggle}
                          >
                            {timerRunning ? '⏸' : '▶'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="ml-2"
                            onClick={handleTimerReset}
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
                        disabled={isSaving || !startTime || !endTime || !selectedCustomer.subscriptionItemId}
                        className="w-full"
                      >
                        {!selectedCustomer.subscriptionItemId ? 'Customer needs an active subscription' : 'Add Entry'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold">{selectedCustomer.name}</h3>
                      <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p><span className="font-medium">Customer ID:</span> {selectedCustomer.id}</p>
                        {selectedCustomer.subscriptionItemId ? (
                          <>
                            <p><span className="font-medium">Subscription ID:</span> {selectedCustomer.subscriptionId || 'N/A'}</p>
                            <p><span className="font-medium">Subscription Item ID:</span> {selectedCustomer.subscriptionItemId}</p>
                            <p><span className="font-medium">Product ID:</span> {selectedCustomer.productId || 'N/A'}</p>
                            <p><span className="font-medium">Product Name:</span> {selectedCustomer.productName || 'N/A'}</p>
                            <p><span className="font-medium">Price ID:</span> {selectedCustomer.priceId || 'N/A'}</p>
                            <p><span className="font-medium">Status:</span> {selectedCustomer.subscriptionStatus || 'N/A'}</p>
                            {selectedCustomer.current_period_end && (
                              <p>
                                <span className="font-medium">Period End:</span>{' '}
                                {new Date(selectedCustomer.current_period_end * 1000).toLocaleDateString()}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-yellow-600">No active subscription</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Time Entry History for {selectedCustomer.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeEntryList customerId={selectedCustomer.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center p-8 text-gray-500">
            Please select a customer from the list to view their details
          </div>
        )}
      </div>
    </div>
  );
} 