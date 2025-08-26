"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"

interface Dashboard {
  id: string
  name: string
  description: string | null
  tags: string[]
  is_public: boolean
  is_template: boolean
}

interface DashboardDialogProps {
  isOpen: boolean
  onClose: () => void
  editingDashboard?: Dashboard | null
}

export function DashboardDialog({ isOpen, onClose, editingDashboard }: DashboardDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [isTemplate, setIsTemplate] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  // Reset form when dialog opens/closes or editing dashboard changes
  useEffect(() => {
    if (isOpen) {
      if (editingDashboard) {
        setName(editingDashboard.name)
        setDescription(editingDashboard.description || "")
        setIsPublic(editingDashboard.is_public)
        setIsTemplate(editingDashboard.is_template)
        setTags(editingDashboard.tags || [])
      } else {
        // Reset form for new dashboard
        setName("")
        setDescription("")
        setIsPublic(false)
        setIsTemplate(false)
        setTags([])
      }
      setTagInput("")
      setError(null)
    }
  }, [isOpen, editingDashboard])

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const dashboardData = {
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
        is_template: isTemplate,
        tags: tags,
      }

      if (editingDashboard) {
        // Update existing dashboard
        const { error } = await supabase
          .from("dashboards")
          .update({
            ...dashboardData,
          })
          .eq("id", editingDashboard.id)

        if (error) throw error
      } else {
        // Create new dashboard
        const { data, error } = await supabase.from("dashboards").insert([dashboardData]).select().single()

        if (error) throw error

        // Redirect to the new dashboard
        if (data) {
          router.push(`/dashboard/${data.id}`)
          return
        }
      }

      router.refresh()
      onClose()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingDashboard ? "Edit Dashboard" : "Create Dashboard"}</DialogTitle>
          <DialogDescription>
            {editingDashboard
              ? "Update your dashboard settings and metadata."
              : "Create a new dashboard to start building your data visualizations."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="My Dashboard"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this dashboard"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-3">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Dashboard</Label>
                <div className="text-sm text-muted-foreground">Allow others to view this dashboard</div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            {/*
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Template</Label>
                  <div className="text-sm text-muted-foreground">Make this dashboard available as a template</div>
                </div>
                <Switch checked={isTemplate} onCheckedChange={setIsTemplate} />
              </div>
            */}
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : editingDashboard ? "Update Dashboard" : "Create Dashboard"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
