"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface ActionButton {
  label: string
  icon: React.ElementType
  onClick?: () => void
  href?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  disabled?: boolean
}

interface PageHeaderProps {
  title: string
  actionButtons: ActionButton[]
}

export default function PageHeader({ title, actionButtons }: PageHeaderProps) {
  return (
    <div className="bg-white dark:bg-card p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-dark dark:text-foreground truncate">
          {title}
        </h1>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {actionButtons.map((button, index) => (
            <Button 
              key={index} 
              onClick={button.onClick} 
              variant={button.variant || "outline"} 
              asChild={!!button.href}
              size="sm"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              disabled={button.disabled}
            >
              {button.href ? (
                <a href={button.href} className="flex items-center gap-1 sm:gap-2">
                  <button.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{button.label}</span>
                  <span className="sm:hidden">{button.label.split(" ")[0]}</span>
                </a>
              ) : (
                <>
                  <button.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{button.label}</span>
                  <span className="sm:hidden">{button.label.split(" ")[0]}</span>
                </>
              )}
            </Button>
          ))}
        </div>
      </div>
      <Separator className="my-3 sm:my-4" />
    </div>
  )
}
