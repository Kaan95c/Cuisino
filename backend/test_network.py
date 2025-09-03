#!/usr/bin/env python3

import asyncio
import aiohttp
import socket

async def test_network_connectivity():
    """Test network connectivity to the backend server"""
    
    # Test localhost
    print("Testing localhost:8000...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:8000/api/') as response:
                print(f"✅ localhost:8000 - Status: {response.status}")
                data = await response.json()
                print(f"   Response: {data}")
    except Exception as e:
        print(f"❌ localhost:8000 - Error: {e}")
    
    # Test the configured IP
    print("\nTesting 192.168.1.146:8000...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('http://192.168.1.146:8000/api/') as response:
                print(f"✅ 192.168.1.146:8000 - Status: {response.status}")
                data = await response.json()
                print(f"   Response: {data}")
    except Exception as e:
        print(f"❌ 192.168.1.146:8000 - Error: {e}")
    
    # Get current IP
    print("\nGetting current IP address...")
    try:
        # Connect to a remote server to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        print(f"Current local IP: {local_ip}")
        
        # Test current IP
        print(f"\nTesting {local_ip}:8000...")
        async with aiohttp.ClientSession() as session:
            async with session.get(f'http://{local_ip}:8000/api/') as response:
                print(f"✅ {local_ip}:8000 - Status: {response.status}")
                data = await response.json()
                print(f"   Response: {data}")
    except Exception as e:
        print(f"❌ {local_ip}:8000 - Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_network_connectivity())
