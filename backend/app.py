from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from modules.hash_analyzer import router as hash_analyzer_router
from modules.rainbow_core import router as rainbow_core_router
from modules.benchmark import router as benchmark_router
from modules.salt_demo import router as salt_demo_router
from modules.code_auditor import router as code_auditor_router

app = FastAPI(
    title="RainbowLab API",
    description="Interactive rainbow table attack education suite",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(hash_analyzer_router, prefix="/api/hash", tags=["Hash Analyzer"])
app.include_router(rainbow_core_router, prefix="/api/rainbow", tags=["Rainbow Core"])
app.include_router(benchmark_router, prefix="/api/benchmark", tags=["Benchmark"])
app.include_router(salt_demo_router, prefix="/api/salt", tags=["Salt Demo"])
app.include_router(code_auditor_router, prefix="/api/audit", tags=["Code Auditor"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "project": "RainbowLab"}
