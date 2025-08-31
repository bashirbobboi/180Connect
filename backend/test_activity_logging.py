#!/usr/bin/env python3
"""
Test script to verify activity logging functionality.
This script will add a test client and check if activities are logged.
"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def test_activity_logging():
    """Test the activity logging functionality."""
    database_url = os.getenv("RENDER_DATABASE_URL")
    
    if database_url.startswith("sqlite"):
        print("❌ This test script is designed for PostgreSQL. SQLite testing requires different approach.")
        return
    
    # Connect to PostgreSQL
    pool = await asyncpg.create_pool(database_url)
    
    async with pool.acquire() as conn:
        try:
            # Check if activities table exists
            table_exists = await conn.fetchval(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'activities'
                );
                """
            )
            
            if not table_exists:
                print("❌ Activities table does not exist!")
                return
            
            print("✅ Activities table exists")
            
            # Check if there are any activities
            activity_count = await conn.fetchval("SELECT COUNT(*) FROM activities")
            print(f"📊 Current activity count: {activity_count}")
            
            # Show recent activities
            activities = await conn.fetch(
                """
                SELECT activity_type, description, company_name, created_at
                FROM activities
                ORDER BY created_at DESC
                LIMIT 5
                """
            )
            
            if activities:
                print("\n📝 Recent activities:")
                for activity in activities:
                    print(f"  - {activity['activity_type']}: {activity['description']} ({activity['created_at']})")
            else:
                print("📝 No activities found")
                
        except Exception as e:
            print(f"❌ Error: {e}")
        finally:
            await pool.close()

if __name__ == "__main__":
    asyncio.run(test_activity_logging())
