import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, '../blog');
const outputDir = path.join(__dirname, '../public');

// Escape HTML
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Simple but effective markdown parser
function parseMDToHTML(markdown) {
  let html = markdown;
  
  // Step 1: Preserve code blocks FIRST with unique markers
  const codeBlocks = [];
  const codeMarker = 'CODECODECODE'; // Unique marker that won't be processed
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const idx = codeBlocks.length;
    const escaped = code.trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    codeBlocks.push(escaped);
    return `\n${codeMarker}${idx}${codeMarker}\n`;
  });
  
  // Step 2: Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Step 3: Horizontal rules
  html = html.replace(/^---$/gm, '<hr />');
  
  // Step 4: Text formatting (be careful with emphasis markers)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Step 5: Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  
  // Step 6: Lists
  const lines = html.split('\n');
  let result = [];
  let currentList = [];
  let listType = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip code block markers (will be replaced later)
    if (trimmed.includes(codeMarker)) {
      if (listType && currentList.length > 0) {
        if (listType === 'ordered') {
          result.push('<ol>\n' + currentList.join('\n') + '\n</ol>');
        } else {
          result.push('<ul>\n' + currentList.join('\n') + '\n</ul>');
        }
        currentList = [];
        listType = null;
      }
      result.push(line);
      continue;
    }
    
    // Ordered list item
    if (trimmed.match(/^\d+\./)) {
      if (listType === 'unordered' && currentList.length > 0) {
        result.push('<ul>\n' + currentList.join('\n') + '\n</ul>');
        currentList = [];
      }
      listType = 'ordered';
      currentList.push('<li>' + trimmed.replace(/^\d+\.\s+/, '') + '</li>');
      continue;
    }
    
    // Unordered list item
    if (trimmed.match(/^[-*]\s/)) {
      if (listType === 'ordered' && currentList.length > 0) {
        result.push('<ol>\n' + currentList.join('\n') + '\n</ol>');
        currentList = [];
      }
      listType = 'unordered';
      currentList.push('<li>' + trimmed.replace(/^[-*]\s+/, '') + '</li>');
      continue;
    }
    
    // End current list
    if (listType && trimmed !== '' && !trimmed.match(/^\d+\./) && !trimmed.match(/^[-*]\s/)) {
      if (listType === 'ordered') {
        result.push('<ol>\n' + currentList.join('\n') + '\n</ol>');
      } else {
        result.push('<ul>\n' + currentList.join('\n') + '\n</ul>');
      }
      currentList = [];
      listType = null;
    }
    
    result.push(line);
  }
  
  // Flush remaining list
  if (listType && currentList.length > 0) {
    if (listType === 'ordered') {
      result.push('<ol>\n' + currentList.join('\n') + '\n</ol>');
    } else {
      result.push('<ul>\n' + currentList.join('\n') + '\n</ul>');
    }
  }
  
  html = result.join('\n');
  
  // Step 7: Paragraphs
  const finalLines = html.split('\n');
  let finalResult = [];
  let currentPara = [];
  
  for (const line of finalLines) {
    const trimmed = line.trim();
    
    if (trimmed === '') {
      if (currentPara.length > 0) {
        finalResult.push('<p>' + currentPara.join(' ') + '</p>');
        currentPara = [];
      }
    } else if (trimmed.match(/^<[h1-6hr]|^<ol|^<ul|^<div/) || trimmed.includes(codeMarker)) {
      if (currentPara.length > 0) {
        finalResult.push('<p>' + currentPara.join(' ') + '</p>');
        currentPara = [];
      }
      finalResult.push(line);
    } else {
      currentPara.push(trimmed);
    }
  }
  
  if (currentPara.length > 0) {
    finalResult.push('<p>' + currentPara.join(' ') + '</p>');
  }
  
  html = finalResult.join('\n');
  
  // Step 8: Restore code blocks (MUST be absolute last)
  codeBlocks.forEach((code, idx) => {
    const marker = `${codeMarker}${idx}${codeMarker}`;
    html = html.replace(marker, `<pre><code>${code}</code></pre>`);
  });
  
  return html.trim();
}

// Calculate read time
function getReadTime(content) {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes;
}

// Parse frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!match) {
    return { meta: {}, content: content };
  }
  
  const [, frontmatter, markdown] = match;
  const meta = {};
  
  frontmatter.split('\n').forEach(line => {
    const [key, ...value] = line.split(': ');
    if (key && value.length) {
      meta[key.trim()] = value.join(': ').trim().replace(/^["']|["']$/g, '');
    }
  });
  
  return { meta, content: markdown };
}

// Main function
async function buildBlog() {
  try {
    if (!fs.existsSync(blogDir)) {
      console.log('📝 Blog directory not found. Creating...');
      fs.mkdirSync(blogDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
    const posts = [];

    files.forEach(file => {
      const filePath = path.join(blogDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { meta, content } = parseFrontmatter(raw);

      const slug = file.replace('.md', '');
      const readTime = getReadTime(content);
      const excerpt = content.split('\n')[0].substring(0, 160) + '...';
      const html = parseMDToHTML(content);

      posts.push({
        id: slug,
        slug,
        title: meta.title || slug,
        date: meta.date || new Date().toISOString().split('T')[0],
        author: meta.author || 'Faris',
        excerpt,
        image: meta.image || null,
        readTime,
        tags: (meta.tags || '').split(',').map(t => t.trim()).filter(Boolean),
        content: html
      });
    });

    // Sort by date descending
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Write blog.json
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'blog.json'),
      JSON.stringify(posts, null, 2)
    );

    console.log(`✅ Built ${posts.length} blog posts`);
    return posts;
  } catch (error) {
    console.error('❌ Blog build failed:', error);
    process.exit(1);
  }
}

buildBlog();
