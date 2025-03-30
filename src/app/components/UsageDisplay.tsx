import { useEffect, useState } from 'react';

interface UsageRecord {
  id: string;
  subscription_item: string;
  total_usage: number;
  period: {
    start: number;
    end: number;
  };
}

interface UsageDisplayProps {
  subscriptionId: string;
  subscriptionItemId: string;
}

export default function UsageDisplay({ subscriptionId, subscriptionItemId }: UsageDisplayProps) {
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch(`/api/usage/${subscriptionItemId}`);
        const data = await response.json();
        setUsage(data);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, [subscriptionItemId]);

  if (loading) {
    return <div className="text-sm text-gray-600">Loading usage data...</div>;
  }

  return (
    <div className="mt-2">
      <h4 className="text-sm font-semibold mb-2">Usage History</h4>
      <div className="space-y-2">
        {usage.map((record) => (
          <div key={record.id} className="text-sm p-2 bg-gray-50 rounded">
            <div className="flex justify-between">
              <span>Total Minutes: {record.total_usage}</span>
              <span className="text-gray-600">
                ${(record.total_usage * 0.84).toFixed(2)} AUD
              </span>
            </div>
            <div className="text-gray-600 mt-1 text-xs">
              Period: {new Date(record.period.start * 1000).toLocaleDateString()} - {' '}
              {new Date(record.period.end * 1000).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 