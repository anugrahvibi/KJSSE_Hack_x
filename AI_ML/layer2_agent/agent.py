"""Compatibility bridge for AI_ML layer2 agent client.

This module re-exports the existing shared LLM client from the current
project AI stack so new AI_ML features do not instantiate another client.
"""

from AI.layer2_actionability.agent import client  # shared Groq client

__all__ = ["client"]
