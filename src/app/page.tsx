'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toaster } from "@/components/ui/sonner"
import { TimeTracking } from "@/components/TimeTracking"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Customer {
  id: string
  email: string
  name: string
  created: number
}

export default function DashboardPage() {
  const [productId, setProductId] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [newCustomer, setNewCustomer] = useState({ email: "", name: "" })
  const [loading, setLoading] = useState(false)
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setIsLoadingCustomers(true)
    setError(null)
    try {
      console.log('Fetching customers from API...')
      const response = await fetch('/api/customers')
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }
      const data = await response.json()
      console.log('Customers data received:', data)
      setCustomers(data.data)
      toast.success('Customers loaded successfully')
    } catch (error) {
      console.error('Error fetching customers:', error)
      setError('Failed to load customers. Please try again.')
      toast.error('Failed to load customers')
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  const createCustomer = async () => {
    if (!newCustomer.email || !newCustomer.name) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCustomer)
      })
      const data = await response.json()
      setCustomers([...customers, data])
      setNewCustomer({ email: "", name: "" })
      toast.success('Customer created successfully')
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error('Failed to create customer')
    }
    setLoading(false)
  }

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer)
  }

  const deleteCustomer = async () => {
    if (!customerToDelete) return

    try {
      const response = await fetch(`/api/customers/${customerToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete customer')
      }
      
      setCustomers(customers.filter(customer => customer.id !== customerToDelete.id))
      toast.success('Customer deleted successfully')
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Failed to delete customer')
    } finally {
      setCustomerToDelete(null)
    }
  }

  const createProduct = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Product created:', data)
      toast.success('Product created successfully')
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Failed to create product')
    }
  }

  const createPrice = async () => {
    if (!productId) {
      toast.error('Please enter a product ID')
      return
    }

    try {
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      })
      const data = await response.json()
      console.log('Price created:', data)
      toast.success('Price created successfully')
    } catch (error) {
      console.error('Error creating price:', error)
      toast.error('Failed to create price')
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">Stripe Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <TimeTracking customers={customers} />

          <Card>
            <CardHeader>
              <CardTitle>Create Customer</CardTitle>
              <CardDescription>Add a new customer to your Stripe account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter customer email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter customer name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
              </div>
              <Button onClick={createCustomer} disabled={loading}>
                {loading ? 'Creating...' : 'Create Customer'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create Product</CardTitle>
              <CardDescription>Create a new product in your Stripe account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={createProduct}>Create Product</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create Price</CardTitle>
              <CardDescription>Create a new price for an existing product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Product ID</Label>
                <Input
                  id="productId"
                  placeholder="Enter product ID"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                />
              </div>
              <Button onClick={createPrice}>Create Price</Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Customers</CardTitle>
              <CardDescription>List of all customers in your Stripe account</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCustomers ? (
                <div className="flex items-center justify-center p-8">
                  <p className="text-muted-foreground">Loading customers...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center p-8">
                  <p className="text-destructive">{error}</p>
                  <Button 
                    variant="outline" 
                    className="ml-4"
                    onClick={fetchCustomers}
                  >
                    Retry
                  </Button>
                </div>
              ) : customers.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <p className="text-muted-foreground">No customers found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{customer.name}</h3>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteClick(customer)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {customerToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setCustomerToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteCustomer}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
} 