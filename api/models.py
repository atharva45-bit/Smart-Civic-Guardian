from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ReportCreate(BaseModel):
    title: str = Field(..., description="Short title of the civic issue")
    category: str = Field(..., description="Category: pothole, garbage, streetlight, waterlogging, traffic, illegal_dumping, other")
    description: Optional[str] = Field("", description="Detailed description of the issue")
    latitude: float = Field(..., description="Latitude coordinate of the issue")
    longitude: float = Field(..., description="Longitude coordinate of the issue")
    reporter_name: Optional[str] = Field("Anonymous User", description="Name of the person reporting")
    severity: Optional[str] = Field("medium", description="Severity level: low, medium, high, critical")

class ReportResponse(BaseModel):
    id: str
    title: str
    category: str
    description: Optional[str] = ""
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    status: str
    created_at: str
    ai_confidence: Optional[float] = 0.0
    ai_analysis: Optional[Dict[str, Any]] = None
    reporter_name: Optional[str] = "Anonymous User"
    severity: str

class StatusUpdate(BaseModel):
    status: str = Field(..., description="New status: pending, investigating, in_progress, resolved")

class HotspotResponse(BaseModel):
    id: str = Field(..., description="Unique ID for the hotspot zone")
    latitude: float = Field(..., description="Center latitude of the hotspot")
    longitude: float = Field(..., description="Center longitude of the hotspot")
    radius_meters: float = Field(..., description="Radius defining the hotspot area")
    issue_count: int = Field(..., description="Number of issues in this hotspot")
    category_breakdown: Dict[str, int] = Field(..., description="Count of issues by category")
    primary_issue: str = Field(..., description="The most frequent category in this hotspot")
    description: str = Field(..., description="AI description of the hotspot area strain")
    severity: str = Field(..., description="Overall severity of the hotspot (low, medium, high, critical)")
