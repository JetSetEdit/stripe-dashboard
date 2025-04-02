'use client'

import TimeTracker from '@/app/components/TimeTracker';
import CustomerList from './components/CustomerList';
import { useState } from 'react';

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

export default function Home() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Time Tracking Dashboard</h1>
        
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1">
            <CustomerList 
              onSelectCustomer={setSelectedCustomer} 
              selectedCustomerId={selectedCustomer?.id}
            />
          </div>
          
          <div className="col-span-3">
            <TimeTracker 
              customerId={selectedCustomer?.id || ''} 
              subscriptionItemId={selectedCustomer?.subscriptionItemId || ''}
              customer={selectedCustomer}
            />
          </div>
        </div>
      </div>
    </main>
  );
} 