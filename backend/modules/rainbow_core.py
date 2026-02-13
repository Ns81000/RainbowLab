import hashlib
import string
import time
import json
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

_cached_table = {
    "params": None,
    "table": None,
}


class ChainGenerateRequest(BaseModel):
    charset: str = "lowercase"
    max_length: int = 4
    hash_type: str = "md5"
    chain_length: int = 100
    chain_count: int = 500


class CrackRequest(BaseModel):
    hash_to_crack: str
    hash_type: str = "md5"
    charset: str = "lowercase"
    max_length: int = 4
    chain_length: int = 100
    chain_count: int = 500


class VisualizerRequest(BaseModel):
    start_password: str = "test"
    hash_type: str = "md5"
    chain_length: int = 10
    charset: str = "lowercase"
    max_length: int = 4


CHARSET_MAP = {
    "lowercase": string.ascii_lowercase,
    "digits": string.digits,
    "lowercase_digits": string.ascii_lowercase + string.digits,
    "uppercase": string.ascii_uppercase,
    "alphanumeric": string.ascii_letters + string.digits,
}


def compute_hash(text: str, hash_type: str) -> str:
    h = hashlib.new(hash_type)
    h.update(text.encode("utf-8"))
    return h.hexdigest()


def reduce_function(hash_hex: str, step: int, charset: str, max_length: int) -> str:
    hash_int = int(hash_hex[:16], 16) + step
    chars = CHARSET_MAP.get(charset, string.ascii_lowercase)
    base = len(chars)

    total_keyspace = sum(base ** i for i in range(1, max_length + 1))
    index = hash_int % total_keyspace

    for length in range(1, max_length + 1):
        block_size = base ** length
        if index < block_size:
            password = []
            remainder = index
            for _ in range(length):
                password.append(chars[remainder % base])
                remainder //= base
            return "".join(password)
        index -= block_size

    return chars[0]


def generate_chain(start: str, hash_type: str, chain_length: int, charset: str, max_length: int):
    current_password = start
    steps = [{"step": 0, "password": current_password, "type": "start"}]

    for i in range(chain_length):
        hash_value = compute_hash(current_password, hash_type)
        steps.append({"step": i * 2 + 1, "hash": hash_value, "type": "hash"})

        next_password = reduce_function(hash_value, i, charset, max_length)
        steps.append({"step": i * 2 + 2, "password": next_password, "type": "reduce", "reduction_index": i})

        current_password = next_password

    return {
        "start": start,
        "end": current_password,
        "chain_length": chain_length,
        "steps": steps,
    }


def generate_rainbow_table(charset: str, max_length: int, hash_type: str,
                           chain_length: int, chain_count: int):
    import random

    chars = CHARSET_MAP.get(charset, string.ascii_lowercase)
    table = []

    for i in range(chain_count):
        pwd_len = random.randint(1, max_length)
        start = "".join(random.choices(chars, k=pwd_len))
        current = start
        for step in range(chain_length):
            h = compute_hash(current, hash_type)
            current = reduce_function(h, step, charset, max_length)
        table.append({"start": start, "end": current, "chain_index": i})

    return table


def lookup_in_table(target_hash: str, table: list, hash_type: str,
                    chain_length: int, charset: str, max_length: int):
    chains_searched = 0

    for step_from_end in range(chain_length):
        candidate_hash = target_hash
        candidate_password = reduce_function(candidate_hash, chain_length - 1 - step_from_end, charset, max_length)

        for j in range(chain_length - step_from_end, chain_length):
            candidate_hash = compute_hash(candidate_password, hash_type)
            candidate_password = reduce_function(candidate_hash, j, charset, max_length)

        for entry in table:
            chains_searched += 1
            if entry["end"] == candidate_password:
                current = entry["start"]
                for k in range(chain_length):
                    h = compute_hash(current, hash_type)
                    if h == target_hash:
                        return {
                            "found": True,
                            "password": current,
                            "chain_index": entry["chain_index"],
                            "step_in_chain": k,
                            "chains_searched": chains_searched,
                        }
                    current = reduce_function(h, k, charset, max_length)

    return {"found": False, "chains_searched": chains_searched}


@router.post("/visualize-chain")
async def visualize_chain(req: VisualizerRequest):
    chain = generate_chain(
        start=req.start_password,
        hash_type=req.hash_type,
        chain_length=req.chain_length,
        charset=req.charset,
        max_length=req.max_length,
    )
    return chain


@router.post("/generate-table")
async def generate_table(req: ChainGenerateRequest):
    global _cached_table
    start = time.time()
    table = generate_rainbow_table(
        charset=req.charset,
        max_length=req.max_length,
        hash_type=req.hash_type,
        chain_length=req.chain_length,
        chain_count=req.chain_count,
    )
    elapsed = time.time() - start

    params_key = f"{req.charset}:{req.max_length}:{req.hash_type}:{req.chain_length}:{req.chain_count}"
    _cached_table["params"] = params_key
    _cached_table["table"] = table

    chars = CHARSET_MAP.get(req.charset, string.ascii_lowercase)
    total_keyspace = sum(len(chars) ** i for i in range(1, req.max_length + 1))
    coverage = min(req.chain_count * req.chain_length / total_keyspace * 100, 100)

    return {
        "table_size": len(table),
        "chain_length": req.chain_length,
        "generation_time": round(elapsed, 3),
        "total_keyspace": total_keyspace,
        "estimated_coverage": round(coverage, 2),
        "table": table,
    }


@router.post("/crack")
async def crack_hash(req: CrackRequest):
    global _cached_table
    start = time.time()

    params_key = f"{req.charset}:{req.max_length}:{req.hash_type}:{req.chain_length}:{req.chain_count}"

    if _cached_table["params"] == params_key and _cached_table["table"] is not None:
        table = _cached_table["table"]
        gen_time = 0.0
    else:
        table = generate_rainbow_table(
            charset=req.charset,
            max_length=req.max_length,
            hash_type=req.hash_type,
            chain_length=req.chain_length,
            chain_count=req.chain_count,
        )
        gen_time = time.time() - start
        _cached_table["params"] = params_key
        _cached_table["table"] = table

    lookup_start = time.time()

    result = lookup_in_table(
        target_hash=req.hash_to_crack,
        table=table,
        hash_type=req.hash_type,
        chain_length=req.chain_length,
        charset=req.charset,
        max_length=req.max_length,
    )

    lookup_time = time.time() - lookup_start

    return {
        **result,
        "table_generation_time": round(gen_time, 3),
        "lookup_time": round(lookup_time, 3),
        "total_time": round(gen_time + lookup_time, 3),
        "total_chains": len(table),
    }

