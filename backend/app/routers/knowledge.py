from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services.rag_service import rag_service, DEMO_KNOWLEDGE_DOCUMENTS

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Base & RAG"])

@router.get("")
async def get_knowledge_documents():
    """Retrieves all indexed Practice SOPs, Administrative Rules, and Internal Workflow Policies."""
    return rag_service.get_all_documents()

@router.get("/search")
async def search_knowledge(q: str = Query(..., min_length=2)):
    """Search knowledge base with semantic keyword scoring."""
    results = rag_service.search(query=q, top_k=4)
    return results
