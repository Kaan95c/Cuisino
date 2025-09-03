#!/usr/bin/env python3

import asyncio
import aiohttp
import json
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def test_comments_endpoint():
    """Test the comments endpoint"""
    
    # Test data
    test_comment = {
        "content": "Test comment",
        "recipeId": "507f1f77bcf86cd799439011",  # Fake ObjectId
        "author": {
            "id": "507f1f77bcf86cd799439012",
            "name": "Test User",
            "avatar": "https://example.com/avatar.jpg"
        }
    }
    
    # Test without authentication first
    async with aiohttp.ClientSession() as session:
        try:
            # Test GET comments
            print("Testing GET /api/recipes/{recipe_id}/comments...")
            async with session.get('http://localhost:8000/api/recipes/507f1f77bcf86cd799439011/comments') as response:
                print(f"GET Status: {response.status}")
                if response.status != 200:
                    text = await response.text()
                    print(f"GET Error: {text}")
                else:
                    data = await response.json()
                    print(f"GET Response: {data}")
            
            # Test POST comment (should fail without auth)
            print("\nTesting POST /api/comments (without auth)...")
            async with session.post(
                'http://localhost:8000/api/comments',
                json=test_comment
            ) as response:
                print(f"POST Status: {response.status}")
                text = await response.text()
                print(f"POST Response: {text}")
                
        except Exception as e:
            print(f"Error: {e}")

async def check_mongodb_collections():
    """Check if MongoDB collections exist"""
    try:
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        print("Checking MongoDB collections...")
        
        # List all collections
        collections = await db.list_collection_names()
        print(f"Existing collections: {collections}")
        
        # Check if comments collection exists
        if 'comments' in collections:
            count = await db.comments.count_documents({})
            print(f"Comments collection exists with {count} documents")
        else:
            print("Comments collection does NOT exist")
            
        # Check if recipes collection exists
        if 'recipes' in collections:
            count = await db.recipes.count_documents({})
            print(f"Recipes collection exists with {count} documents")
        else:
            print("Recipes collection does NOT exist")
            
        client.close()
        
    except Exception as e:
        print(f"MongoDB Error: {e}")

async def main():
    print("=== Testing Comments Endpoint ===\n")
    await check_mongodb_collections()
    print("\n" + "="*50 + "\n")
    await test_comments_endpoint()

if __name__ == "__main__":
    asyncio.run(main())
