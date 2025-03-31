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
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/time-entries?customerId=${customerId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch time entries');
        }

        // Convert string dates to Date objects
        const formattedData = data.map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: new Date(entry.endTime),
          createdAt: new Date(entry.createdAt)
        }));
        setEntries(formattedData);
      } catch (err) {
        console.error('Error fetching time entries:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch time entries');
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchEntries();
    }
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return <div className="text-gray-500 p-4 text-center">No time entries found for this customer</div>;
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
            {entries.map((entry) => (
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
                        href={`https://dashboard.stripe.com/subscriptions/${entry.subscriptionItemId.replace('si_', 'sub_')}/usage_records`}
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