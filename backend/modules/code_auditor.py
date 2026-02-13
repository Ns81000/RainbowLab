import re
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class CodeAuditRequest(BaseModel):
    code: str
    language: Optional[str] = None


class HashListRequest(BaseModel):
    hashes: str


VULNERABILITY_PATTERNS = {
    "php": [
        {
            "pattern": r"md5\s*\(",
            "severity": "CRITICAL",
            "title": "Using MD5 for hashing",
            "description": "MD5 is cryptographically broken. Rainbow tables can crack MD5 hashes in seconds.",
            "fix": "password_hash($password, PASSWORD_ARGON2ID, ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 3])",
            "category": "weak_hash",
        },
        {
            "pattern": r"sha1\s*\(",
            "severity": "CRITICAL",
            "title": "Using SHA-1 for hashing",
            "description": "SHA-1 has known collision attacks since 2017 (SHAttered).",
            "fix": "password_hash($password, PASSWORD_ARGON2ID)",
            "category": "weak_hash",
        },
        {
            "pattern": r"sha256\s*\(|hash\s*\(\s*['\"]sha256['\"]\s*,",
            "severity": "HIGH",
            "title": "Using raw SHA-256 for passwords",
            "description": "SHA-256 is too fast for password hashing. GPUs can compute billions per second.",
            "fix": "password_hash($password, PASSWORD_ARGON2ID)",
            "category": "weak_hash",
        },
        {
            "pattern": r"password_hash\s*\([^,]+,\s*PASSWORD_BCRYPT",
            "severity": "LOW",
            "title": "Using bcrypt — good, but Argon2 is better",
            "description": "bcrypt is still secure, but Argon2id is the current recommendation.",
            "fix": "password_hash($password, PASSWORD_ARGON2ID)",
            "category": "outdated",
        },
        {
            "pattern": r"\$_POST\s*\[\s*['\"]password['\"]\s*\]",
            "severity": "HIGH",
            "title": "Direct use of raw POST password",
            "description": "Using raw POST data for passwords without validation or sanitization. Ensure proper handling before hashing.",
            "fix": "// Always validate, sanitize, and hash\n$password = $_POST['password'];\nif (strlen($password) < 8) die('Password too short');\n$hash = password_hash($password, PASSWORD_ARGON2ID);",
            "category": "bad_practice",
        },
    ],
    "python": [
        {
            "pattern": r"hashlib\.md5\s*\(",
            "severity": "CRITICAL",
            "title": "Using MD5 via hashlib",
            "description": "MD5 is cryptographically broken and rainbow-table crackable.",
            "fix": "from argon2 import PasswordHasher\nph = PasswordHasher()\nhash = ph.hash(password)",
            "category": "weak_hash",
        },
        {
            "pattern": r"hashlib\.sha1\s*\(",
            "severity": "CRITICAL",
            "title": "Using SHA-1 via hashlib",
            "description": "SHA-1 has known collision attacks.",
            "fix": "from argon2 import PasswordHasher\nph = PasswordHasher()\nhash = ph.hash(password)",
            "category": "weak_hash",
        },
        {
            "pattern": r"hashlib\.sha256\s*\(",
            "severity": "HIGH",
            "title": "Using raw SHA-256 for passwords",
            "description": "Too fast for password hashing without key stretching.",
            "fix": "import bcrypt\nhash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))",
            "category": "weak_hash",
        },
        {
            "pattern": r"import\s+crypt\b|crypt\.crypt\s*\(",
            "severity": "HIGH",
            "title": "Using legacy crypt module",
            "description": "The crypt module uses outdated algorithms.",
            "fix": "from argon2 import PasswordHasher\nph = PasswordHasher()\nhash = ph.hash(password)",
            "category": "weak_hash",
        },
        {
            "pattern": r"hashlib\.pbkdf2_hmac\s*\([^)]*iterations\s*=\s*(\d+)",
            "severity": "MEDIUM",
            "title": "PBKDF2 detected — check iteration count",
            "description": "PBKDF2 is acceptable but requires high iterations (≥600,000 for SHA-256 as of 2024 OWASP guidelines).",
            "fix": "import hashlib\nhash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, iterations=600000)",
            "category": "config_issue",
        },
        {
            "pattern": r"password\s*==\s*|password\s*!=\s*",
            "severity": "HIGH",
            "title": "Plaintext password comparison",
            "description": "Comparing passwords directly suggests they may be stored in plaintext. Never store raw passwords.",
            "fix": "# Use constant-time comparison with hashed passwords\nimport hmac\nhmac.compare_digest(stored_hash, computed_hash)",
            "category": "plaintext",
        },
        {
            "pattern": r"password\s*=\s*['\"][^'\"]+['\"]",
            "severity": "CRITICAL",
            "title": "Hardcoded password detected",
            "description": "Passwords should never be hardcoded in source code.",
            "fix": "import os\npassword = os.environ.get('DB_PASSWORD')\n# Or use a secrets manager",
            "category": "hardcoded",
        },
    ],
    "javascript": [
        {
            "pattern": r"createHash\s*\(\s*['\"]md5['\"]\s*\)",
            "severity": "CRITICAL",
            "title": "Using MD5 via crypto.createHash",
            "description": "MD5 is broken. Rainbow tables crack MD5 in seconds.",
            "fix": "const bcrypt = require('bcrypt');\nconst hash = await bcrypt.hash(password, 12);",
            "category": "weak_hash",
        },
        {
            "pattern": r"createHash\s*\(\s*['\"]sha1['\"]\s*\)",
            "severity": "CRITICAL",
            "title": "Using SHA-1 via crypto.createHash",
            "description": "SHA-1 is broken since 2017.",
            "fix": "const bcrypt = require('bcrypt');\nconst hash = await bcrypt.hash(password, 12);",
            "category": "weak_hash",
        },
        {
            "pattern": r"createHash\s*\(\s*['\"]sha256['\"]\s*\)",
            "severity": "HIGH",
            "title": "Using raw SHA-256 for passwords",
            "description": "SHA-256 is too fast for password hashing.",
            "fix": "const argon2 = require('argon2');\nconst hash = await argon2.hash(password);",
            "category": "weak_hash",
        },
        {
            "pattern": r"password\s*===?\s*['\"]|['\"].*password['\"]",
            "severity": "HIGH",
            "title": "Possible plaintext password comparison",
            "description": "Direct string comparison with passwords suggests insecure storage.",
            "fix": "const bcrypt = require('bcrypt');\nconst isMatch = await bcrypt.compare(input, storedHash);",
            "category": "plaintext",
        },
    ],
    "java": [
        {
            "pattern": r"MessageDigest\.getInstance\s*\(\s*['\"]MD5['\"]\s*\)",
            "severity": "CRITICAL",
            "title": "Using MD5 MessageDigest",
            "description": "MD5 is completely broken for security purposes.",
            "fix": "Use BCryptPasswordEncoder from Spring Security or Argon2PasswordEncoder.",
            "category": "weak_hash",
        },
        {
            "pattern": r"MessageDigest\.getInstance\s*\(\s*['\"]SHA-1['\"]\s*\)",
            "severity": "CRITICAL",
            "title": "Using SHA-1 MessageDigest",
            "description": "SHA-1 has demonstrated collision attacks.",
            "fix": "Use BCryptPasswordEncoder or Argon2PasswordEncoder.",
            "category": "weak_hash",
        },
        {
            "pattern": r"MessageDigest\.getInstance\s*\(\s*['\"]SHA-256['\"]\s*\)",
            "severity": "HIGH",
            "title": "Using raw SHA-256 for passwords",
            "description": "SHA-256 is not designed for password hashing without PBKDF2 wrapping.",
            "fix": "Use Spring Security's Argon2PasswordEncoder or BCryptPasswordEncoder.",
            "category": "weak_hash",
        },
    ],
    "ruby": [
        {
            "pattern": r"Digest::MD5",
            "severity": "CRITICAL",
            "title": "Using Digest::MD5",
            "description": "MD5 is cryptographically broken.",
            "fix": "Use bcrypt gem: BCrypt::Password.create(password)",
            "category": "weak_hash",
        },
        {
            "pattern": r"Digest::SHA1",
            "severity": "CRITICAL",
            "title": "Using Digest::SHA1",
            "description": "SHA-1 has known collision attacks.",
            "fix": "Use bcrypt gem: BCrypt::Password.create(password)",
            "category": "weak_hash",
        },
    ],
}


def detect_language(code: str) -> str:
    indicators = {
        "php": [r"\$\w+", r"<\?php", r"->", r"echo\s", r"function\s+\w+\s*\("],
        "python": [r"def\s+\w+", r"import\s+\w+", r"from\s+\w+", r"print\s*\(", r":\s*$"],
        "javascript": [r"const\s+", r"let\s+", r"var\s+", r"require\s*\(", r"=>\s*\{", r"async\s+"],
        "java": [r"public\s+class", r"private\s+", r"System\.out", r"void\s+main", r"import\s+java"],
        "ruby": [r"require\s+['\"]", r"puts\s+", r"class\s+\w+\s*$", r"\.each\s+do"],
    }

    scores = {}
    for lang, patterns in indicators.items():
        score = sum(1 for p in patterns if re.search(p, code, re.MULTILINE))
        scores[lang] = score

    if max(scores.values()) == 0:
        return "unknown"
    return max(scores, key=scores.get)


def check_salt_presence(code: str) -> bool:
    salt_indicators = [
        r"salt", r"gensalt", r"random_bytes", r"urandom",
        r"os\.urandom", r"crypto\.random", r"SecureRandom",
        r"SALT", r"bcrypt", r"argon2", r"password_hash",
    ]
    return any(re.search(p, code, re.IGNORECASE) for p in salt_indicators)


def check_pepper_presence(code: str) -> bool:
    pepper_indicators = [r"pepper", r"PEPPER", r"secret_key.*hash", r"hmac"]
    return any(re.search(p, code, re.IGNORECASE) for p in pepper_indicators)


def compute_security_score(findings, has_salt, has_pepper) -> int:
    score = 100
    for f in findings:
        if f["severity"] == "CRITICAL":
            score -= 25
        elif f["severity"] == "HIGH":
            score -= 15
        elif f["severity"] == "MEDIUM":
            score -= 8
        elif f["severity"] == "LOW":
            score -= 3

    if not has_salt and findings:
        score -= 10
    if not has_pepper:
        score -= 3

    return max(0, min(100, score))


def get_code_lines_context(code: str, line_num: int, context: int = 0) -> dict:
    lines = code.split("\n")
    start = max(0, line_num - 1 - context)
    end = min(len(lines), line_num + context)
    return {
        "line_number": line_num,
        "code": lines[line_num - 1].rstrip() if line_num <= len(lines) else "",
    }


@router.post("/code")
async def audit_code(req: CodeAuditRequest):
    code = req.code
    language = req.language or detect_language(code)
    findings = []

    patterns = VULNERABILITY_PATTERNS.get(language, [])
    for lang_key, lang_patterns in VULNERABILITY_PATTERNS.items():
        if lang_key != language:
            for p in lang_patterns:
                patterns.append(p)

    seen_titles = set()
    for vuln in patterns:
        matches = list(re.finditer(vuln["pattern"], code, re.IGNORECASE | re.MULTILINE))
        if matches and vuln["title"] not in seen_titles:
            seen_titles.add(vuln["title"])
            lines_info = []
            for m in matches:
                line_num = code[:m.start()].count("\n") + 1
                ctx = get_code_lines_context(code, line_num)
                lines_info.append(ctx)
            findings.append({
                "severity": vuln["severity"],
                "title": vuln["title"],
                "description": vuln["description"],
                "fix": vuln["fix"],
                "category": vuln.get("category", "other"),
                "lines": [li["line_number"] for li in lines_info],
                "code_snippets": lines_info,
            })

    has_salt = check_salt_presence(code)
    has_pepper = check_pepper_presence(code)

    if not has_salt and findings:
        findings.append({
            "severity": "CRITICAL",
            "title": "No salt detected",
            "description": "Password hashing without salt makes all identical passwords have identical hashes, enabling rainbow table attacks.",
            "fix": "Add a random salt per password. Use bcrypt or Argon2 which handle salting automatically.",
            "category": "missing_salt",
            "lines": [],
            "code_snippets": [],
        })

    if not has_pepper and findings:
        findings.append({
            "severity": "MEDIUM",
            "title": "No pepper detected",
            "description": "A pepper (server-side secret) adds defense-in-depth even if the database is compromised.",
            "fix": "Consider adding an HMAC with a server-side secret key before hashing.",
            "category": "missing_pepper",
            "lines": [],
            "code_snippets": [],
        })

    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    findings.sort(key=lambda f: severity_order.get(f["severity"], 99))

    overall = "SAFE"
    if any(f["severity"] == "CRITICAL" for f in findings):
        overall = "CRITICAL RISK"
    elif any(f["severity"] == "HIGH" for f in findings):
        overall = "HIGH RISK"
    elif any(f["severity"] == "MEDIUM" for f in findings):
        overall = "MODERATE RISK"
    elif any(f["severity"] == "LOW" for f in findings):
        overall = "LOW RISK"

    severity_counts = {
        "CRITICAL": sum(1 for f in findings if f["severity"] == "CRITICAL"),
        "HIGH": sum(1 for f in findings if f["severity"] == "HIGH"),
        "MEDIUM": sum(1 for f in findings if f["severity"] == "MEDIUM"),
        "LOW": sum(1 for f in findings if f["severity"] == "LOW"),
    }

    security_score = compute_security_score(findings, has_salt, has_pepper)

    return {
        "detected_language": language,
        "overall_risk": overall,
        "security_score": security_score,
        "findings_count": len(findings),
        "severity_counts": severity_counts,
        "findings": findings,
        "has_salt": has_salt,
        "has_pepper": has_pepper,
        "total_lines": code.count("\n") + 1,
        "vulnerable_lines": sorted(set(l for f in findings for l in f["lines"])),
    }


@router.post("/hashes")
async def audit_hashes(req: HashListRequest):
    lines = [l.strip() for l in req.hashes.strip().split("\n") if l.strip()]
    results = []

    for h in lines:
        length = len(h)
        is_hex = all(c in "0123456789abcdefABCDEF" for c in h)

        if not is_hex:
            if h.startswith("$2b$") or h.startswith("$2a$"):
                results.append({
                    "hash": h[:20] + "...",
                    "format": "bcrypt",
                    "has_salt": True,
                    "rainbow_vulnerable": False,
                    "risk": "LOW",
                    "note": "bcrypt with embedded salt — secure.",
                    "time_to_crack": "Centuries (infeasible)",
                })
            elif h.startswith("$argon2"):
                results.append({
                    "hash": h[:20] + "...",
                    "format": "Argon2",
                    "has_salt": True,
                    "rainbow_vulnerable": False,
                    "risk": "SAFE",
                    "note": "Argon2 — current best practice.",
                    "time_to_crack": "Infeasible with current technology",
                })
            elif h.startswith("$pbkdf2") or h.startswith("pbkdf2:"):
                results.append({
                    "hash": h[:20] + "...",
                    "format": "PBKDF2",
                    "has_salt": True,
                    "rainbow_vulnerable": False,
                    "risk": "MODERATE",
                    "note": "PBKDF2 — acceptable if iteration count is high enough.",
                    "time_to_crack": "Depends on iteration count",
                })
            elif h.startswith("$5$") or h.startswith("$6$"):
                prefix = "$5$" if h.startswith("$5$") else "$6$"
                fmt = "SHA-256 crypt" if prefix == "$5$" else "SHA-512 crypt"
                results.append({
                    "hash": h[:20] + "...",
                    "format": fmt,
                    "has_salt": True,
                    "rainbow_vulnerable": False,
                    "risk": "MODERATE",
                    "note": f"{fmt} with salt rounds — consider upgrading to Argon2.",
                    "time_to_crack": "Days to months depending on rounds",
                })
            else:
                results.append({
                    "hash": h[:24] + "...",
                    "format": "Unknown",
                    "has_salt": None,
                    "rainbow_vulnerable": None,
                    "risk": "UNKNOWN",
                    "note": "Unrecognized hash format.",
                    "time_to_crack": "N/A",
                })
            continue

        format_guess = "Unknown"
        time_est = "Unknown"
        if length == 32:
            format_guess = "MD5"
            time_est = "< 1 second (rainbow table)"
        elif length == 40:
            format_guess = "SHA-1"
            time_est = "Seconds to minutes (GPU cracking)"
        elif length == 64:
            format_guess = "SHA-256"
            time_est = "Hours to days (GPU farm)"
        elif length == 96:
            format_guess = "SHA-384"
            time_est = "Days to weeks"
        elif length == 128:
            format_guess = "SHA-512"
            time_est = "Weeks to months (brute force)"

        is_vulnerable = length <= 40

        results.append({
            "hash": h,
            "format": format_guess,
            "has_salt": False,
            "rainbow_vulnerable": is_vulnerable,
            "risk": "CRITICAL" if is_vulnerable else "MODERATE",
            "note": f"{format_guess} detected, no salt, {'rainbow-table vulnerable' if is_vulnerable else 'consider using bcrypt/Argon2'}",
            "time_to_crack": time_est,
        })

    critical_count = sum(1 for r in results if r["risk"] == "CRITICAL")
    safe_count = sum(1 for r in results if r["risk"] in ("SAFE", "LOW"))
    overall = "SAFE"
    if critical_count > 0:
        overall = "CRITICAL RISK"
    elif any(r["risk"] in ("HIGH", "MODERATE") for r in results):
        overall = "NEEDS IMPROVEMENT"

    return {
        "total_hashes": len(results),
        "overall_risk": overall,
        "critical_count": critical_count,
        "safe_count": safe_count,
        "results": results,
        "recommendation": "Upgrade all insecure hashes to Argon2id immediately." if critical_count > 0 else "Hash storage looks reasonable.",
    }
