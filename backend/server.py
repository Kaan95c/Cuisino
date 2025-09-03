from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime
from bson import ObjectId


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Recipe models
class Author(BaseModel):
    id: str
    name: str
    avatar: str

class RecipeCreate(BaseModel):
    title: str
    description: str
    ingredients: List[str]
    instructions: List[str]
    image: str
    author: Author
    servings: Optional[int] = None
    prepTimeMinutes: Optional[int] = None
    difficulty: Optional[Literal['easy','medium','hard']] = None
    tags: Optional[List[str]] = None

class RecipeOut(BaseModel):
    id: str
    title: str
    description: str
    ingredients: List[str]
    instructions: List[str]
    image: str
    author: Author
    likes: int
    createdAt: datetime
    isLiked: bool = False
    isSaved: bool = False
    servings: Optional[int] = None
    prepTimeMinutes: Optional[int] = None
    difficulty: Optional[str] = None
    tags: Optional[List[str]] = None


def recipe_doc_to_out(doc) -> RecipeOut:
    return RecipeOut(
        id=str(doc.get("_id")),
        title=doc["title"],
        description=doc.get("description", ""),
        ingredients=doc.get("ingredients", []),
        instructions=doc.get("instructions", []),
        image=doc["image"],
        author=doc["author"],
        likes=doc.get("likes", 0),
        createdAt=doc.get("createdAt", datetime.utcnow()),
        isLiked=False,
        isSaved=False,
        servings=doc.get("servings"),
        prepTimeMinutes=doc.get("prepTimeMinutes"),
        difficulty=doc.get("difficulty"),
        tags=doc.get("tags"),
    )


# Existing minimal routes
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

# Status
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# Recipes
@api_router.get("/recipes", response_model=List[RecipeOut])
async def list_recipes():
    cursor = db.recipes.find({}, sort=[("createdAt", -1)])
    docs = await cursor.to_list(1000)
    return [recipe_doc_to_out(d) for d in docs]

@api_router.post("/recipes", response_model=RecipeOut)
async def create_recipe(input: RecipeCreate):
    doc = input.dict()
    doc["likes"] = 0
    doc["createdAt"] = datetime.utcnow()
    res = await db.recipes.insert_one(doc)
    inserted = await db.recipes.find_one({"_id": res.inserted_id})
    return recipe_doc_to_out(inserted)

class RecipePatch(BaseModel):
    action: Literal['toggle_like']

@api_router.patch("/recipes/{recipe_id}", response_model=RecipeOut)
async def patch_recipe(recipe_id: str, body: RecipePatch):
    if body.action == 'toggle_like':
        doc = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Recipe not found")
        current_likes = int(doc.get("likes", 0))
        # naïf: +1 (on ne sait pas l’utilisateur) — côté front on bascule visuel; ici on borne à >=0
        new_likes = max(0, current_likes + 1)
        await db.recipes.update_one({"_id": ObjectId(recipe_id)}, {"$set": {"likes": new_likes}})
        updated = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
        return recipe_doc_to_out(updated)
    raise HTTPException(status_code=400, detail="Unsupported action")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
