"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, X } from "lucide-react" // Removed MessageCircle as it's now passed as children
import { cn } from "@/lib/utils"

interface ChatDialogProps {
  children: React.ReactNode // This will be the trigger element
}

export default function ChatDialog({ children }: ChatDialogProps) {
  const [open, setOpen] = useState(false)

  const messages = [
    {
      id: 1,
      sender: "user",
      text: "مرحباً، لدي استفسار بخصوص أحد المنتجات. هل يمكنكم مساعدتي؟",
      avatar: "/placeholder-user.jpg",
    },
    {
      id: 2,
      sender: "support",
      text: "أهلاً بك! بالتأكيد، يسعدنا مساعدتك. ما هو استفسارك بالتحديد؟",
      avatar: "/placeholder-logo.png",
    },
    {
      id: 3,
      sender: "user",
      text: "أبحث عن فستان سهرة أنيق، ولكنني لا أجد المقاس المناسب. هل يتوفر مقاس XL من فستان 'الأناقة السوداء'؟",
      avatar: "/placeholder-user.jpg",
    },
    {
      id: 4,
      sender: "support",
      text: "لحظة من فضلك، سأقوم بالتحقق من توفر المقاس المطلوب في المخزون. يرجى الانتظار قليلاً.",
      avatar: "/placeholder-logo.png",
    },
    {
      id: 5,
      sender: "support",
      text: "للأسف، مقاس XL من فستان 'الأناقة السوداء' غير متوفر حالياً. ولكن لدينا مقاسات أخرى، وهناك فساتين مشابهة قد تعجبك.",
      avatar: "/placeholder-logo.png",
    },
    {
      id: 6,
      sender: "user",
      text: "حسناً، شكراً جزيلاً على المساعدة السريعة!",
      avatar: "/placeholder-user.jpg",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger> {/* Render children as the trigger */}
      <DialogContent className="sm:max-w-[425px] h-[90vh] sm:h-[600px] flex flex-col p-0 rounded-xl overflow-hidden">
        <DialogHeader className="border-b border-neutral-200 dark:border-primary-dark p-4 text-center relative">
          <DialogTitle className="text-xl font-semibold text-primary-dark dark:text-foreground">
            محادثة مباشرة مع الدعم
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-medium hover:text-primary-dark dark:text-muted-foreground dark:hover:text-white"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-neutral-light dark:bg-background">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex items-end gap-3", message.sender === "user" ? "justify-end" : "justify-start")}
            >
              {message.sender === "support" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.avatar || "/placeholder.svg"} alt="Support Avatar" />
                  <AvatarFallback>SD</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[70%] p-3 rounded-lg text-sm",
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-dark dark:text-white rounded-bl-none",
                )}
              >
                {message.text}
              </div>
              {message.sender === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.avatar || "/placeholder.svg"} alt="User Avatar" />
                  <AvatarFallback>ME</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-neutral-200 dark:border-primary-dark p-4 flex items-center gap-3 bg-white dark:bg-card">
          <Input
            type="text"
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 pr-4 pl-4 py-2 rounded-lg border border-neutral-300 dark:border-primary-dark focus:ring-primary focus:border-primary"
          />
          <Button size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-10 w-10">
            <Send className="h-5 w-5" />
            <span className="sr-only">إرسال</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
