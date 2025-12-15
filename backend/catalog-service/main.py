from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

class Field(BaseModel):
    name: str
    label: str
    type: str  # text, select, number
    options: Optional[List[str]] = None

class Template(BaseModel):
    id: str
    name: str
    description: str
    category: str
    severity_default: str
    fields: List[Field]

TEMPLATES = [
    Template(
        id="server_reboot",
        name="Server Reboot Request",
        description="Request a reboot for a specific server instance. Requires Ops approval.",
        category="Infrastructure",
        severity_default="HIGH",
        fields=[
            Field(name="hostname", label="Hostname", type="text"),
            Field(name="reason", label="Reason for Reboot", type="text"),
        ]
    ),
    Template(
        id="access_request",
        name="Access Request",
        description="Request temporary or permanent access to a system/repo.",
        category="IAM",
        severity_default="MEDIUM",
        fields=[
            Field(name="system_name", label="System Name", type="text"),
            Field(name="role", label="Role Required", type="select", options=["Read-Only", "Developer", "Admin"]),
            Field(name="duration", label="Duration (Hours)", type="number"),
        ]
    ),
    Template(
        id="ci_pipeline_failure",
        name="CI/CD Pipeline Incident",
        description="Report a stuck or failed critical pipeline.",
        category="DevOps",
        severity_default="CRITICAL",
        fields=[
            Field(name="pipeline_url", label="Pipeline URL", type="text"),
            Field(name="error_log", label="Error Log Snippet", type="text"),
        ]
    )
]

@app.get("/api/catalog/health")
def health():
    return {"status": "UP"}

@app.get("/api/catalog/templates", response_model=List[Template])
def get_templates():
    return TEMPLATES
