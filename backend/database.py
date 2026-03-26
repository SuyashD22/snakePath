import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

supabase = None

try:
    from supabase import create_client, Client

    def get_supabase():
        """Get Supabase client. Returns None if credentials not configured."""
        global supabase
        if supabase is None and SUPABASE_URL and SUPABASE_KEY:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        return supabase

except ImportError:
    def get_supabase():
        """Supabase not installed — returns None."""
        return None


def is_db_available() -> bool:
    """Check if Supabase is configured and available."""
    return bool(SUPABASE_URL and SUPABASE_KEY) and get_supabase() is not None

