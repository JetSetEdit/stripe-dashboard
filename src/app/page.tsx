'use client'

import TimeTracker from './components/TimeTracker';
import CustomerList from './components/CustomerList';
import { useState } from 'react';

interface Customer {
  id: string;
  name: string;
  email: string;
  subscriptionItemId?: string;
}

export default function Home() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Time Tracking Dashboard</h1>
        
        <div className="grid grid-cols-12 gap-8">
          {/* Left sidebar with customer list */}
          <div className="col-span-3 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Customers</h2>
            </div>
            <CustomerList onSelectCustomer={setSelectedCustomer} />
          </div>

          {/* Main content area */}
          <div className="col-span-9">
            {selectedCustomer ? (
              <TimeTracker 
                customerId={selectedCustomer.id}
                subscriptionItemId={selectedCustomer.subscriptionItemId || ''}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                Select a customer to start tracking time
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 