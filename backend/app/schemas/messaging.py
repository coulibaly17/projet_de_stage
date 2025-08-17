from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserBase

class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

class MessageCreate(MessageBase):
    pass

class MessageUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2000)

class MessageInDBBase(MessageBase):
    id: int
    sender_id: int
    discussion_id: int
    sent_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Message(MessageInDBBase):
    pass

class MessageWithReadStatus(Message):
    is_read: bool = False

class DiscussionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    is_group: bool = False
    participant_ids: List[int] = Field(..., min_items=1)

class DiscussionCreate(DiscussionBase):
    initial_message: str = Field(..., min_length=1, max_length=2000)

class DiscussionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    is_group: Optional[bool] = None

class DiscussionInDBBase(DiscussionBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class Discussion(DiscussionInDBBase):
    pass

class DiscussionWithMessages(Discussion):
    messages: List[MessageWithReadStatus] = []

class DiscussionInList(DiscussionInDBBase):
    last_message: Optional[MessageWithReadStatus] = None
    unread_count: int = 0
    participants: List[UserBase] = []

class DiscussionWithParticipants(Discussion):
    participants: List[UserBase] = []

class PaginatedMessages(BaseModel):
    items: List[MessageWithReadStatus]
    total: int
    page: int
    size: int
    total_pages: int
