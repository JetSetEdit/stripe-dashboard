import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import dotenv from 'dotenv'
import { prisma } from '@/lib/db'

dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { subscriptionItemId, minutes, description, timeEntry } = body

    console.log('Received request body:', body)

    if (!subscriptionItemId || !minutes || !timeEntry) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 1. First create the time entry in the database (without usage record ID)
    const dbTimeEntry = await prisma.timeEntry.create({
      data: {
        customerId: timeEntry.customerId,
        startTime: new Date(timeEntry.startTime),
        endTime: new Date(timeEntry.endTime),
        minutes: timeEntry.minutes,
        description: timeEntry.description,
        subscriptionItemId: subscriptionItemId,
      }
    })

    console.log('Time entry created in database:', dbTimeEntry)

    // 2. Create the usage record in Stripe
    try {
      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity: minutes,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        }
      )

      console.log('Usage record created:', usageRecord)

      // 3. Update the time entry with the usage record ID
      const updatedTimeEntry = await prisma.timeEntry.update({
        where: { id: dbTimeEntry.id },
        data: { usageRecordId: usageRecord.id }
      })

      console.log('Time entry updated with usage record ID:', updatedTimeEntry)

      return NextResponse.json(updatedTimeEntry)
    } catch (stripeError) {
      // If Stripe fails, delete the time entry and report the error
      await prisma.timeEntry.delete({
        where: { id: dbTimeEntry.id }
      })

      console.error('Stripe API error details:', {
        error: stripeError.message,
        type: stripeError.type,
        raw: stripeError
      })

      return NextResponse.json(
        { error: stripeError.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 