import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Get time entries from database
    const timeEntries = await prisma.timeEntry.findMany({
      where: { customerId },
      orderBy: { startTime: 'desc' }
    })

    if (timeEntries.length === 0) {
      return NextResponse.json([], { status: 200 })
    }

    // Get subscription item IDs from time entries
    const subscriptionItemIds = [...new Set(timeEntries.map(entry => entry.subscriptionItemId))]

    // Fetch usage records for each subscription item
    const usageRecords = await Promise.all(
      subscriptionItemIds.map(async (subscriptionItemId) => {
        try {
          const records = await stripe.subscriptionItems.listUsageRecordSummaries(
            subscriptionItemId,
            { limit: 1 }
          )
          return records.data[0]
        } catch (error) {
          console.error(`Error fetching usage records for ${subscriptionItemId}:`, error)
          return null
        }
      })
    )

    // Create a map of subscription item IDs to their latest usage
    const usageMap = new Map(
      subscriptionItemIds.map((id, index) => [id, usageRecords[index]])
    )

    // Combine time entries with their usage records
    const entriesWithUsage = timeEntries.map(entry => ({
      ...entry,
      usage: usageMap.get(entry.subscriptionItemId) || null
    }))

    return NextResponse.json(entriesWithUsage)
  } catch (error) {
    console.error('Error in time-entries API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    )
  }
} 