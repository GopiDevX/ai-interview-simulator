/**
 * RAG Service — Retrieval-Augmented Generation for Resume Processing
 * 
 * Chunks resume text into meaningful sections, generates embeddings,
 * builds an in-memory vector store, and retrieves the most relevant
 * chunks for each interview question context.
 */

let GoogleGenAI
try {
  GoogleGenAI = require('@google/genai').GoogleGenAI
} catch {
  GoogleGenAI = null
}

// ── SECTION DETECTION PATTERNS ──────────────────────────────────────────────

const SECTION_HEADERS = [
  { pattern: /\b(work\s*experience|professional\s*experience|experience|employment\s*history|work\s*history)\b/i, label: 'EXPERIENCE' },
  { pattern: /\b(education|academic|qualification|degree|university|college)\b/i, label: 'EDUCATION' },
  { pattern: /\b(skills|technical\s*skills|technologies|tech\s*stack|competencies|proficiencies)\b/i, label: 'SKILLS' },
  { pattern: /\b(projects|personal\s*projects|key\s*projects|notable\s*projects|portfolio)\b/i, label: 'PROJECTS' },
  { pattern: /\b(certifications?|certificates?|licenses?|credentials?)\b/i, label: 'CERTIFICATIONS' },
  { pattern: /\b(achievements?|awards?|honors?|accomplishments?)\b/i, label: 'ACHIEVEMENTS' },
  { pattern: /\b(summary|objective|profile|about\s*me|professional\s*summary)\b/i, label: 'SUMMARY' },
  { pattern: /\b(publications?|research|papers?)\b/i, label: 'PUBLICATIONS' },
  { pattern: /\b(volunteer|community|extracurricular|activities)\b/i, label: 'ACTIVITIES' },
  { pattern: /\b(references?|recommendations?)\b/i, label: 'REFERENCES' }
]

// ── CHUNKING ────────────────────────────────────────────────────────────────

/**
 * Splits raw resume text into meaningful chunks using section-header detection.
 * Falls back to overlapping fixed-size windows for unstructured text.
 * 
 * @param {string} rawText - Raw text extracted from the PDF
 * @returns {Array<{text: string, section: string}>} Array of chunks with section labels
 */
function chunkResumeText(rawText) {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return []
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  // Try section-aware chunking first
  const sectionChunks = extractSections(lines)
  
  if (sectionChunks.length >= 2) {
    // Section-aware chunking succeeded — further split large sections
    const finalChunks = []
    for (const chunk of sectionChunks) {
      if (chunk.text.length > 1500) {
        // Split oversized sections into overlapping windows
        const subChunks = fixedSizeChunk(chunk.text, 800, 150)
        subChunks.forEach((subText, idx) => {
          finalChunks.push({
            text: subText,
            section: `${chunk.section} (Part ${idx + 1})`
          })
        })
      } else if (chunk.text.length > 30) {
        finalChunks.push(chunk)
      }
    }
    return finalChunks
  }

  // Fallback: fixed-size overlapping windows
  const windowChunks = fixedSizeChunk(rawText, 800, 150)
  return windowChunks.map((text, idx) => ({
    text,
    section: `SECTION_${idx + 1}`
  }))
}

/**
 * Extract sections by detecting section headers in the resume text.
 */
function extractSections(lines) {
  const sections = []
  let currentSection = 'GENERAL'
  let currentLines = []

  for (const line of lines) {
    const detectedSection = detectSectionHeader(line)
    
    if (detectedSection && currentLines.length > 0) {
      // Save the previous section
      sections.push({
        text: currentLines.join('\n'),
        section: currentSection
      })
      currentLines = []
      currentSection = detectedSection
    } else if (detectedSection) {
      currentSection = detectedSection
    } else {
      currentLines.push(line)
    }
  }

  // Don't forget the last section
  if (currentLines.length > 0) {
    sections.push({
      text: currentLines.join('\n'),
      section: currentSection
    })
  }

  return sections
}

/**
 * Detect if a line is a section header.
 */
function detectSectionHeader(line) {
  // Section headers are typically short (< 60 chars) and may be uppercase
  if (line.length > 80) return null

  for (const { pattern, label } of SECTION_HEADERS) {
    if (pattern.test(line)) {
      return label
    }
  }
  return null
}

/**
 * Split text into fixed-size overlapping chunks.
 * 
 * @param {string} text - Text to split
 * @param {number} chunkSize - Target characters per chunk
 * @param {number} overlap - Overlap characters between chunks
 * @returns {string[]} Array of text chunks
 */
function fixedSizeChunk(text, chunkSize = 800, overlap = 150) {
  const chunks = []
  let start = 0

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length)
    
    // Try to break at a sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end)
      const lastNewline = text.lastIndexOf('\n', end)
      const breakPoint = Math.max(lastPeriod, lastNewline)
      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1
      }
    }

    const chunk = text.slice(start, end).trim()
    if (chunk.length > 30) {
      chunks.push(chunk)
    }
    
    start = end - overlap
    if (start >= text.length) break
  }

  return chunks
}

// ── EMBEDDINGS ──────────────────────────────────────────────────────────────

/**
 * Generate embeddings for an array of text chunks using Gemini's embedding model.
 * Falls back to TF-IDF-like vectors when no API key is available.
 * 
 * @param {string[]} texts - Array of text strings to embed
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
async function embedChunks(texts) {
  if (!texts || texts.length === 0) return []

  const apiKey = process.env.GEMINI_API_KEY
  if (apiKey) {
    try {
      return await embedWithGemini(texts, apiKey)
    } catch (err) {
      console.error('Gemini embedding failed, falling back to TF-IDF:', err.message)
      return embedWithTFIDF(texts)
    }
  }

  return embedWithTFIDF(texts)
}

/**
 * Embed texts using Gemini's text-embedding-004 model.
 */
async function embedWithGemini(texts, apiKey) {
  const ai = new GoogleGenAI({ apiKey })
  
  const embeddings = []
  // Batch in groups of 10 to avoid rate limits
  const batchSize = 10
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    
    const results = await Promise.all(
      batch.map(async (text) => {
        const response = await ai.models.embedContent({
          model: 'text-embedding-004',
          contents: text
        })
        return response.embedding.values
      })
    )
    
    embeddings.push(...results)
  }

  return embeddings
}

/**
 * Fallback: Generate simple TF-IDF-like vectors for keyword matching.
 * Uses a fixed vocabulary of common tech/professional terms.
 */
function embedWithTFIDF(texts) {
  // Build vocabulary from all chunks
  const vocab = new Map()
  const tokenizedTexts = texts.map(text => {
    const tokens = text.toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2)
    tokens.forEach(t => {
      vocab.set(t, (vocab.get(t) || 0) + 1)
    })
    return tokens
  })

  // Use top 200 terms as feature dimensions
  const sortedTerms = [...vocab.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200)
    .map(([term]) => term)

  // Generate TF-IDF vectors
  const docCount = texts.length
  return tokenizedTexts.map(tokens => {
    const termFreqs = new Map()
    tokens.forEach(t => termFreqs.set(t, (termFreqs.get(t) || 0) + 1))

    return sortedTerms.map(term => {
      const tf = (termFreqs.get(term) || 0) / Math.max(tokens.length, 1)
      const docsWithTerm = tokenizedTexts.filter(t => t.includes(term)).length
      const idf = Math.log((docCount + 1) / (docsWithTerm + 1)) + 1
      return tf * idf
    })
  })
}

// ── VECTOR STORE ────────────────────────────────────────────────────────────

/**
 * Build an in-memory vector store from chunks and their embeddings.
 * 
 * @param {Array<{text: string, section: string}>} chunks
 * @param {number[][]} embeddings
 * @returns {Array<{text: string, section: string, embedding: number[]}>}
 */
function buildVectorStore(chunks, embeddings) {
  if (chunks.length !== embeddings.length) {
    throw new Error(`Chunk/embedding count mismatch: ${chunks.length} vs ${embeddings.length}`)
  }

  return chunks.map((chunk, i) => ({
    text: chunk.text,
    section: chunk.section,
    embedding: embeddings[i]
  }))
}

/**
 * Query the vector store for the most relevant chunks given a query string.
 * 
 * @param {Array<{text: string, section: string, embedding: number[]}>} store
 * @param {string} queryText - The query to search for
 * @param {number} topK - Number of top results to return (default: 3)
 * @returns {Promise<Array<{text: string, section: string, score: number}>>}
 */
async function queryVectorStore(store, queryText, topK = 3) {
  if (!store || store.length === 0) return []

  // Embed the query using the same method as the store
  const queryEmbeddings = await embedChunks([queryText])
  if (queryEmbeddings.length === 0) return []

  const queryVec = queryEmbeddings[0]

  // Compute cosine similarity against all stored vectors
  const scored = store.map(item => ({
    text: item.text,
    section: item.section,
    score: cosineSimilarity(queryVec, item.embedding)
  }))

  // Sort by score descending and return top-K
  scored.sort((a, b) => b.score - a.score)
  
  const results = scored.slice(0, topK)
  
  console.log(`[RAG] Query: "${queryText.substring(0, 60)}..." → Top ${topK} chunks:`)
  results.forEach((r, i) => {
    console.log(`  [${i + 1}] Section: ${r.section} | Score: ${r.score.toFixed(4)} | Preview: "${r.text.substring(0, 50)}..."`)
  })

  return results
}

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dotProduct / denominator
}

// ── CONVENIENCE: FULL PIPELINE ──────────────────────────────────────────────

/**
 * Run the full RAG pipeline on raw resume text.
 * Returns the vector store ready for querying.
 * 
 * @param {string} rawText - Raw text from pdf-parse
 * @returns {Promise<{chunks: Array, vectorStore: Array}>}
 */
async function processResume(rawText) {
  console.log('[RAG] Processing resume...')
  
  const chunks = chunkResumeText(rawText)
  console.log(`[RAG] Created ${chunks.length} chunks:`, chunks.map(c => `${c.section} (${c.text.length} chars)`))

  if (chunks.length === 0) {
    console.log('[RAG] No chunks created from resume text')
    return { chunks: [], vectorStore: [] }
  }

  const texts = chunks.map(c => c.text)
  const embeddings = await embedChunks(texts)
  const vectorStore = buildVectorStore(chunks, embeddings)

  console.log(`[RAG] Vector store built with ${vectorStore.length} entries`)
  
  return { chunks, vectorStore }
}

/**
 * Format retrieved chunks into a prompt-friendly string.
 * 
 * @param {Array<{text: string, section: string, score: number}>} chunks
 * @returns {string}
 */
function formatChunksForPrompt(chunks) {
  if (!chunks || chunks.length === 0) return ''

  return chunks
    .map(c => `[From ${c.section} section (relevance: ${(c.score * 100).toFixed(0)}%)]:\n${c.text}`)
    .join('\n\n---\n\n')
}

module.exports = {
  chunkResumeText,
  embedChunks,
  buildVectorStore,
  queryVectorStore,
  processResume,
  formatChunksForPrompt,
  cosineSimilarity
}
