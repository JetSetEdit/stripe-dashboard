import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from 'lucide-react';

interface TimeEntry {
  id: string;
  startTime: Date;
  endTime: Date;
  minutes: number;
  description: string | null;
  createdAt: Date;
  subscriptionItemId: string;
  usageRecordId: string | null;
}

interface TimeEntryListProps {
  customerId: string;
}

export default function TimeEntryList({ customerId }: TimeEntryListProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeEntries = async () => {
      if (!customerId) {
        setTimeEntries([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/time-entries?customerId=${customerId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // No usage history found
            setTimeEntries([]);
            return;
          }
          throw new Error('Failed to fetch time entries');
        }

        const data = await response.json();
        setTimeEntries(data);
      } catch (error) {
        console.error('Error fetching time entries:', error);
        setError('No time entries have been recorded yet');
        setTimeEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeEntries();
  }, [customerId]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-gray-500">
        {error}
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className="p-4 text-gray-500">
        Select a customer to view their time entries
      </div>
    );
  }

  if (timeEntries.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        No time entries have been recorded for this customer yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Cost (AUD)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatDate(entry.startTime)}</TableCell>
                <TableCell>
                  {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                </TableCell>
                <TableCell>{formatDuration(entry.minutes)}</TableCell>
                <TableCell>{entry.description || '-'}</TableCell>
                <TableCell className="text-right">
                  ${(entry.minutes * 0.84).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {entry.usageRecordId && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`https://dashboard.stripe.com/test/subscriptions/${entry.subscriptionItemId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View in Stripe
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 