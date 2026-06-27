from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from api.compute import run_compute

app = FastAPI(title="TaxSathi Core Engine API")

# Allow Next.js frontend to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "TaxSathi Core Engine"}

@app.post("/api/compute")
async def compute_endpoint(request: Request):
    payload = await request.json()
    status, data = run_compute(payload)
    # Return as standard JSON (FastAPI handles the 200/400 status automatically if we raise exceptions, 
    # but since run_compute returns (status, dict), we can just return the dict or use JSONResponse)
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=status, content=data)
