"use client"

import React from "react"
import Editor, { OnChange, OnMount } from "@monaco-editor/react"

type CodeEditorProps = {
  value: string
  language?: string
  theme?: "vs-dark" | "light" | string
  height?: string | number
  onChange?: (value: string) => void
}

export default function CodeEditor({
  value,
  language = "typescript",
  theme = "vs-dark",
  height = "60vh",
  onChange,
}: CodeEditorProps) {
  const handleChange: OnChange = (val) => {
    onChange?.(val || "")
  }

  const handleMount: OnMount = (editor, monaco) => {
    editor.updateOptions({
      fontSize: 13,
      minimap: { enabled: true },
      wordWrap: "off",
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      smoothScrolling: true,
      scrollBeyondLastLine: false,
    })
  }

  return (
    <Editor
      value={value}
      defaultValue={value}
      onChange={handleChange}
      onMount={handleMount}
      language={language}
      theme={theme}
      height={height}
      options={{
        renderWhitespace: "selection",
      }}
    />
  )
}



