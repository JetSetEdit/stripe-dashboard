'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface TimeEntry {
  customerId: string
  customerName: string
  date: Date
  startTime: string
  endTime: string
  notes: string
}

interface Customer {
  id: string
  name: string
  email: string
}

interface TimeTrackingProps {
  customers: Customer[]
}

export function TimeTracking({ customers }: TimeTrackingProps) {
  const [date, setDate] = useState<Date>()
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = () => {
    if (!date || !startTime || !endTime || !selectedCustomer) {
      alert("Please fill in all required fields")
      return
    }

    const timeEntry: TimeEntry = {
      customerId: selectedCustomer,
      customerName: customers.find(c => c.id === selectedCustomer)?.name || "",
      date: date,
      startTime,
      endTime,
      notes
    }

    console.log("Time entry created:", timeEntry)
    // Here you would typically save this to your backend
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Tracking</CardTitle>
        <CardDescription>Track time for customer billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Customer</label>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Time</label>
            <div className="flex">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Time</label>
            <div className="flex">
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            placeholder="Add any notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Add Entry
        </Button>
      </CardContent>
    </Card>
  )
} 