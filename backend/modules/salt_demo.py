import hashlib
import os
import time
import bcrypt
import argon2
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SaltDemoRequest(BaseModel):
    password: str


class IterationRequest(BaseModel):
    password: str
    iterations: int = 10


@router.post("/demonstrate")
async def demonstrate_salt(req: SaltDemoRequest):
    password = req.password

    md5_raw = hashlib.md5(password.encode()).hexdigest()

    salt_hex = os.urandom(16).hex()
    md5_salted = hashlib.md5((salt_hex + password).encode()).hexdigest()

    sha256_raw = hashlib.sha256(password.encode()).hexdigest()

    salt2_hex = os.urandom(16).hex()
    sha256_salted = hashlib.sha256((salt2_hex + password).encode()).hexdigest()

    start = time.time()
    bcrypt_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=10)).decode()
    bcrypt_time = time.time() - start

    start = time.time()
    ph = argon2.PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
    argon2_hash = ph.hash(password)
    argon2_time = time.time() - start

    table_size_gb = 4.3
    salt_bits = 128
    impossible_size = table_size_gb * (2 ** 32)

    return {
        "password": password,
        "comparisons": [
            {
                "method": "Raw MD5",
                "hash": md5_raw,
                "salt": None,
                "rainbow_vulnerable": True,
                "crack_time": "~0.2 seconds",
                "rating": "critical",
                "icon": "🔴",
            },
            {
                "method": "MD5 + Salt",
                "hash": md5_salted,
                "salt": salt_hex,
                "rainbow_vulnerable": False,
                "crack_time": "Not in rainbow table (but fast to brute-force)",
                "rating": "warning",
                "icon": "🟡",
            },
            {
                "method": "SHA-256 (raw)",
                "hash": sha256_raw,
                "salt": None,
                "rainbow_vulnerable": True,
                "crack_time": "~5 seconds (GPU)",
                "rating": "high",
                "icon": "🟠",
            },
            {
                "method": "SHA-256 + Salt",
                "hash": sha256_salted,
                "salt": salt2_hex,
                "rainbow_vulnerable": False,
                "crack_time": "Not in rainbow table",
                "rating": "moderate",
                "icon": "🟡",
            },
            {
                "method": f"bcrypt (cost=10)",
                "hash": bcrypt_hash,
                "salt": "embedded",
                "rainbow_vulnerable": False,
                "crack_time": f"~{150/1000:.0f}ms per attempt → ~26 years for 8-char",
                "rating": "safe",
                "icon": "🟢",
                "actual_time_ms": round(bcrypt_time * 1000, 1),
            },
            {
                "method": "Argon2id",
                "hash": argon2_hash,
                "salt": "embedded",
                "rainbow_vulnerable": False,
                "crack_time": f"~{300/1000:.0f}ms per attempt → ~178 years for 8-char",
                "rating": "excellent",
                "icon": "🟢",
                "actual_time_ms": round(argon2_time * 1000, 1),
            },
        ],
        "rainbow_table_math": {
            "standard_table_size_gb": table_size_gb,
            "with_salt_size_tb": round(impossible_size / 1024, 0),
            "salt_bits": salt_bits,
            "conclusion": f"Without salt: {table_size_gb} GB. With {salt_bits}-bit salt: {impossible_size:,.0f} GB = IMPOSSIBLE",
        },
    }


@router.post("/iteration-demo")
async def iteration_demo(req: IterationRequest):
    results = []
    password = req.password.encode()

    for cost in [4, 8, 10, 12, 14]:
        start = time.time()
        bcrypt.hashpw(password, bcrypt.gensalt(rounds=cost))
        elapsed = time.time() - start
        results.append({
            "algorithm": f"bcrypt (cost={cost})",
            "time_ms": round(elapsed * 1000, 2),
            "hashes_per_sec": round(1 / elapsed, 2) if elapsed > 0 else 999999,
        })

    for time_cost in [1, 2, 3, 5]:
        try:
            ph = argon2.PasswordHasher(time_cost=time_cost, memory_cost=65536, parallelism=4)
            start = time.time()
            ph.hash(req.password)
            elapsed = time.time() - start
            results.append({
                "algorithm": f"Argon2id (t={time_cost}, m=64MB)",
                "time_ms": round(elapsed * 1000, 2),
                "hashes_per_sec": round(1 / elapsed, 2) if elapsed > 0 else 999999,
            })
        except Exception:
            pass

    return {"password": req.password, "results": results}
