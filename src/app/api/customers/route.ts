import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
})

export async function GET() {
  try {
    const customers = await stripe.customers.list()
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()
    const customer = await stripe.customers.create({
      email,
      name
    })
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 