from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, invoices

app = FastAPI(title="Delay Accountability ERP", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(invoices.router, prefix="/invoices", tags=["invoices"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Delay Accountability ERP API"}
