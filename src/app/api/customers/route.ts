import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
})

export async function GET() {
  try {
    console.log('Fetching customers with subscriptions...');
    
    // First, get the list of customers with their subscriptions
    const customers = await stripe.customers.list({
      limit: 100,
      expand: ['data.subscriptions']
    });

    if (!customers?.data || !Array.isArray(customers.data)) {
      console.error('Invalid response from Stripe:', customers);
      return NextResponse.json({ error: 'Invalid response from Stripe' }, { status: 500 });
    }

    console.log(`Found ${customers.data.length} customers`);

    // Process each customer and fetch their subscription items separately
    const transformedCustomers = await Promise.all(
      customers.data
        .filter(customer => customer && !customer.deleted)
        .map(async customer => {
          console.log(`Processing customer: ${customer.name} (${customer.id})`);
          
          const activeSubscriptions = customer.subscriptions?.data
            ?.filter(sub => sub.status === 'active' || sub.status === 'trialing') || [];

          console.log(`Found ${activeSubscriptions.length} active subscriptions for ${customer.name}`);

          // Fetch subscription items for each active subscription
          const subscriptionsWithItems = await Promise.all(
            activeSubscriptions.map(async sub => {
              try {
                const subItems = await stripe.subscriptionItems.list({
                  subscription: sub.id,
                  expand: ['data.price.product']
                });

                const item = subItems.data[0];
                if (!item) {
                  console.log(`No subscription items found for subscription ${sub.id}`);
                  return null;
                }

                console.log(`Found subscription item for ${customer.name}:`, {
                  subscriptionId: sub.id,
                  itemId: item.id,
                  productId: item.price?.product?.id,
                  productName: item.price?.product?.name
                });

                return {
                  id: sub.id,
                  status: sub.status,
                  current_period_end: sub.current_period_end,
                  subscriptionItemId: item.id,
                  priceId: item.price?.id || null,
                  productId: item.price?.product?.id || null,
                  productName: item.price?.product?.name || null
                };
              } catch (error) {
                console.error(`Error fetching subscription items for ${customer.name}:`, error);
                return null;
              }
            })
          );

          const validSubscriptions = subscriptionsWithItems.filter(Boolean);
          const firstSubscription = validSubscriptions[0];

          return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            subscriptionItemId: firstSubscription?.subscriptionItemId || null,
            subscriptionStatus: firstSubscription?.status || null,
            subscriptionId: firstSubscription?.id || null,
            priceId: firstSubscription?.priceId || null,
            productId: firstSubscription?.productId || null,
            productName: firstSubscription?.productName || null,
            current_period_end: firstSubscription?.current_period_end || null
          };
        })
    );

    console.log(`Successfully processed ${transformedCustomers.length} customers`);
    return NextResponse.json(transformedCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch customers' },
      { status: 500 }
    );
  }
} 