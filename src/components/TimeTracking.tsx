'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface TimeEntry {
  customerId: string
  date: Date
  startTime: string
  endTime: string
  notes: string
}

interface Customer {
  id: string
  email: string
  name: string
  created: number
}

interface TimeTrackingProps {
  customers: Customer[]
}

export function TimeTracking({ customers }: TimeTrackingProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [date, setDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const calculateHours = (start: string, end: string): number => {
    const [startHour, startMinute] = start.split(":").map(Number)
    const [endHour, endMinute] = end.split(":").map(Number)
    
    const startInMinutes = startHour * 60 + startMinute
    const endInMinutes = endHour * 60 + endMinute
    
    return (endInMinutes - startInMinutes) / 60
  }

  const handleSubmit = async () => {
    if (!selectedCustomer || !date || !startTime || !endTime) {
      toast.error("Please fill in all required fields")
      return
    }

    const hours = calculateHours(startTime, endTime)
    if (hours <= 0) {
      toast.error("End time must be after start time")
      return
    }

    setSubmitting(true)
    try {
      // Create the time entry
      const timeEntry: TimeEntry = {
        customerId: selectedCustomer,
        date,
        startTime,
        endTime,
        notes
      }
      console.log('Time entry created:', timeEntry)

      // Submit billing meter event
      const response = await fetch('/api/billing/meter-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedCustomer,
          hours,
          date: date.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit time entry')
      }

      // Reset form
      setSelectedCustomer("")
      setDate(new Date())
      setStartTime("")
      setEndTime("")
      setNotes("")
      
      toast.success("Time entry submitted successfully")
    } catch (error) {
      console.error('Error submitting time entry:', error)
      toast.error("Failed to submit time entry")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Tracking</CardTitle>
        <CardDescription>Track time for customer billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Customer</Label>
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
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any notes about the work done..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button 
          className="w-full" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Time Entry"}
        </Button>
      </CardContent>
    </Card>
  )
} 