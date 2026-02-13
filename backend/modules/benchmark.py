import hashlib
import time
import bcrypt
import argon2
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class BenchmarkRequest(BaseModel):
    test_password: str = "benchmark_test_123"
    iterations: int = 1000


@router.post("/run")
async def run_benchmark(req: BenchmarkRequest):
    password = req.test_password.encode("utf-8")
    iterations = min(req.iterations, 50000)
    results = []

    fast_algos = [
        ("md5", "MD5"),
        ("sha1", "SHA-1"),
        ("sha256", "SHA-256"),
        ("sha512", "SHA-512"),
        ("sha3_256", "SHA-3 (256)"),
        ("blake2b", "BLAKE2b"),
    ]

    for algo_name, display_name in fast_algos:
        start = time.perf_counter()
        for _ in range(iterations):
            h = hashlib.new(algo_name)
            h.update(password)
            h.hexdigest()
        elapsed = time.perf_counter() - start
        hashes_per_sec = iterations / elapsed

        gpu_multiplier = {
            "md5": 1000, "sha1": 500, "sha256": 200,
            "sha512": 100, "sha3_256": 150, "blake2b": 250,
        }
        gpu_speed = hashes_per_sec * gpu_multiplier.get(algo_name, 100)

        charset_size = 62
        password_length = 8
        keyspace = charset_size ** password_length
        crack_seconds = keyspace / gpu_speed

        results.append({
            "algorithm": display_name,
            "hashes_per_sec": round(hashes_per_sec),
            "estimated_gpu_per_sec": round(gpu_speed),
            "time_per_hash_us": round(elapsed / iterations * 1_000_000, 3),
            "crack_time_8char": format_time(crack_seconds),
            "crack_seconds_8char": round(crack_seconds, 2),
            "rating": get_rating(algo_name),
            "iterations_tested": iterations,
        })

    slow_algos = [
        ("bcrypt_10", "bcrypt (cost=10)", 10),
        ("bcrypt_12", "bcrypt (cost=12)", 12),
    ]

    for algo_key, display_name, cost in slow_algos:
        start = time.perf_counter()
        test_rounds = 3
        for _ in range(test_rounds):
            bcrypt.hashpw(password, bcrypt.gensalt(rounds=cost))
        elapsed = time.perf_counter() - start
        hashes_per_sec = test_rounds / elapsed

        keyspace = 62 ** 8
        crack_seconds = keyspace / hashes_per_sec

        results.append({
            "algorithm": display_name,
            "hashes_per_sec": round(hashes_per_sec, 2),
            "estimated_gpu_per_sec": round(hashes_per_sec * 50),
            "time_per_hash_us": round(elapsed / test_rounds * 1_000_000, 0),
            "crack_time_8char": format_time(crack_seconds),
            "crack_seconds_8char": crack_seconds,
            "rating": "🟢 Good" if cost <= 10 else "🟢 Better",
            "iterations_tested": test_rounds,
        })

    try:
        ph = argon2.PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
        start = time.perf_counter()
        test_rounds = 3
        for _ in range(test_rounds):
            ph.hash(req.test_password)
        elapsed = time.perf_counter() - start
        hashes_per_sec = test_rounds / elapsed

        keyspace = 62 ** 8
        crack_seconds = keyspace / hashes_per_sec

        results.append({
            "algorithm": "Argon2id",
            "hashes_per_sec": round(hashes_per_sec, 2),
            "estimated_gpu_per_sec": round(hashes_per_sec * 10),
            "time_per_hash_us": round(elapsed / test_rounds * 1_000_000, 0),
            "crack_time_8char": format_time(crack_seconds),
            "crack_seconds_8char": crack_seconds,
            "rating": "🟢 Best",
            "iterations_tested": test_rounds,
        })
    except Exception as e:
        results.append({
            "algorithm": "Argon2id",
            "error": str(e),
            "rating": "🟢 Best",
        })

    return {
        "machine_info": "Results from your machine (Python backend)",
        "results": results,
        "note": "GPU estimates are approximations based on known hardware benchmarks.",
    }


def format_time(seconds: float) -> str:
    if seconds < 1:
        return "< 1 second"
    elif seconds < 60:
        return f"{seconds:.1f} seconds"
    elif seconds < 3600:
        return f"{seconds / 60:.1f} minutes"
    elif seconds < 86400:
        return f"{seconds / 3600:.1f} hours"
    elif seconds < 31536000:
        return f"{seconds / 86400:.1f} days"
    else:
        years = seconds / 31536000
        if years < 1000:
            return f"{years:.0f} years"
        elif years < 1_000_000:
            return f"{years / 1000:.0f}K years"
        elif years < 1_000_000_000:
            return f"{years / 1_000_000:.0f}M years"
        else:
            return f"{years:.1e} years"


def get_rating(algo: str) -> str:
    ratings = {
        "md5": "🔴 Dead",
        "sha1": "🔴 Dead",
        "sha256": "🟡 Weak (for passwords)",
        "sha512": "🟡 Weak (for passwords)",
        "sha3_256": "🟡 Moderate",
        "blake2b": "🟡 Moderate",
    }
    return ratings.get(algo, "Unknown")
