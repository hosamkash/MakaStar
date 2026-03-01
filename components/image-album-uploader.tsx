"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, PlusCircle } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface ImageAlbumUploaderProps {
  initialImages?: string[]
}

export default function ImageAlbumUploader({ initialImages = [] }: ImageAlbumUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages: string[] = []
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          newImages.push(reader.result as string)
          if (newImages.length === files.length) {
            setImages((prevImages) => [...prevImages, ...newImages])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const triggerFileInput = () => {
    document.getElementById("album-file-upload")?.click()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-center">ألبوم صور الصنف</h3>
      <Card>
        <CardContent className="p-4">
          <ScrollArea className="w-full whitespace-nowrap rounded-md">
            <div className="flex w-max space-x-4 p-4">
              {images.map((src, index) => (
                <div key={index} className="relative group shrink-0">
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={`Album image ${index + 1}`}
                    width={150}
                    height={150}
                    className="h-40 w-40 object-cover rounded-md shadow-md"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <button
                onClick={triggerFileInput}
                className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <PlusCircle className="h-8 w-8 mb-2" />
                <span>إضافة صور</span>
              </button>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
      <input
        type="file"
        id="album-file-upload"
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />
    </div>
  )
}
