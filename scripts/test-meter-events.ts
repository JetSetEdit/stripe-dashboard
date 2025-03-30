import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testMeterEvent() {
  try {
    console.log('Creating meter event...');
    
    const response = await fetch('https://api.stripe.com/v1/billing/meter_events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        event_name: 'time_tracking_billing',
        timestamp: Math.floor(Date.now() / 1000).toString(),
        'payload[stripe_customer_id]': 'cus_S1ENlAVDtRShhb',
        'payload[subscription_id]': 'sub_1R7xIuAVc47ah8I1FNkpfgdO',
        'payload[value]': '1'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create meter event');
    }

    const meterEvent = await response.json();
    console.log('Meter event created successfully:', meterEvent);
  } catch (error) {
    console.error('Error creating meter event:', error);
  }
}

// Run the test
testMeterEvent(); 