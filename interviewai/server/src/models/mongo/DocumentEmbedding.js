const mongoose = require('mongoose')
const ragService = require('../../services/ragService')

const documentEmbeddingSchema = new mongoose.Schema({
  sessionId: { type: String, index: true },
  institutionId: { type: String, index: true },
  docType: {
    type: String,
    enum: ['resume', 'policy', 'jd', 'alumni_experience', 'general'],
    default: 'resume',
    index: true
  },
  section: { type: String, default: 'GENERAL' },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
})

// Compound index for session and document lookups
documentEmbeddingSchema.index({ sessionId: 1, docType: 1 })
documentEmbeddingSchema.index({ institutionId: 1, docType: 1 })

/**
 * Save vectors to MongoDB so they survive server restarts and scale across instances
 */
documentEmbeddingSchema.statics.persistVectors = async function ({
  sessionId = null,
  institutionId = null,
  docType = 'resume',
  chunks = [],
  embeddings = [],
  metadata = {}
}) {
  if (!chunks || chunks.length === 0 || !embeddings || embeddings.length === 0) return []

  // Clean old vectors for this session/docType if replacing
  if (sessionId) {
    await this.deleteMany({ sessionId, docType }).catch(() => null)
  }

  const docsToInsert = chunks.map((chunk, idx) => ({
    sessionId,
    institutionId,
    docType,
    section: chunk.section || 'GENERAL',
    text: chunk.text,
    embedding: embeddings[idx] || [],
    metadata: { ...metadata, chunkIndex: idx }
  }))

  return await this.insertMany(docsToInsert)
}

/**
 * Query persistent vector index using cosine similarity
 */
documentEmbeddingSchema.statics.similaritySearch = async function ({
  sessionId = null,
  institutionId = null,
  docType = null,
  queryText = '',
  topK = 3
}) {
  const queryEmbeddings = await ragService.embedChunks([queryText])
  if (!queryEmbeddings || queryEmbeddings.length === 0) return []
  const queryVec = queryEmbeddings[0]

  const filter = {}
  if (sessionId) filter.sessionId = sessionId
  if (institutionId) filter.institutionId = institutionId
  if (docType) filter.docType = docType

  if (mongoose.connection.readyState !== 1) return []

  const candidates = await this.find(filter).maxTimeMS(2000).lean().catch(() => [])
  if (!candidates || candidates.length === 0) return []

  const scored = candidates.map(item => ({
    text: item.text,
    section: item.section,
    docType: item.docType,
    metadata: item.metadata,
    score: ragService.cosineSimilarity(queryVec, item.embedding)
  }))

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK)
}

module.exports = mongoose.model('DocumentEmbedding', documentEmbeddingSchema)
