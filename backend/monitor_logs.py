#!/usr/bin/env python3

import asyncio
import aiohttp
import time

async def monitor_server_logs():
    """Monitor server logs by making requests and checking responses"""
    
    print("🔍 Monitoring server logs...")
    print("Make a request from your mobile app now...")
    print("Press Ctrl+C to stop monitoring\n")
    
    try:
        while True:
            async with aiohttp.ClientSession() as session:
                # Check server health
                try:
                    async with session.get('http://192.168.1.146:8000/api/') as response:
                        if response.status == 200:
                            print(f"✅ Server is running - {time.strftime('%H:%M:%S')}")
                        else:
                            print(f"⚠️  Server issue - Status: {response.status}")
                except Exception as e:
                    print(f"❌ Server connection error: {e}")
            
            await asyncio.sleep(5)  # Check every 5 seconds
            
    except KeyboardInterrupt:
        print("\n🛑 Monitoring stopped")

if __name__ == "__main__":
    asyncio.run(monitor_server_logs())
