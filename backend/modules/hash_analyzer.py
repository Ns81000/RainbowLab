import hashlib
import hmac
import struct
import time
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HashRequest(BaseModel):
    text: str


class HashIdentifyRequest(BaseModel):
    hash_value: str


ALGORITHM_INFO = {
    "md5": {
        "name": "MD5",
        "bits": 128,
        "status": "BROKEN",
        "severity": "critical",
        "year_broken": 2004,
        "rainbow_vulnerable": True,
        "description": "Collision attacks demonstrated in 2004. Completely unsuitable for security.",
        "crack_speed_per_sec": 890_000_000,
    },
    "sha1": {
        "name": "SHA-1",
        "bits": 160,
        "status": "BROKEN",
        "severity": "high",
        "year_broken": 2017,
        "rainbow_vulnerable": True,
        "description": "Google demonstrated practical collision (SHAttered) in 2017.",
        "crack_speed_per_sec": 420_000_000,
    },
    "sha256": {
        "name": "SHA-256",
        "bits": 256,
        "status": "SECURE",
        "severity": "safe",
        "year_broken": None,
        "rainbow_vulnerable": False,
        "description": "Part of SHA-2 family. Currently secure for general hashing, but too fast for passwords.",
        "crack_speed_per_sec": 180_000_000,
    },
    "sha512": {
        "name": "SHA-512",
        "bits": 512,
        "status": "SECURE",
        "severity": "safe",
        "year_broken": None,
        "rainbow_vulnerable": False,
        "description": "Strongest SHA-2 variant. Secure for general hashing.",
        "crack_speed_per_sec": 80_000_000,
    },
    "sha3_256": {
        "name": "SHA-3 (256)",
        "bits": 256,
        "status": "STRONGEST",
        "severity": "excellent",
        "year_broken": None,
        "rainbow_vulnerable": False,
        "description": "Latest NIST standard (Keccak). Different internal structure than SHA-2.",
        "crack_speed_per_sec": 120_000_000,
    },
    "sha3_512": {
        "name": "SHA-3 (512)",
        "bits": 512,
        "status": "STRONGEST",
        "severity": "excellent",
        "year_broken": None,
        "rainbow_vulnerable": False,
        "description": "512-bit SHA-3. Maximum security margin.",
        "crack_speed_per_sec": 60_000_000,
    },
    "blake2b": {
        "name": "BLAKE2b",
        "bits": 512,
        "status": "SECURE",
        "severity": "safe",
        "year_broken": None,
        "rainbow_vulnerable": False,
        "description": "Faster than SHA-3 while maintaining security. Used in modern applications.",
        "crack_speed_per_sec": 200_000_000,
    },
    "ntlm": {
        "name": "NTLM",
        "bits": 128,
        "status": "VERY BROKEN",
        "severity": "critical",
        "year_broken": 2003,
        "rainbow_vulnerable": True,
        "description": "Windows legacy hash. No salt. Massive rainbow tables exist publicly.",
        "crack_speed_per_sec": 100_000_000_000,
    },
}

CHARSET_SIZE_MAP = {
    "lowercase": 26,
    "lowercase+digits": 36,
    "mixed_case": 52,
    "mixed_case+digits": 62,
    "full_ascii": 95,
}


def ntlm_hash(text: str) -> str:
    try:
        encoded = text.encode("utf-16-le")
        return hashlib.new("md4", encoded).hexdigest()
    except ValueError:
        encoded = text.encode("utf-16-le")
        import struct
        return hashlib.md5(encoded).hexdigest() + " (md4 unavailable)"


def compute_hash(algo: str, text: str) -> str:
    try:
        if algo == "ntlm":
            return ntlm_hash(text)
        h = hashlib.new(algo)
        h.update(text.encode("utf-8"))
        return h.hexdigest()
    except (ValueError, TypeError) as e:
        return f"Error: {e}"


def estimate_crack_time(algo_key: str, password: str) -> dict:
    info = ALGORITHM_INFO.get(algo_key, {})
    speed = info.get("crack_speed_per_sec", 100_000_000)
    length = len(password)

    charset_size = 95
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(not c.isalnum() for c in password)

    if has_special:
        charset_size = 95
    elif has_upper and has_lower and has_digit:
        charset_size = 62
    elif has_upper and has_lower:
        charset_size = 52
    elif has_lower and has_digit:
        charset_size = 36
    elif has_lower:
        charset_size = 26
    else:
        charset_size = 95

    keyspace = charset_size ** length
    seconds = keyspace / speed

    if seconds < 1:
        human = "< 1 second"
    elif seconds < 60:
        human = f"{seconds:.1f} seconds"
    elif seconds < 3600:
        human = f"{seconds / 60:.1f} minutes"
    elif seconds < 86400:
        human = f"{seconds / 3600:.1f} hours"
    elif seconds < 31536000:
        human = f"{seconds / 86400:.1f} days"
    elif seconds < 31536000 * 1000:
        human = f"{seconds / 31536000:.1f} years"
    elif seconds < 31536000 * 1_000_000:
        human = f"{seconds / 31536000:.0e} years"
    else:
        human = "Effectively infinite"

    return {
        "charset_size": charset_size,
        "keyspace": min(keyspace, 10**50),
        "hashes_per_second": speed,
        "seconds": min(seconds, 10**50),
        "human_readable": human,
    }


@router.post("/analyze")
async def analyze_hash(req: HashRequest):
    results = []
    for algo_key, info in ALGORITHM_INFO.items():
        hash_value = compute_hash(algo_key, req.text)
        crack_estimate = estimate_crack_time(algo_key, req.text)

        results.append({
            "algorithm": info["name"],
            "algorithm_key": algo_key,
            "hash": hash_value,
            "bits": info["bits"],
            "status": info["status"],
            "severity": info["severity"],
            "rainbow_vulnerable": info["rainbow_vulnerable"],
            "year_broken": info["year_broken"],
            "description": info["description"],
            "crack_estimate": crack_estimate,
        })

    return {
        "input": req.text,
        "input_length": len(req.text),
        "results": results,
    }


@router.post("/identify")
async def identify_hash(req: HashIdentifyRequest):
    h = req.hash_value.strip()
    length = len(h)
    possible = []

    length_map = {
        32: ["MD5", "NTLM"],
        40: ["SHA-1"],
        56: ["SHA-224", "SHA3-224"],
        64: ["SHA-256", "SHA3-256", "BLAKE2s"],
        96: ["SHA-384", "SHA3-384"],
        128: ["SHA-512", "SHA3-512", "BLAKE2b"],
    }

    if length in length_map:
        possible = length_map[length]

    is_hex = all(c in "0123456789abcdefABCDEF" for c in h)

    return {
        "hash": h,
        "length": length,
        "is_hex": is_hex,
        "possible_algorithms": possible if is_hex else [],
        "note": "Hash identification by length is probabilistic, not definitive."
              if possible else "Unknown hash format.",
    }
