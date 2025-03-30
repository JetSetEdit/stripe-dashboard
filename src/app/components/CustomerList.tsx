import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Customer {
  id: string;
  name: string;
  email: string;
  subscriptionItemId?: string;
}

interface CustomerListProps {
  onSelectCustomer: (customer: Customer) => void;
}

export default function CustomerList({ onSelectCustomer }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      
      console.log('Fetched customers:', data);
      
      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        console.error('Invalid customers data:', data);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    onSelectCustomer(customer);
  };

  if (isLoading) {
    return <div className="p-4">Loading customers...</div>;
  }

  if (customers.length === 0) {
    return <div className="p-4">No customers found</div>;
  }

  return (
    <div className="divide-y">
      {customers.map((customer) => (
        <button
          key={customer.id}
          onClick={() => handleCustomerClick(customer)}
          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
            selectedCustomerId === customer.id ? 'bg-gray-100' : ''
          }`}
        >
          <div className="font-medium">{customer.name}</div>
          <div className="text-sm text-gray-500">{customer.email}</div>
        </button>
      ))}
    </div>
  );
} 