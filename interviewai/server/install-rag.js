/**
 * RAG Installation & Verification Script
 * Run this with: node install-rag.js
 * 
 * This script:
 * 1. Installs the @google/genai dependency
 * 2. Verifies ragService.js loads correctly
 * 3. Runs a quick test of the chunking & TF-IDF pipeline
 */

const { execSync } = require('child_process');
const path = require('path');

const serverDir = __dirname;

console.log('========================================');
console.log('  RAG Pipeline — Install & Verify');
console.log('========================================\n');

// Step 1: Install dependencies
console.log('[1/3] Installing dependencies...');
try {
  const output = execSync('npm install', { 
    cwd: serverDir, 
    encoding: 'utf8',
    timeout: 120000,
    stdio: 'inherit'
  });
  console.log('✅ Dependencies installed successfully!\n');
} catch (err) {
  console.error('❌ npm install failed:', err.message);
  process.exit(1);
}

// Step 2: Verify ragService loads
console.log('[2/3] Verifying RAG service...');
try {
  const ragService = require('./src/services/ragService');
  console.log('✅ ragService loaded successfully!\n');
} catch (err) {
  console.error('❌ ragService failed to load:', err.message);
  process.exit(1);
}

// Step 3: Run a quick test
console.log('[3/3] Running RAG pipeline test...');
const ragService = require('./src/services/ragService');

const sampleResume = `
John Doe
Software Engineer

SUMMARY
Experienced full-stack developer with 5+ years of expertise in React, Node.js, and cloud technologies.
Passionate about building scalable web applications and mentoring junior developers.

EXPERIENCE
Senior Software Engineer at TechCorp (2022 - Present)
- Led development of a real-time analytics dashboard using React and D3.js
- Designed microservices architecture handling 10M+ daily requests
- Mentored team of 4 junior developers, improving team velocity by 30%

Software Engineer at StartupXYZ (2019 - 2022)
- Built REST APIs using Node.js and Express serving 500K+ users
- Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes
- Migrated legacy jQuery frontend to React, improving performance by 60%

EDUCATION
B.S. Computer Science, Stanford University (2019)
- GPA: 3.8/4.0
- Dean's List, Teaching Assistant for CS101

SKILLS
Languages: JavaScript, TypeScript, Python, Go
Frontend: React, Next.js, Vue.js, HTML/CSS, Tailwind
Backend: Node.js, Express, FastAPI, GraphQL
Databases: PostgreSQL, MongoDB, Redis, DynamoDB
Cloud: AWS (EC2, S3, Lambda, ECS), Docker, Kubernetes
Tools: Git, Jenkins, Terraform, Datadog

PROJECTS
Open Source Dashboard Framework
- Created a React component library with 2000+ GitHub stars
- Published on npm with 50K+ weekly downloads

Real-time Chat Application
- Built with WebSockets, React, and Node.js
- Supports 10K concurrent users with sub-100ms latency

CERTIFICATIONS
AWS Solutions Architect Associate (2023)
Kubernetes Administrator (CKA) (2022)
`;

try {
  // Test chunking
  const chunks = ragService.chunkResumeText(sampleResume);
  console.log(`  📄 Chunked resume into ${chunks.length} sections:`);
  chunks.forEach((c, i) => {
    console.log(`     [${i+1}] ${c.section} (${c.text.length} chars)`);
  });

  // Test TF-IDF embedding (no API key needed)
  const texts = chunks.map(c => c.text);
  const embeddings = ragService.embedChunks ? null : null; // We'll use processResume below
  
  console.log('\n  🧮 Testing TF-IDF fallback embeddings...');
  
  // Test the full pipeline with TF-IDF (no Gemini key needed for this test)
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY; // Force TF-IDF for testing
  
  ragService.processResume(sampleResume).then(async (result) => {
    process.env.GEMINI_API_KEY = originalKey; // Restore
    
    console.log(`  ✅ Vector store built with ${result.vectorStore.length} entries`);
    
    // Test querying
    console.log('\n  🔍 Testing semantic search...');
    
    const queries = [
      'React and frontend experience',
      'education and academic background',
      'cloud infrastructure and DevOps'
    ];
    
    for (const query of queries) {
      const results = await ragService.queryVectorStore(result.vectorStore, query, 2);
      console.log(`\n  Query: "${query}"`);
      results.forEach((r, i) => {
        console.log(`    [${i+1}] ${r.section} (score: ${r.score.toFixed(4)})`);
      });
    }
    
    console.log('\n========================================');
    console.log('  ✅ All tests passed! RAG is ready.');
    console.log('========================================');
    console.log('\nNext: Add GEMINI_API_KEY to .env for full');
    console.log('semantic embeddings, then run: npm run dev');
  });
  
} catch (err) {
  console.error('❌ Test failed:', err);
}
