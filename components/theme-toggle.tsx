"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Settings, Sun, Moon, Monitor, X, Check, Palette } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type ColorOption = {
  name: string
  value: string
  hsl: string
}

const colorOptions: ColorOption[] = [
  { name: "Red", value: "red", hsl: "0 84.2% 60.2%" }, // Default Vodafone Red
  { name: "Blue", value: "blue", hsl: "210 84.2% 60.2%" },
  { name: "Green", value: "green", hsl: "142.1 76.2% 36.3%" },
  { name: "Purple", value: "purple", hsl: "270 84.2% 60.2%" },
  { name: "Orange", value: "orange", hsl: "30 84.2% 60.2%" },
  { name: "Pink", value: "pink", hsl: "330 84.2% 60.2%" },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)
  const [selectedColor, setSelectedColor] = React.useState<ColorOption>(colorOptions[0]) // Default to Red

  React.useEffect(() => {
    // Initialize color from CSS variable if it exists
    const rootStyle = getComputedStyle(document.documentElement)
    const currentPrimaryHsl = rootStyle.getPropertyValue("--primary").trim()
    const initialColor = colorOptions.find((color) => color.hsl === currentPrimaryHsl)
    if (initialColor) {
      setSelectedColor(initialColor)
    }
  }, [])

  const handleColorChange = (color: ColorOption) => {
    setSelectedColor(color)
    document.documentElement.style.setProperty("--primary", color.hsl)
    document.documentElement.style.setProperty("--primary-foreground", "210 20% 98%") // Keep foreground white/light
    // For dark mode, you might want to adjust foreground based on primary lightness
    // For simplicity, keeping it fixed for now.
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-white dark:bg-primary-dark text-primary-dark dark:text-white hover:bg-gray-100 dark:hover:bg-primary-dark/80"
          aria-label="Open theme settings"
        >
          <Settings className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
          <span className="sr-only">Toggle theme settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] pr-0">
        <SheetHeader className="pr-6">
          <SheetTitle className="flex justify-between items-center">
            <span>الإعدادات</span>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close settings">
              <X className="h-5 w-5" />
            </Button>
          </SheetTitle>
        </SheetHeader>
        <div className="p-6 space-y-8 overflow-y-auto h-[calc(100%-60px)]">
          {/* Theme Mode */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary-dark dark:text-white">وضع الثيم</h3>
            <p className="text-sm text-neutral-medium mb-4">اختر الوضع الفاتح أو الداكن أو التلقائي</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className={cn(
                  "flex flex-col items-center justify-center h-24",
                  theme === "light"
                    ? "bg-primary text-primary-foreground"
                    : "border-neutral-300 text-neutral-medium hover:bg-neutral-100",
                )}
              >
                <Sun className="h-6 w-6 mb-2" />
                <span>فاتح</span>
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex flex-col items-center justify-center h-24",
                  theme === "dark"
                    ? "bg-primary text-primary-foreground"
                    : "border-neutral-300 text-neutral-medium hover:bg-neutral-100",
                )}
              >
                <Moon className="h-6 w-6 mb-2" />
                <span>داكن</span>
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
                className={cn(
                  "flex flex-col items-center justify-center h-24",
                  theme === "system"
                    ? "bg-primary text-primary-foreground"
                    : "border-neutral-300 text-neutral-medium hover:bg-neutral-100",
                )}
              >
                <Monitor className="h-6 w-6 mb-2" />
                <span>تلقائي</span>
              </Button>
            </div>
          </div>

          {/* Theme Contrast (UI only, no functional logic for now) */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary-dark dark:text-white">تباين الثيم</h3>
            <p className="text-sm text-neutral-medium mb-4">اختر تباين الثيم</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 border-neutral-300 text-neutral-medium hover:bg-neutral-100 bg-transparent"
              >
                <Palette className="h-6 w-6 mb-2" /> {/* Placeholder icon */}
                <span>عادي</span>
              </Button>
              <Button
                variant="default" // Example of selected state from image
                className="flex flex-col items-center justify-center h-24 bg-primary text-primary-foreground"
              >
                <Palette className="h-6 w-6 mb-2" /> {/* Placeholder icon */}
                <span>عالي التباين</span>
              </Button>
            </div>
          </div>

          {/* Custom Theme Color */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary-dark dark:text-white">لون الثيم المخصص</h3>
            <p className="text-sm text-neutral-medium mb-4">اختر لونك الأساسي</p>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color) => (
                <Button
                  key={color.value}
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-md flex items-center justify-center border-2",
                    selectedColor.value === color.value ? "border-primary" : "border-transparent",
                  )}
                  style={{ backgroundColor: `hsl(${color.hsl})` }}
                  onClick={() => handleColorChange(color)}
                  aria-label={`Set primary color to ${color.name}`}
                >
                  {selectedColor.value === color.value && <Check className="h-6 w-6 text-white drop-shadow-sm" />}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
