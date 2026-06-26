import pytest
from app.agent import deterministic_screen, security_redaction, CargoEvent

def test_deterministic_screen_auto_approve():
    cargo = CargoEvent(
        id="CGO-1", priority="Low", delay_hours=10, 
        total_value=1000, corporate_buyer="Acme", lat=0, lon=0
    )
    event = deterministic_screen(cargo)
    assert event.actions.route == "auto_approved"
    assert event.output["status"] == "auto_approved"

def test_deterministic_screen_needs_review_high_priority():
    cargo = CargoEvent(
        id="CGO-2", priority="High", delay_hours=10, 
        total_value=1000, corporate_buyer="Acme", lat=0, lon=0
    )
    event = deterministic_screen(cargo)
    assert event.actions.route == "needs_review"
    assert event.output["priority"] == "High"

def test_deterministic_screen_needs_review_high_delay():
    cargo = CargoEvent(
        id="CGO-3", priority="Low", delay_hours=48, 
        total_value=1000, corporate_buyer="Acme", lat=0, lon=0
    )
    event = deterministic_screen(cargo)
    assert event.actions.route == "needs_review"

def test_security_redaction():
    input_data = {
        "id": "CGO-4",
        "priority": "High",
        "delay_hours": 48,
        "total_value": 5000000,
        "corporate_buyer": "Stark Industries",
        "lat": 0.0,
        "lon": 0.0
    }
    event = security_redaction(input_data)
    assert event.actions.route == "needs_review"
    assert event.output["total_value"] == "[REDACTED]"
    assert event.output["corporate_buyer"] == "[REDACTED]"
    assert event.output["id"] == "CGO-4" # other fields preserved
