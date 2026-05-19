import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const blogDir = path.join(__dirname, '../blog')
const outputDir = path.join(__dirname, '../public')

// Escape HTML
function escapeHTML(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// Parse markdown table to HTML
function parseTable(tableLines) {
  if (tableLines.length < 2) return ''

  // Helper function to apply inline formatting to cell content
  function formatCell(cell) {
    let formatted = cell
    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>')
    // Inline code
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>')
    // Links
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    return formatted
  }

  // Parse header row
  const headerRow = tableLines[0].trim()
  const headers = headerRow
    .split('|')
    .map((cell) => cell.trim())
    .filter((cell) => cell !== '')

  // Skip separator row (line with dashes)
  const dataRows = tableLines.slice(2)

  let tableHTML =
    '<table style="border-collapse: collapse; width: 100%; margin: 1.5em 0; border: 1px solid rgba(128, 128, 128, 0.3);">\n'

  // Build header
  tableHTML += '  <thead>\n    <tr>\n'
  headers.forEach((header) => {
    tableHTML += `      <th style="border: 1px solid rgba(128, 128, 128, 0.3); padding: 12px; background-color: rgba(128, 128, 128, 0.15); text-align: left; font-weight: 600;">${formatCell(header)}</th>\n`
  })
  tableHTML += '    </tr>\n  </thead>\n'

  // Build body
  if (dataRows.length > 0) {
    tableHTML += '  <tbody>\n'
    dataRows.forEach((row, rowIndex) => {
      const cells = row
        .trim()
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell !== '')

      if (cells.length > 0) {
        const bgColor = rowIndex % 2 === 0 ? 'transparent' : 'rgba(128, 128, 128, 0.08)'
        tableHTML += `    <tr style="background-color: ${bgColor};">\n`
        cells.forEach((cell) => {
          tableHTML += `      <td style="border: 1px solid rgba(128, 128, 128, 0.3); padding: 12px;">${formatCell(cell)}</td>\n`
        })
        tableHTML += '    </tr>\n'
      }
    })
    tableHTML += '  </tbody>\n'
  }

  tableHTML += '</table>'

  return tableHTML
}

// Simple but effective markdown parser
function parseMDToHTML(markdown) {
  let html = markdown

  // Step 1: Preserve code blocks FIRST with unique markers
  const codeBlocks = []
  const codeMarker = 'CODECODECODE' // Unique marker that won't be processed
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const idx = codeBlocks.length
    const escaped = code
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
    codeBlocks.push(escaped)
    return `\n${codeMarker}${idx}${codeMarker}\n`
  })

  // Step 2: Parse and preserve tables
  const tables = []
  const tableMarker = 'TABLETABLETABLE'
  const tableLines = html.split('\n')
  let processedLines = []
  let i = 0

  while (i < tableLines.length) {
    const line = tableLines[i]

    // Check if this line starts a table
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const currentTable = [line]
      i++

      // Collect all consecutive table lines
      while (
        i < tableLines.length &&
        tableLines[i].trim().startsWith('|') &&
        tableLines[i].trim().endsWith('|')
      ) {
        currentTable.push(tableLines[i])
        i++
      }

      // Parse the table if we have at least 2 lines (header + separator)
      if (currentTable.length >= 2) {
        const tableHTML = parseTable(currentTable)
        const idx = tables.length
        tables.push(tableHTML)
        processedLines.push(`${tableMarker}${idx}${tableMarker}`)
      } else {
        processedLines.push(...currentTable)
      }
    } else {
      processedLines.push(line)
      i++
    }
  }

  html = processedLines.join('\n')

  // Step 3: Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>')

  // Step 4: Horizontal rules
  html = html.replace(/^---$/gm, '<hr />')

  // Step 5: Text formatting (be careful with emphasis markers)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.*?)_/g, '<em>$1</em>')

  // Step 6: Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')

  // Step 7: Lists
  const lines = html.split('\n')
  let result = []
  let currentList = []
  let listType = null

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip code block markers and table markers (will be replaced later)
    if (trimmed.includes(codeMarker) || trimmed.includes(tableMarker)) {
      if (listType && currentList.length > 0) {
        if (listType === 'ordered') {
          result.push('<ol>\n' + currentList.join('\n') + '\n</ol>')
        } else {
          result.push('<ul>\n' + currentList.join('\n') + '\n</ul>')
        }
        currentList = []
        listType = null
      }
      result.push(line)
      continue
    }

    // Ordered list item
    if (trimmed.match(/^\d+\./)) {
      if (listType === 'unordered' && currentList.length > 0) {
        result.push('<ul>\n' + currentList.join('\n') + '\n</ul>')
        currentList = []
      }
      listType = 'ordered'
      currentList.push('<li>' + trimmed.replace(/^\d+\.\s+/, '') + '</li>')
      continue
    }

    // Unordered list item
    if (trimmed.match(/^[-*]\s/)) {
      if (listType === 'ordered' && currentList.length > 0) {
        result.push('<ol>\n' + currentList.join('\n') + '\n</ol>')
        currentList = []
      }
      listType = 'unordered'
      currentList.push('<li>' + trimmed.replace(/^[-*]\s+/, '') + '</li>')
      continue
    }

    // End current list
    if (listType && trimmed !== '' && !trimmed.match(/^\d+\./) && !trimmed.match(/^[-*]\s/)) {
      if (listType === 'ordered') {
        result.push('<ol>\n' + currentList.join('\n') + '\n</ol>')
      } else {
        result.push('<ul>\n' + currentList.join('\n') + '\n</ul>')
      }
      currentList = []
      listType = null
    }

    result.push(line)
  }

  // Flush remaining list
  if (listType && currentList.length > 0) {
    if (listType === 'ordered') {
      result.push('<ol>\n' + currentList.join('\n') + '\n</ol>')
    } else {
      result.push('<ul>\n' + currentList.join('\n') + '\n</ul>')
    }
  }

  html = result.join('\n')

  // Step 8: Paragraphs
  const finalLines = html.split('\n')
  let finalResult = []
  let currentPara = []

  for (const line of finalLines) {
    const trimmed = line.trim()

    if (trimmed === '') {
      if (currentPara.length > 0) {
        finalResult.push('<p>' + currentPara.join(' ') + '</p>')
        currentPara = []
      }
    } else if (
      trimmed.match(/^<[h1-6hr]|^<ol|^<ul|^<div|^<table/) ||
      trimmed.includes(codeMarker) ||
      trimmed.includes(tableMarker)
    ) {
      if (currentPara.length > 0) {
        finalResult.push('<p>' + currentPara.join(' ') + '</p>')
        currentPara = []
      }
      finalResult.push(line)
    } else {
      currentPara.push(trimmed)
    }
  }

  if (currentPara.length > 0) {
    finalResult.push('<p>' + currentPara.join(' ') + '</p>')
  }

  html = finalResult.join('\n')

  // Step 9: Restore tables
  tables.forEach((table, idx) => {
    const marker = `${tableMarker}${idx}${tableMarker}`
    html = html.replace(marker, table)
  })

  // Step 10: Restore code blocks (MUST be absolute last)
  codeBlocks.forEach((code, idx) => {
    const marker = `${codeMarker}${idx}${codeMarker}`
    html = html.replace(marker, `<pre><code>${code}</code></pre>`)
  })

  return html.trim()
}

// Calculate read time
function getReadTime(content) {
  const words = content.split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return minutes
}

// Parse frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)

  if (!match) {
    return { meta: {}, content: content }
  }

  const [, frontmatter, markdown] = match
  const meta = {}

  frontmatter.split('\n').forEach((line) => {
    const [key, ...value] = line.split(': ')
    if (key && value.length) {
      meta[key.trim()] = value
        .join(': ')
        .trim()
        .replace(/^["']|["']$/g, '')
    }
  })

  return { meta, content: markdown }
}

// Main function
async function buildBlog() {
  try {
    if (!fs.existsSync(blogDir)) {
      console.log('📝 Blog directory not found. Creating...')
      fs.mkdirSync(blogDir, { recursive: true })
      return []
    }

    const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'))
    const posts = []

    files.forEach((file) => {
      const filePath = path.join(blogDir, file)
      const raw = fs.readFileSync(filePath, 'utf-8')
      const { meta, content } = parseFrontmatter(raw)

      const slug = file.replace('.md', '')
      const readTime = getReadTime(content)
      const excerpt = content.split('\n')[0].substring(0, 160) + '...'
      const html = parseMDToHTML(content)

      posts.push({
        id: slug,
        slug,
        title: meta.title || slug,
        date: meta.date || new Date().toISOString().split('T')[0],
        author: meta.author || 'Faris',
        excerpt,
        image: meta.image || null,
        readTime,
        tags: (meta.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        content: html,
      })
    })

    // Sort by date descending
    posts.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Write blog.json
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(path.join(outputDir, 'blog.json'), JSON.stringify(posts, null, 2))

    console.log(`✅ Built ${posts.length} blog posts`)
    return posts
  } catch (error) {
    console.error('❌ Blog build failed:', error)
    process.exit(1)
  }
}

buildBlog()
