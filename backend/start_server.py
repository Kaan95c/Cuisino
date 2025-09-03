#!/usr/bin/env python3
"""
Script to start the Cuisino backend server
"""
import uvicorn
import os
from pathlib import Path

if __name__ == "__main__":
    # Get the directory of this script
    script_dir = Path(__file__).parent
    
    # Load environment variables
    env_file = script_dir / '.env'
    if env_file.exists():
        print(f"Loading environment from {env_file}")
    else:
        print("Warning: .env file not found. Using default values.")
        print("Please copy env.example to .env and configure your settings.")
    
    # Start the server
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(script_dir)],
        log_level="info"
    )
