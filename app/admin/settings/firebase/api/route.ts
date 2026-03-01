import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

// Whitelisted files relative to project root
const FILES: Record<string, string> = {
  firestore: "firestore.rules",
  storage: "storage.rules",
  firebaseConfig: "lib/firebase.ts",
  firebaserc: ".firebaserc",
}

function getProjectRoot(): string {
  // In Next.js app dir, process.cwd() is project root
  return process.cwd()
}

function resolveFile(key: string): string | null {
  const rel = FILES[key]
  if (!rel) return null
  return path.join(getProjectRoot(), rel)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("file") || ""
  const filePath = resolveFile(key)
  if (!filePath) {
    return NextResponse.json({ error: "Invalid file key" }, { status: 400 })
  }
  try {
    const content = await fs.readFile(filePath, "utf8")
    return NextResponse.json({ key, path: FILES[key], content })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Read error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const key = String(body?.key || "")
    const content = String(body?.content ?? "")
    const filePath = resolveFile(key)
    if (!filePath) {
      return NextResponse.json({ error: "Invalid file key" }, { status: 400 })
    }
    await fs.writeFile(filePath, content, "utf8")
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Write error" }, { status: 500 })
  }
}



