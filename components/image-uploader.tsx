"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Trash2, Camera, LinkIcon, ImageIcon } from "lucide-react"

interface ImageUploaderProps {
  initialImage?: string
}

export default function ImageUploader({ initialImage }: ImageUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage || null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    document.getElementById("file-upload")?.click()
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Card className="w-64 h-64 flex items-center justify-center overflow-hidden">
        <CardContent className="p-2">
          {imagePreview ? (
            <Image
              src={imagePreview || "/placeholder.svg"}
              alt="Preview"
              width={240}
              height={240}
              className="object-contain rounded-md"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <ImageIcon className="mx-auto h-16 w-16" />
              <p>لا توجد صورة</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setImagePreview(null)} disabled={!imagePreview}>
          <Trash2 className="h-5 w-5 text-red-500" />
          <span className="sr-only">حذف</span>
        </Button>
        <Button variant="outline" size="icon" onClick={triggerFileInput}>
          <Upload className="h-5 w-5" />
          <span className="sr-only">رفع</span>
        </Button>
        <input type="file" id="file-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
        <Button variant="outline" size="icon">
          <LinkIcon className="h-5 w-5" />
          <span className="sr-only">رابط</span>
        </Button>
        <Button variant="outline" size="icon">
          <Camera className="h-5 w-5" />
          <span className="sr-only">كاميرا</span>
        </Button>
        <Button variant="outline" size="icon" onClick={triggerFileInput}>
          <ImageIcon className="h-5 w-5" />
          <span className="sr-only">معرض الصور</span>
        </Button>
      </div>
    </div>
  )
}
