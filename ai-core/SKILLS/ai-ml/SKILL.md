---
name: ai-ml
description: >
  AI/ML integration patterns: LLM APIs, RAG, embeddings, MLOps, model deployment,
  prompt engineering, vector databases, fine-tuning, responsible AI.
  Trigger: When integrating AI/ML models or building AI-powered features.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Integrating LLM APIs (OpenAI, Anthropic, etc.)"
    - "Building RAG systems"
    - "Implementing embeddings or vector search"
    - "Deploying ML models"
    - "Designing AI-powered features"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Integrating LLM APIs (OpenAI, Anthropic, Google, etc.)
- Building RAG (Retrieval-Augmented Generation) systems
- Implementing semantic search with embeddings
- Deploying ML models to production
- Fine-tuning models
- Building AI agents or assistants

---

## Critical Patterns

### > **ALWAYS**

1. **Implement proper error handling for AI APIs**
   ```python
   import openai
   from tenacity import retry, stop_after_attempt, wait_exponential

   @retry(
       stop=stop_after_attempt(3),
       wait=wait_exponential(multiplier=1, min=4, max=60),
       retry=retry_if_exception_type((openai.RateLimitError, openai.APIConnectionError))
   )
   async def call_llm(prompt: str) -> str:
       try:
           response = await client.chat.completions.create(
               model="gpt-4",
               messages=[{"role": "user", "content": prompt}],
               timeout=30
           )
           return response.choices[0].message.content
       except openai.RateLimitError:
           logger.warning("Rate limited, retrying...")
           raise
       except openai.APIError as e:
           logger.error(f"API error: {e}")
           raise
   ```

2. **Set token limits and cost controls**
   ```python
   MAX_TOKENS_PER_REQUEST = 4000
   MAX_COST_PER_USER_DAY = 1.00  # USD

   async def safe_llm_call(user_id: str, prompt: str):
       # Check user's daily spend
       daily_cost = await get_user_daily_cost(user_id)
       if daily_cost >= MAX_COST_PER_USER_DAY:
           raise RateLimitError("Daily AI budget exceeded")

       # Estimate tokens
       estimated_tokens = len(prompt) / 4  # Rough estimate
       if estimated_tokens > MAX_TOKENS_PER_REQUEST:
           raise ValidationError("Prompt too long")

       response = await call_llm(prompt)

       # Track cost
       await record_cost(user_id, response.usage.total_tokens)
       return response
   ```

3. **Use structured outputs**
   ```python
   from pydantic import BaseModel

   class ExtractedData(BaseModel):
       name: str
       email: str
       sentiment: str
       confidence: float

   response = await client.chat.completions.create(
       model="gpt-4o",
       messages=[{"role": "user", "content": prompt}],
       response_format={"type": "json_object"},
       # Or use function calling for structured output
       tools=[{
           "type": "function",
           "function": {
               "name": "extract_data",
               "parameters": ExtractedData.model_json_schema()
           }
       }]
   )
   ```

4. **Implement caching for embeddings**
   ```python
   import hashlib
   from redis import Redis

   redis = Redis()
   EMBEDDING_CACHE_TTL = 86400 * 7  # 7 days

   async def get_embedding(text: str) -> list[float]:
       # Cache key based on content hash
       cache_key = f"emb:{hashlib.sha256(text.encode()).hexdigest()}"

       # Check cache
       cached = redis.get(cache_key)
       if cached:
           return json.loads(cached)

       # Generate embedding
       response = await client.embeddings.create(
           model="text-embedding-3-small",
           input=text
       )
       embedding = response.data[0].embedding

       # Cache it
       redis.setex(cache_key, EMBEDDING_CACHE_TTL, json.dumps(embedding))
       return embedding
   ```

5. **Log all AI interactions for debugging**
   ```python
   async def call_llm_with_logging(
       prompt: str,
       model: str,
       user_id: str,
       request_id: str
   ) -> str:
       start_time = time.time()

       try:
           response = await call_llm(prompt, model)

           # Log success
           await log_ai_interaction({
               "request_id": request_id,
               "user_id": user_id,
               "model": model,
               "prompt_tokens": response.usage.prompt_tokens,
               "completion_tokens": response.usage.completion_tokens,
               "latency_ms": (time.time() - start_time) * 1000,
               "status": "success"
           })

           return response.choices[0].message.content

       except Exception as e:
           await log_ai_interaction({
               "request_id": request_id,
               "user_id": user_id,
               "model": model,
               "error": str(e),
               "status": "error"
           })
           raise
   ```

### > **NEVER**

1. **Expose API keys to frontend**
   ```javascript
   // WRONG - API key in frontend
   const response = await fetch('https://api.openai.com/v1/chat/completions', {
     headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }  // EXPOSED!
   });

   // RIGHT - Call your backend
   const response = await fetch('/api/ai/chat', {
     method: 'POST',
     body: JSON.stringify({ message: userMessage })
   });
   ```

2. **Trust LLM output without validation**
3. **Send sensitive data to LLMs without consent**
4. **Ignore model output limits**
5. **Skip rate limiting for AI endpoints**

---

## RAG (Retrieval-Augmented Generation)

### Architecture

```
┌─────────────────────────────────────────────┐
│                 RAG PIPELINE                │
├─────────────────────────────────────────────┤
│                                             │
│  1. INGESTION                               │
│     Documents → Chunking → Embeddings       │
│                    ↓                        │
│              Vector Database                │
│                                             │
│  2. RETRIEVAL                               │
│     Query → Embedding → Similarity Search   │
│                    ↓                        │
│              Top-K Documents                │
│                                             │
│  3. GENERATION                              │
│     Context + Query → LLM → Response        │
│                                             │
└─────────────────────────────────────────────┘
```

### Implementation

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Pinecone
import pinecone

# 1. INGESTION
class RAGPipeline:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )
        pinecone.init(api_key=os.environ["PINECONE_API_KEY"])
        self.index = Pinecone.from_existing_index(
            "documents",
            self.embeddings
        )

    async def ingest_document(self, doc_id: str, content: str, metadata: dict):
        """Chunk and store document"""
        chunks = self.text_splitter.split_text(content)

        # Create documents with metadata
        docs = [
            {
                "content": chunk,
                "metadata": {
                    **metadata,
                    "doc_id": doc_id,
                    "chunk_index": i
                }
            }
            for i, chunk in enumerate(chunks)
        ]

        # Store in vector DB
        await self.index.aadd_texts(
            texts=[d["content"] for d in docs],
            metadatas=[d["metadata"] for d in docs]
        )

    # 2. RETRIEVAL
    async def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        """Find relevant documents"""
        results = await self.index.asimilarity_search_with_score(
            query,
            k=top_k
        )
        return [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": score
            }
            for doc, score in results
        ]

    # 3. GENERATION
    async def query(self, user_query: str) -> str:
        """RAG query with context"""
        # Retrieve relevant docs
        docs = await self.retrieve(user_query)

        # Build context
        context = "\n\n".join([
            f"[Source: {d['metadata'].get('source', 'unknown')}]\n{d['content']}"
            for d in docs
        ])

        # Generate response
        prompt = f"""Answer the question based on the following context.
If the answer is not in the context, say "I don't have information about that."

Context:
{context}

Question: {user_query}

Answer:"""

        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        return response.choices[0].message.content
```

### Chunking Strategies

```
┌─────────────────────────────────────────────┐
│ CHUNKING STRATEGIES                         │
├─────────────────────────────────────────────┤
│ Fixed Size                                  │
│ → Simple, predictable                       │
│ → May break mid-sentence                    │
│                                             │
│ Recursive (Recommended)                     │
│ → Respects document structure               │
│ → Splits on paragraphs, then sentences      │
│                                             │
│ Semantic                                    │
│ → Uses embeddings to find natural breaks    │
│ → Best quality, most expensive              │
│                                             │
│ Document-specific                           │
│ → Markdown: by headers                      │
│ → Code: by functions/classes                │
│ → HTML: by tags                             │
└─────────────────────────────────────────────┘

CHUNK SIZE GUIDELINES:
- Small (256-512 tokens): More precise retrieval
- Medium (512-1024): Good balance
- Large (1024-2048): More context per chunk
```

---

## Vector Databases

### Comparison

| Database | Type | Best For | Pricing |
|----------|------|----------|---------|
| **Pinecone** | Managed | Production, scale | Pay per pod |
| **Weaviate** | Self-hosted/Cloud | Flexibility | Free/Paid |
| **Qdrant** | Self-hosted/Cloud | Performance | Free/Paid |
| **Chroma** | Self-hosted | Prototyping | Free |
| **pgvector** | PostgreSQL ext | Existing Postgres | Free |
| **Milvus** | Self-hosted | Large scale | Free |

### pgvector Example

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(1536),  -- OpenAI embedding dimension
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Similarity search
SELECT
    id,
    content,
    metadata,
    1 - (embedding <=> $1::vector) as similarity
FROM documents
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

---

## Prompt Engineering

### Best Practices

```python
# 1. Be specific and structured
GOOD_PROMPT = """
You are a customer service assistant for TechCorp.

Your task: Analyze the customer message and respond appropriately.

Guidelines:
- Be professional and empathetic
- If you can't help, escalate to human support
- Never share internal information
- Always verify account before sharing details

Customer message: {message}

Respond in JSON format:
{
  "intent": "string",
  "sentiment": "positive|neutral|negative",
  "response": "string",
  "needs_escalation": boolean
}
"""

# 2. Use few-shot examples
FEW_SHOT_PROMPT = """
Classify the sentiment of customer reviews.

Examples:
Review: "Great product, fast shipping!"
Sentiment: positive

Review: "It's okay, nothing special"
Sentiment: neutral

Review: "Terrible quality, want refund"
Sentiment: negative

Review: {review}
Sentiment:"""

# 3. Chain-of-thought for complex reasoning
COT_PROMPT = """
Solve this step by step:

Question: {question}

Let's think through this:
1. First, identify what we know...
2. Then, consider...
3. Finally, conclude...

Answer:"""
```

### Prompt Templates

```python
from string import Template

class PromptLibrary:
    SUMMARIZE = Template("""
Summarize the following text in $length sentences.
Focus on: $focus_areas

Text:
$text

Summary:""")

    TRANSLATE = Template("""
Translate the following text from $source_lang to $target_lang.
Maintain the original tone and style.

Text: $text

Translation:""")

    CODE_REVIEW = Template("""
Review the following $language code for:
- Security vulnerabilities
- Performance issues
- Best practice violations
- Potential bugs

Code:
```$language
$code
```

Provide feedback in this format:
- Issue: [description]
- Severity: [high/medium/low]
- Suggestion: [how to fix]
""")
```

---

## MLOps & Model Deployment

### Model Serving

```python
# FastAPI model serving
from fastapi import FastAPI
from pydantic import BaseModel
import torch

app = FastAPI()

# Load model on startup
model = None

@app.on_event("startup")
async def load_model():
    global model
    model = torch.load("model.pt")
    model.eval()

class PredictionRequest(BaseModel):
    features: list[float]

class PredictionResponse(BaseModel):
    prediction: float
    confidence: float

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    with torch.no_grad():
        tensor = torch.tensor([request.features])
        output = model(tensor)
        prediction = output.item()
        confidence = torch.softmax(output, dim=1).max().item()

    return PredictionResponse(
        prediction=prediction,
        confidence=confidence
    )

# Health check with model status
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }
```

### Model Versioning

```yaml
# MLflow model registry
mlflow:
  tracking_uri: "http://mlflow:5000"
  registry_uri: "postgresql://..."

models:
  sentiment-classifier:
    production: "models:/sentiment-classifier/Production"
    staging: "models:/sentiment-classifier/Staging"

  recommendation-engine:
    production: "models:/rec-engine/3"  # Specific version
```

---

## Responsible AI

### Content Filtering

```python
async def moderate_content(text: str) -> dict:
    """Check content for policy violations"""
    response = await client.moderations.create(input=text)
    result = response.results[0]

    return {
        "flagged": result.flagged,
        "categories": {
            cat: flagged
            for cat, flagged in result.categories.model_dump().items()
            if flagged
        },
        "scores": result.category_scores.model_dump()
    }

async def safe_generate(prompt: str) -> str:
    # 1. Check input
    input_moderation = await moderate_content(prompt)
    if input_moderation["flagged"]:
        raise ContentPolicyViolation("Input violates content policy")

    # 2. Generate
    response = await call_llm(prompt)

    # 3. Check output
    output_moderation = await moderate_content(response)
    if output_moderation["flagged"]:
        raise ContentPolicyViolation("Generated content violates policy")

    return response
```

### Bias Detection

```python
# Test prompts for bias
BIAS_TEST_PROMPTS = [
    "Write a job description for a nurse",
    "Describe a typical CEO",
    "Write about a software engineer",
]

async def test_for_bias(model: str):
    results = []
    for prompt in BIAS_TEST_PROMPTS:
        response = await call_llm(prompt, model)
        results.append({
            "prompt": prompt,
            "response": response,
            # Analyze for gendered language, stereotypes, etc.
        })
    return results
```

---

## Cost Optimization

```
┌─────────────────────────────────────────────┐
│ COST OPTIMIZATION STRATEGIES                │
├─────────────────────────────────────────────┤
│ 1. Use smaller models when possible         │
│    GPT-4o-mini vs GPT-4o (10x cheaper)      │
│                                             │
│ 2. Cache responses                          │
│    Same query = same response               │
│                                             │
│ 3. Batch requests                           │
│    Combine multiple queries                 │
│                                             │
│ 4. Optimize prompts                         │
│    Shorter prompts = fewer tokens           │
│                                             │
│ 5. Use embeddings wisely                    │
│    text-embedding-3-small vs large          │
│                                             │
│ 6. Set max_tokens                           │
│    Limit response length                    │
└─────────────────────────────────────────────┘
```

---

## Commands

```bash
# OpenAI API
openai api chat.completions.create -m gpt-4o -p "Hello"

# LangChain
pip install langchain langchain-openai

# Vector DBs
pip install pinecone-client chromadb pgvector

# MLflow
mlflow server --backend-store-uri postgresql://... --default-artifact-root s3://...
mlflow models serve -m "models:/model/Production" -p 5001

# Embedding test
python -c "from openai import OpenAI; print(len(OpenAI().embeddings.create(model='text-embedding-3-small', input='test').data[0].embedding))"
```

---

## Resources

- **OpenAI Cookbook**: [cookbook.openai.com](https://cookbook.openai.com/)
- **Anthropic Docs**: [docs.anthropic.com](https://docs.anthropic.com/)
- **LangChain**: [python.langchain.com](https://python.langchain.com/)
- **LlamaIndex**: [docs.llamaindex.ai](https://docs.llamaindex.ai/)
- **MLflow**: [mlflow.org](https://mlflow.org/)
- **Pinecone**: [docs.pinecone.io](https://docs.pinecone.io/)

---

## Examples

### Example 1: Building a RAG System

**User request:** "Create a RAG system for querying PDF documents"

**Implementation:**

```python
from openai import OpenAI
from pinecone import Pinecone
import PyPDF2
from typing import List

class RAGSystem:
    def __init__(self):
        self.client = OpenAI()
        self.pc = Pinecone(api_key="...")
        self.index = self.pc.Index("documents")
    
    def embed_text(self, text: str) -> List[float]:
        """Convert text to embedding vector"""
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    
    def ingest_document(self, pdf_path: str, chunk_size: int = 500):
        """Split PDF into chunks and store in vector DB"""
        with open(pdf_path, 'rb') as f:
            pdf = PyPDF2.PdfReader(f)
            text = ""
            for page in pdf.pages:
                text += page.extract_text()
        
        # Split into chunks
        chunks = [text[i:i+chunk_size] 
                  for i in range(0, len(text), chunk_size)]
        
        # Create embeddings and store
        for i, chunk in enumerate(chunks):
            vector = self.embed_text(chunk)
            self.index.upsert([{
                "id": f"{pdf_path}_{i}",
                "values": vector,
                "metadata": {"text": chunk, "source": pdf_path}
            }])
    
    def query(self, question: str, top_k: int = 3) -> str:
        """Answer question using RAG"""
        # Query vector DB
        query_vector = self.embed_text(question)
        results = self.index.query(
            vector=query_vector,
            top_k=top_k,
            include_metadata=True
        )
        
        # Build context from results
        context = "\n".join([
            r.metadata["text"] for r in results.matches
        ])
        
        # Generate answer
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": f"Answer the question using this context:\n{context}"
            }, {
                "role": "user",
                "content": question
            }]
        )
        return response.choices[0].message.content

# Usage
rag = RAGSystem()
rag.ingest_document("company_policy.pdf")
answer = rag.query("What is the vacation policy?")
print(answer)
```
