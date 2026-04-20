import os
import json
import re
import uuid
import requests
import pdfplumber
import time
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse
from services.db import _get_active_user_key, DATA_DIR
from services.ai_service import call_groq_mentor

PDF_DATA_DIR = os.path.join(DATA_DIR, "pdfs")

class PDFServiceError(Exception):
    """Custom exception for PDF service errors"""
    pass

def validate_url(url: str) -> bool:
    """Validate if URL is properly formatted and accessible"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc]) and result.scheme in ['http', 'https']
    except:
        return False

def fetch_pdf_from_url(url: str, timeout: int = 60) -> bytes:
    """
    Fetch PDF from URL with browser headers, retry logic, and better timeout
    
    Args:
        url: PDF URL to fetch
        timeout: Request timeout in seconds
        
    Returns:
        PDF content as bytes
        
    Raises:
        PDFServiceError: If URL invalid, request fails, or content is not PDF
    """
    if not validate_url(url):
        raise PDFServiceError("Invalid URL format")
    
    # Browser headers to avoid bot detection
    browser_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/pdf,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0"
    }
    
    # Add referer based on URL domain for common sites
    parsed_url = urlparse(url)
    if 'nseindia.com' in parsed_url.netloc:
        browser_headers["Referer"] = "https://www.nseindia.com/"
    
    # Retry logic with exponential backoff
    max_retries = 3
    base_delay = 2
    
    for attempt in range(max_retries):
        try:
            response = requests.get(
                url, 
                timeout=timeout, 
                stream=True, 
                headers=browser_headers
            )
            response.raise_for_status()
            
            # Check content type
            content_type = response.headers.get('content-type', '').lower()
            if 'pdf' not in content_type and not url.lower().endswith('.pdf'):
                raise PDFServiceError("URL does not point to a PDF file")
            
            # Check size limit (10MB)
            content_length = response.headers.get('content-length')
            if content_length and int(content_length) > 10 * 1024 * 1024:
                raise PDFServiceError("PDF file too large (max 10MB)")
            
            # Download content
            pdf_content = b''
            for chunk in response.iter_content(chunk_size=8192):
                pdf_content += chunk
                if len(pdf_content) > 10 * 1024 * 1024:
                    raise PDFServiceError("PDF file too large (max 10MB)")
            
            if not pdf_content:
                raise PDFServiceError("Empty PDF content")
            
            return pdf_content
            
        except requests.exceptions.Timeout as e:
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                time.sleep(delay)
                continue
            else:
                raise PDFServiceError(f"Could not fetch PDF from this URL. The site may be blocking automated access. Try downloading the PDF manually and uploading it directly.")
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                time.sleep(delay)
                continue
            else:
                error_msg = str(e)
                if "timeout" in error_msg.lower() or "connection" in error_msg.lower():
                    raise PDFServiceError(f"Could not fetch PDF from this URL. The site may be blocking automated access. Try downloading the PDF manually and uploading it directly.")
                else:
                    raise PDFServiceError(f"Failed to fetch PDF: {str(e)}")

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    Extract text from PDF content using pdfplumber
    
    Args:
        pdf_content: PDF content as bytes
        
    Returns:
        Extracted text as string
        
    Raises:
        PDFServiceError: If PDF parsing fails or no text extracted
    """
    try:
        import io
        with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
            text_parts = []
            
            for page_num, page in enumerate(pdf.pages):
                try:
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        text_parts.append(page_text.strip())
                except Exception as e:
                    # Skip problematic pages but continue with others
                    print(f"Warning: Could not extract text from page {page_num + 1}: {str(e)}")
                    continue
            
            if not text_parts:
                raise PDFServiceError("No text could be extracted from PDF")
            
            return "\n".join(text_parts)
            
    except Exception as e:
        if isinstance(e, PDFServiceError):
            raise
        raise PDFServiceError(f"Failed to parse PDF: {str(e)}")

def clean_text(text: str) -> str:
    """
    Clean extracted text by removing extra whitespace and normalizing
    
    Args:
        text: Raw extracted text
        
    Returns:
        Cleaned text
    """
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove empty lines
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Join with single spaces
    cleaned = ' '.join(lines)
    
    return cleaned.strip()

def chunk_text(text: str, chunk_size: int = 700, overlap: int = 100) -> List[Dict[str, str]]:
    """
    Split text into chunks with optional overlap
    
    Args:
        text: Text to chunk
        chunk_size: Target chunk size in words
        overlap: Number of overlapping words between chunks
        
    Returns:
        List of chunks with IDs
    """
    words = text.split()
    chunks = []
    
    if not words:
        return chunks
    
    start_idx = 0
    chunk_num = 1
    
    while start_idx < len(words):
        end_idx = min(start_idx + chunk_size, len(words))
        chunk_words = words[start_idx:end_idx]
        
        if chunk_words:
            chunk_text = ' '.join(chunk_words)
            chunks.append({
                "id": f"chunk_{chunk_num}",
                "text": chunk_text
            })
            chunk_num += 1
        
        # Move start index with overlap
        start_idx = end_idx - overlap if end_idx < len(words) else len(words)
    
    return chunks

def generate_doc_id() -> str:
    """Generate unique document ID"""
    return str(uuid.uuid4())[:8]

def save_pdf_document(user_id: str, doc_id: str, url: str, chunks: List[Dict[str, str]], metadata: Dict = None) -> str:
    """
    Save processed PDF document to JSON file
    
    Args:
        user_id: User identifier
        doc_id: Document ID
        url: Original PDF URL
        chunks: List of text chunks
        metadata: Optional metadata (pages, word count, etc.)
        
    Returns:
        File path where document was saved
    """
    user_pdf_dir = os.path.join(PDF_DATA_DIR, user_id)
    os.makedirs(user_pdf_dir, exist_ok=True)
    
    document_data = {
        "doc_id": doc_id,
        "url": url,
        "created_at": str(os.path.getmtime(__file__) if os.path.exists(__file__) else "unknown"),
        "metadata": metadata or {},
        "chunks": chunks
    }
    
    file_path = os.path.join(user_pdf_dir, f"{doc_id}.json")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(document_data, f, indent=2, ensure_ascii=False)
    
    return file_path

def load_pdf_document(user_id: str, doc_id: str) -> Dict:
    """
    Load PDF document from JSON file
    
    Args:
        user_id: User identifier
        doc_id: Document ID
        
    Returns:
        Document data dictionary
        
    Raises:
        PDFServiceError: If file not found or invalid
    """
    file_path = os.path.join(PDF_DATA_DIR, user_id, f"{doc_id}.json")
    
    if not os.path.exists(file_path):
        raise PDFServiceError(f"Document {doc_id} not found")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise PDFServiceError(f"Failed to load document: {str(e)}")

def retrieve_relevant_chunks(question: str, chunks: List[Dict[str, str]], top_k: int = 5) -> List[Dict[str, str]]:
    """
    Retrieve relevant chunks based on keyword matching
    
    Args:
        question: User's question
        chunks: List of document chunks
        top_k: Number of top chunks to return
        
    Returns:
        List of relevant chunks with scores
    """
    # Extract keywords from question (simple approach)
    question_words = set(re.findall(r'\b\w+\b', question.lower()))
    question_words = {word for word in question_words if len(word) > 2}  # Remove short words
    
    scored_chunks = []
    
    for chunk in chunks:
        chunk_text = chunk['text'].lower()
        chunk_words = set(re.findall(r'\b\w+\b', chunk_text))
        
        # Count keyword matches
        matches = len(question_words.intersection(chunk_words))
        
        # Calculate score (matches + bonus for exact phrase matches)
        score = matches
        if question.lower() in chunk_text:
            score += 5  # Bonus for exact question match
        
        if score > 0:
            scored_chunks.append({
                **chunk,
                "relevance_score": score
            })
    
    # Sort by score and return top_k
    scored_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)
    
    return scored_chunks[:top_k]

async def query_pdf_with_llm(question: str, relevant_chunks: List[Dict[str, str]]) -> Tuple[str, Optional[str]]:
    """
    Query LLM with relevant chunks to answer question
    
    Args:
        question: User's question
        relevant_chunks: List of relevant text chunks
        
    Returns:
        Tuple of (answer, error_message)
    """
    if not relevant_chunks:
        return "I couldn't find relevant information in the document to answer your question.", None
    
    # Prepare context from chunks
    context_parts = []
    for i, chunk in enumerate(relevant_chunks, 1):
        context_parts.append(f"Excerpt {i}:\n{chunk['text']}")
    
    context = "\n\n".join(context_parts)
    
    system_prompt = """You are a financial analyst helping a beginner investor.
Answer ONLY using the provided context.
If answer is not in context, say: 'I couldn't find this in the report.'
Be concise and helpful."""

    user_prompt = f"""Context:
{context}

Question: {question}

Please provide a clear answer based only on the context above."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    try:
        answer, error = await call_groq_mentor(messages, max_tokens=800)
        if error:
            return None, error
        return answer, None
    except Exception as e:
        return None, f"Failed to get AI response: {str(e)}"

async def process_pdf_from_url(url: str) -> Dict[str, any]:
    """
    Complete pipeline to process PDF from URL
    
    Args:
        url: PDF URL to process
        
    Returns:
        Dictionary with doc_id and processing results
        
    Raises:
        PDFServiceError: If any step fails
    """
    try:
        # Get current user
        user_id = _get_active_user_key()
        if not user_id:
            raise PDFServiceError("User not authenticated")
        
        # Fetch PDF
        pdf_content = fetch_pdf_from_url(url)
        
        # Extract text
        raw_text = extract_text_from_pdf(pdf_content)
        
        # Clean text
        cleaned_text = clean_text(raw_text)
        
        if not cleaned_text:
            raise PDFServiceError("No valid text extracted from PDF")
        
        # Chunk text
        chunks = chunk_text(cleaned_text)
        
        if not chunks:
            raise PDFServiceError("Failed to create text chunks")
        
        # Generate document ID
        doc_id = generate_doc_id()
        
        # Prepare metadata
        metadata = {
            "total_chunks": len(chunks),
            "word_count": len(cleaned_text.split()),
            "character_count": len(cleaned_text)
        }
        
        # Save document
        save_path = save_pdf_document(user_id, doc_id, url, chunks, metadata)
        
        return {
            "doc_id": doc_id,
            "url": url,
            "total_chunks": len(chunks),
            "word_count": metadata["word_count"],
            "message": "PDF processed successfully",
            "saved_path": save_path
        }
        
    except PDFServiceError:
        raise
    except Exception as e:
        raise PDFServiceError(f"PDF processing failed: {str(e)}")

async def ask_question_about_pdf(doc_id: str, question: str) -> Dict[str, any]:
    """
    Answer a question about a processed PDF document
    
    Args:
        doc_id: Document ID
        question: User's question
        
    Returns:
        Dictionary with answer and relevant chunks
        
    Raises:
        PDFServiceError: If document not found or query fails
    """
    try:
        # Get current user
        user_id = _get_active_user_key()
        if not user_id:
            raise PDFServiceError("User not authenticated")
        
        # Load document
        document = load_pdf_document(user_id, doc_id)
        chunks = document.get('chunks', [])
        
        if not chunks:
            raise PDFServiceError("No chunks found in document")
        
        # Retrieve relevant chunks
        relevant_chunks = retrieve_relevant_chunks(question, chunks)
        
        # Query LLM
        answer, error = await query_pdf_with_llm(question, relevant_chunks)
        
        if error:
            raise PDFServiceError(f"AI query failed: {error}")
        
        return {
            "doc_id": doc_id,
            "question": question,
            "answer": answer,
            "relevant_chunks": relevant_chunks,
            "chunks_used": len(relevant_chunks)
        }
        
    except PDFServiceError:
        raise
    except Exception as e:
        raise PDFServiceError(f"Query failed: {str(e)}")

async def generate_pdf_summary(doc_id: str) -> Dict[str, any]:
    """
    Generate a summary of the PDF document
    
    Args:
        doc_id: Document ID
        
    Returns:
        Dictionary with summary
        
    Raises:
        PDFServiceError: If document not found or summary fails
    """
    try:
        # Get current user
        user_id = _get_active_user_key()
        if not user_id:
            raise PDFServiceError("User not authenticated")
        
        # Load document
        document = load_pdf_document(user_id, doc_id)
        chunks = document.get('chunks', [])
        
        if not chunks:
            raise PDFServiceError("No chunks found in document")
        
        # Use first few chunks for summary (or up to 2000 words)
        summary_chunks = chunks[:3]  # Take first 3 chunks
        summary_text = "\n".join([chunk['text'] for chunk in summary_chunks])
        
        # Limit summary text length
        words = summary_text.split()
        if len(words) > 2000:
            summary_text = ' '.join(words[:2000])
        
        system_prompt = """You are a financial analyst creating a concise summary.
Provide a clear, structured summary of the document in 150-200 words.
Focus on key points, findings, and actionable insights."""

        user_prompt = f"""Please summarize this document:

{summary_text}

Provide a concise summary highlighting the main points."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        summary, error = await call_groq_mentor(messages, max_tokens=600)
        
        if error:
            raise PDFServiceError(f"Summary generation failed: {error}")
        
        return {
            "doc_id": doc_id,
            "summary": summary,
            "metadata": document.get('metadata', {}),
            "total_chunks": len(chunks)
        }
        
    except PDFServiceError:
        raise
    except Exception as e:
        raise PDFServiceError(f"Summary generation failed: {str(e)}")

def list_user_documents() -> List[Dict[str, any]]:
    """
    List all PDF documents for the current user
    
    Returns:
        List of document metadata
        
    Raises:
        PDFServiceError: If user not authenticated
    """
    try:
        user_id = _get_active_user_key()
        if not user_id:
            raise PDFServiceError("User not authenticated")
        
        user_pdf_dir = os.path.join(PDF_DATA_DIR, user_id)
        
        if not os.path.exists(user_pdf_dir):
            return []
        
        documents = []
        
        for filename in os.listdir(user_pdf_dir):
            if filename.endswith('.json'):
                doc_id = filename[:-5]  # Remove .json extension
                try:
                    document = load_pdf_document(user_id, doc_id)
                    documents.append({
                        "doc_id": doc_id,
                        "url": document.get("url", ""),
                        "created_at": document.get("created_at", ""),
                        "metadata": document.get("metadata", {}),
                        "total_chunks": len(document.get("chunks", []))
                    })
                except Exception as e:
                    print(f"Warning: Could not load document {filename}: {str(e)}")
                    continue
        
        return documents
        
    except PDFServiceError:
        raise
    except Exception as e:
        raise PDFServiceError(f"Failed to list documents: {str(e)}")
