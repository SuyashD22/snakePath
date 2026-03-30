import psycopg2
from psycopg2 import pool
import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

_db_pool = None

def init_pool():
    global _db_pool
    if _db_pool is None:
        url = os.getenv("DATABASE_URL")
        try:
            if url and "://" in url:
                parsed = urllib.parse.urlparse(url)
                
                user = parsed.username
                password = parsed.password
                
                if not password and parsed.netloc and "@" in parsed.netloc and ":" in parsed.netloc.split("@", 0)[0]:
                    creds, _ = parsed.netloc.rsplit("@", 1)
                    user, password = creds.split(":", 1)
                
                connect_kwargs = {
                    "dbname": parsed.path.lstrip("/"),
                    "user": user,
                    "password": password,
                    "host": parsed.hostname,
                    "port": parsed.port or 5432,
                    "connect_timeout": 10
                }
                
                connect_kwargs = {k: v for k, v in connect_kwargs.items() if v is not None}
                _db_pool = psycopg2.pool.ThreadedConnectionPool(1, 20, **connect_kwargs)
            else:
                _db_pool = psycopg2.pool.ThreadedConnectionPool(1, 20, url)
        except Exception as e:
            print(f"Database connection pool error: {str(e)}")
            _db_pool = None

def get_connection():
    global _db_pool
    if _db_pool is None:
        init_pool()
    if _db_pool:
        try:
            return _db_pool.getconn()
        except Exception as e:
            print(f"Error getting connection from pool: {str(e)}")
            return None
    return None

def release_connection(conn):
    global _db_pool
    if _db_pool and conn:
        try:
            _db_pool.putconn(conn)
        except Exception as e:
            print(f"Error returning connection to pool: {str(e)}")
