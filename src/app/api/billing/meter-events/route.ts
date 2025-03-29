import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, hours, date } = body

    // Convert hours to minutes for billing (assuming we bill per minute)
    const minutes = Math.ceil(hours * 60)

    const meterEvent = await stripe.v2.billing.meterEvents.create({
      identifier: `time_entry_${Date.now()}`,
      event_name: 'time_tracking',
      timestamp: date || new Date().toISOString(),
      payload: {
        stripe_customer_id: customerId,
        value: minutes.toString(),
      },
    })

    return NextResponse.json({
      success: true,
      meterEvent,
      message: `Successfully logged ${minutes} minutes for billing`
    })

  } catch (error) {
    console.error('Error creating meter event:', error)
    return NextResponse.json(
      { error: 'Failed to create meter event', details: error },
      { status: 500 }
    )
  }
} 