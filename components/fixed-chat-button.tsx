"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import ChatDialog from "@/components/chat-dialog" // Import ChatDialog

export default function FixedChatButton() {
  return (
    <ChatDialog>
      <Button
        size="icon"
        className="fixed bottom-4 left-4 z-50 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
        aria-label="Open chat with support"
      >
        <MessageCircle className="h-[1.4rem] w-[1.4rem] rotate-0 scale-100 transition-all" />
        <span className="sr-only">فتح المحادثة</span>
      </Button>
    </ChatDialog>
  )
}
