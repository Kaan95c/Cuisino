#!/usr/bin/env python3

import asyncio
import aiohttp
import json

async def test_comment_with_authentication():
    """Test adding a comment with proper authentication"""
    
    # First, let's login to get a token
    login_data = {
        "email": "test@example.com",  # Replace with a real user email
        "password": "password123"     # Replace with a real password
    }
    
    print("Step 1: Testing login...")
    async with aiohttp.ClientSession() as session:
        try:
            # Try to login
            async with session.post('http://192.168.1.146:8000/api/auth/login', json=login_data) as response:
                print(f"Login Status: {response.status}")
                if response.status == 200:
                    login_result = await response.json()
                    token = login_result.get('access_token')
                    print(f"✅ Login successful, got token: {token[:20]}...")
                    
                    # Now test adding a comment
                    print("\nStep 2: Testing comment creation...")
                    
                    # Get a real recipe ID first
                    async with session.get('http://192.168.1.146:8000/api/recipes') as recipes_response:
                        if recipes_response.status == 200:
                            recipes = await recipes_response.json()
                            if recipes:
                                recipe_id = recipes[0]['id']
                                print(f"Using recipe ID: {recipe_id}")
                                
                                # Test comment data
                                comment_data = {
                                    "content": "Test comment from script",
                                    "recipeId": recipe_id,
                                    "author": {
                                        "id": "test_user_id",
                                        "name": "Test User",
                                        "avatar": "https://example.com/avatar.jpg"
                                    }
                                }
                                
                                # Add authorization header
                                headers = {
                                    "Authorization": f"Bearer {token}",
                                    "Content-Type": "application/json"
                                }
                                
                                async with session.post(
                                    'http://192.168.1.146:8000/api/comments',
                                    json=comment_data,
                                    headers=headers
                                ) as comment_response:
                                    print(f"Comment Status: {comment_response.status}")
                                    if comment_response.status == 200:
                                        comment_result = await comment_response.json()
                                        print(f"✅ Comment created successfully: {comment_result}")
                                    else:
                                        error_text = await comment_response.text()
                                        print(f"❌ Comment creation failed: {error_text}")
                            else:
                                print("❌ No recipes found to test with")
                        else:
                            print(f"❌ Failed to get recipes: {recipes_response.status}")
                else:
                    error_text = await response.text()
                    print(f"❌ Login failed: {error_text}")
                    print("Note: You need to have a user account to test this")
                    
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_comment_with_authentication())
