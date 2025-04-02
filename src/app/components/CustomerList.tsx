import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
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

interface CustomerListProps {
  onSelectCustomer: (customer: Customer) => void;
  selectedCustomerId?: string;
}

export default function CustomerList({ onSelectCustomer, selectedCustomerId }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/customers');
        const data = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
        setError('Failed to load customers');
        toast.error('Failed to load customers', {
          description: 'Please refresh the page to try again',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleCustomerSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    toast.success(`Selected ${customer.name}`, {
      description: customer.subscriptionItemId 
        ? 'Ready to track time'
        : 'Note: Customer has no active subscription',
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold mb-4">Customers</h2>
      {customers.map((customer) => (
        <div
          key={customer.id}
          onClick={() => handleCustomerSelect(customer)}
          className={`
            p-4 rounded-lg cursor-pointer transition-all
            ${selectedCustomerId === customer.id 
              ? 'bg-blue-100 border-blue-500 border-2 shadow-md' 
              : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm'
            }
          `}
        >
          <div className="flex flex-col space-y-1">
            <div className="font-medium">{customer.name}</div>
            <div className="text-sm text-gray-500">{customer.email}</div>
            <div className="text-xs font-mono text-gray-400 mt-1">
              ID: {customer.id}
            </div>
            {customer.subscriptionItemId ? (
              <div className="text-xs text-green-600 mt-1">
                Active Subscription
              </div>
            ) : (
              <div className="text-xs text-yellow-600 mt-1">
                No Active Subscription
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 