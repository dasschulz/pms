import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get("pathname");

  if (!pathname) {
    return NextResponse.json({ error: "Pathname is required" }, { status: 400 });
  }

  // Construct the full path to the funktion.md file
  // The path should be relative to the project root, so we go up from `src/app/api/funktion-md`
  // then into `src/app/[pathname]/funktion.md`
  // Sanitize pathname to prevent directory traversal
  const safePathname = path.normalize(pathname).replace(/^(\.\.[\\\/])+/, '');
  let filePath = path.join(process.cwd(), "src", "app", safePathname, "funktion.md");

  // Handle the case for the root page (e.g. /)
  // The main page.tsx is directly in src/app, not src/app/.
  // So, if pathname is '/', we look for src/app/funktion.md (assuming you might create one there for the main page)
  if (safePathname === "/") {
    filePath = path.join(process.cwd(), "src", "app", "funktion.md");
  }


  try {
    const content = await fs.readFile(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    // console.error(`File not found or error reading file for pathname: ${pathname}`, error);
    // Check if the error is because the file doesn't exist
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json({ content: "Für diese Seite ist keine Funktionsbeschreibung (funktion.md) vorhanden." }, { status: 200 });
    }
    return NextResponse.json({ error: "Error reading funktion.md file" }, { status: 500 });
  }
} 