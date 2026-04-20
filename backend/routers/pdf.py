from fastapi import APIRouter, HTTPException, status, UploadFile, File
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
import asyncio

from services.pdf_service import (
    process_pdf_from_url,
    ask_question_about_pdf,
    generate_pdf_summary,
    list_user_documents,
    PDFServiceError
)

router = APIRouter()

class PDFUploadRequest(BaseModel):
    url: HttpUrl

class PDFUploadResponse(BaseModel):
    doc_id: str
    url: str
    total_chunks: int
    word_count: int
    message: str

class PDFQuestionRequest(BaseModel):
    doc_id: str
    question: str

class PDFQuestionResponse(BaseModel):
    doc_id: str
    question: str
    answer: str
    relevant_chunks: List[Dict[str, Any]]
    chunks_used: int

class Flashcard(BaseModel):
    question: str
    answer: str

class PDFFlashcardsResponse(BaseModel):
    doc_id: str
    flashcards: List[Flashcard]
    total_cards: int

class PDFSummaryResponse(BaseModel):
    doc_id: str
    summary: str
    metadata: Dict[str, Any]
    total_chunks: int

class PDFDocument(BaseModel):
    doc_id: str
    url: str
    created_at: str
    metadata: Dict[str, Any]
    total_chunks: int

class PDFListResponse(BaseModel):
    documents: List[PDFDocument]
    total_count: int

@router.post("/upload", response_model=PDFUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_pdf(request: PDFUploadRequest):
    """
    Upload and process a PDF from URL
    
    - **url**: Valid HTTP/HTTPS URL pointing to a PDF file
    - Returns document ID and processing metadata
    """
    try:
        result = await process_pdf_from_url(str(request.url))
        return PDFUploadResponse(
            doc_id=result["doc_id"],
            url=result["url"],
            total_chunks=result["total_chunks"],
            word_count=result["word_count"],
            message=result["message"]
        )
    except PDFServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/ask", response_model=PDFQuestionResponse)
async def ask_pdf_question(request: PDFQuestionRequest):
    """
    Ask a question about a processed PDF document
    
    - **doc_id**: ID of the processed PDF document
    - **question**: Question to ask about the document
    - Returns AI answer based on relevant document chunks
    """
    try:
        result = await ask_question_about_pdf(request.doc_id, request.question)
        return PDFQuestionResponse(
            doc_id=result["doc_id"],
            question=result["question"],
            answer=result["answer"],
            relevant_chunks=result["relevant_chunks"],
            chunks_used=result["chunks_used"]
        )
    except PDFServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/flashcards", response_model=PDFFlashcardsResponse)
async def get_pdf_flashcards(request: PDFQuestionRequest):
    """
    Generate flashcards from a processed PDF document
    
    - **doc_id**: ID of the processed PDF document
    - **question**: Flashcard generation prompt
    - Returns structured flashcards array
    """
    try:
        result = await ask_question_about_pdf(request.doc_id, request.question)
        
        # Try to parse the answer as JSON flashcards
        flashcards = []
        try:
            import json
            parsed_flashcards = json.loads(result["answer"])
            if isinstance(parsed_flashcards, list):
                flashcards = [
                    Flashcard(question=card.get("question", ""), answer=card.get("answer", ""))
                    for card in parsed_flashcards
                ]
            elif isinstance(parsed_flashcards, dict):
                flashcards = [Flashcard(question=parsed_flashcards.get("question", ""), answer=parsed_flashcards.get("answer", ""))]
        except (json.JSONDecodeError, KeyError):
            # If parsing fails, create a single flashcard with the answer
            flashcards = [Flashcard(question=request.question, answer=result["answer"])]
        
        return PDFFlashcardsResponse(
            doc_id=result["doc_id"],
            flashcards=flashcards,
            total_cards=len(flashcards)
        )
    except PDFServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/upload-file", response_model=PDFUploadResponse)
async def upload_pdf_file(file: UploadFile = File(..., description="PDF file to upload")):
    """
    Upload and process a PDF file directly
    
    - **file**: PDF file to upload
    - Returns document ID and processing metadata
    """
    try:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please upload a valid PDF file"
            )
        
        # Read file content
        pdf_content = await file.read()
        
        # Check file size (10MB limit)
        if len(pdf_content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF file too large (max 10MB)"
            )
        
        # Process PDF content
        from services.pdf_service import extract_text_from_pdf, save_pdf_document
        text = extract_text_from_pdf(pdf_content)
        
        # Save document
        doc_id = save_pdf_document(
            filename=file.filename,
            content=pdf_content,
            text=text
        )
        
        return PDFUploadResponse(
            doc_id=doc_id,
            url=f"file://{file.filename}",
            total_chunks=len(text.split()) if text else 0,
            word_count=len(text.split()) if text else 0,
            message="PDF file uploaded and processed successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process PDF file: {str(e)}"
        )

@router.get("/{doc_id}/summary", response_model=PDFSummaryResponse)
async def get_pdf_summary(doc_id: str):
    """
    Generate a summary of a processed PDF document
    
    - **doc_id**: ID of the processed PDF document
    - Returns AI-generated summary and document metadata
    """
    try:
        result = await generate_pdf_summary(doc_id)
        return PDFSummaryResponse(
            doc_id=result["doc_id"],
            summary=result["summary"],
            metadata=result["metadata"],
            total_chunks=result["total_chunks"]
        )
    except PDFServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "not found" in str(e).lower() else status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/", response_model=PDFListResponse)
async def list_pdfs():
    """
    List all PDF documents for the current user
    
    - Returns list of documents with metadata
    """
    try:
        documents = list_user_documents()
        pdf_documents = [
            PDFDocument(
                doc_id=doc["doc_id"],
                url=doc["url"],
                created_at=doc["created_at"],
                metadata=doc["metadata"],
                total_chunks=doc["total_chunks"]
            )
            for doc in documents
        ]
        return PDFListResponse(
            documents=pdf_documents,
            total_count=len(pdf_documents)
        )
    except PDFServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/{doc_id}")
async def get_pdf_document(doc_id: str):
    """
    Get details of a specific PDF document
    
    - **doc_id**: ID of the processed PDF document
    - Returns document metadata and chunk information
    """
    try:
        from services.pdf_service import load_pdf_document, _get_active_user_key
        
        user_id = _get_active_user_key()
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated"
            )
        
        document = load_pdf_document(user_id, doc_id)
        
        return {
            "doc_id": document["doc_id"],
            "url": document["url"],
            "created_at": document["created_at"],
            "metadata": document["metadata"],
            "total_chunks": len(document["chunks"]),
            "chunk_ids": [chunk["id"] for chunk in document["chunks"]]
        }
    except PDFServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "not found" in str(e).lower() else status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
