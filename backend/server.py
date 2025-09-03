from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timedelta
from bson import ObjectId
from passlib.context import CryptContext
from jose import JWTError, jwt
import re


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

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

# User models
class UserCreate(BaseModel):
    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6, max_length=100)
    avatar: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    firstName: Optional[str] = Field(None, min_length=1, max_length=50)
    lastName: Optional[str] = Field(None, min_length=1, max_length=50)
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    bio: Optional[str] = Field(None, max_length=500)
    avatar: Optional[str] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=15)

class UserOut(BaseModel):
    id: str
    firstName: str
    lastName: str
    username: str
    email: str
    phone: str
    bio: Optional[str] = None
    avatar: Optional[str] = None
    createdAt: datetime
    isActive: bool = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

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

# Authentication utilities
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def user_doc_to_out(doc) -> UserOut:
    return UserOut(
        id=str(doc.get("_id")),
        firstName=doc["firstName"],
        lastName=doc["lastName"],
        username=doc["username"],
        email=doc["email"],
        phone=doc["phone"],
        bio=doc.get("bio"),
        avatar=doc.get("avatar"),
        createdAt=doc.get("createdAt", datetime.utcnow()),
        isActive=doc.get("isActive", True),
    )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": token_data.email})
    if user is None:
        raise credentials_exception
    return user_doc_to_out(user)

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


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

# User Authentication Routes
@api_router.post("/auth/register", response_model=UserOut)
async def register_user(user_data: UserCreate):
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Validate phone number format
    phone_pattern = re.compile(r'^\+?[\d\s\-\(\)]{10,15}$')
    if not phone_pattern.match(user_data.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format"
        )
    
    # Create user document
    user_doc = {
        "firstName": user_data.firstName,
        "lastName": user_data.lastName,
        "username": user_data.username,
        "email": user_data.email,
        "phone": user_data.phone,
        "password": get_password_hash(user_data.password),
        "avatar": user_data.avatar,
        "bio": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "isActive": True,
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    return user_doc_to_out(user_doc)

@api_router.post("/auth/login", response_model=Token)
async def login_user(user_credentials: UserLogin):
    # Find user by email
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User Management Routes
@api_router.get("/users/me", response_model=UserOut)
async def get_current_user_info(current_user: UserOut = Depends(get_current_user)):
    return current_user

@api_router.put("/users/me", response_model=UserOut)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserOut = Depends(get_current_user)
):
    # Check if username is being changed and if it's already taken
    if user_update.username and user_update.username != current_user.username:
        existing_username = await db.users.find_one({"username": user_update.username})
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Validate phone number if being updated
    if user_update.phone:
        phone_pattern = re.compile(r'^\+?[\d\s\-\(\)]{10,15}$')
        if not phone_pattern.match(user_update.phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number format"
            )
    
    # Build update document
    update_doc = {"updatedAt": datetime.utcnow()}
    for field, value in user_update.dict(exclude_unset=True).items():
        if value is not None:
            update_doc[field] = value
    
    # Update user in database
    result = await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Return updated user
    updated_user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    return user_doc_to_out(updated_user)

@api_router.get("/users/{user_id}", response_model=UserOut)
async def get_user_by_id(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user_doc_to_out(user)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )


# Recipes
@api_router.get("/recipes", response_model=List[RecipeOut])
async def list_recipes(current_user: Optional[UserOut] = Depends(get_current_user_optional)):
    cursor = db.recipes.find({}, sort=[("createdAt", -1)])
    docs = await cursor.to_list(1000)
    recipes = [recipe_doc_to_out(d) for d in docs]
    
    # If user is authenticated, check likes and saves
    if current_user:
        user_id = current_user.id
        liked_recipes = await db.user_likes.find({"userId": ObjectId(user_id)}).to_list(1000)
        saved_recipes = await db.user_saves.find({"userId": ObjectId(user_id)}).to_list(1000)
        
        liked_ids = {str(like["recipeId"]) for like in liked_recipes}
        saved_ids = {str(save["recipeId"]) for save in saved_recipes}
        
        for recipe in recipes:
            recipe.isLiked = recipe.id in liked_ids
            recipe.isSaved = recipe.id in saved_ids
    
    return recipes

@api_router.get("/recipes/{recipe_id}", response_model=RecipeOut)
async def get_recipe_by_id(recipe_id: str, current_user: Optional[UserOut] = Depends(get_current_user_optional)):
    try:
        # Find the recipe
        doc = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        recipe = recipe_doc_to_out(doc)
        
        # If user is authenticated, check likes and saves
        if current_user:
            user_id = ObjectId(current_user.id)
            recipe_object_id = ObjectId(recipe_id)
            
            # Check if user liked this recipe
            is_liked = await db.user_likes.find_one({
                "userId": user_id,
                "recipeId": recipe_object_id
            }) is not None
            
            # Check if user saved this recipe
            is_saved = await db.user_saves.find_one({
                "userId": user_id,
                "recipeId": recipe_object_id
            }) is not None
            
            recipe.isLiked = is_liked
            recipe.isSaved = is_saved
        
        return recipe
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid recipe ID"
        )

@api_router.post("/recipes", response_model=RecipeOut)
async def create_recipe(input: RecipeCreate, current_user: UserOut = Depends(get_current_user)):
    doc = input.dict()
    doc["authorId"] = ObjectId(current_user.id)
    doc["likes"] = 0
    doc["createdAt"] = datetime.utcnow()
    doc["updatedAt"] = datetime.utcnow()
    doc["isPublished"] = True
    
    res = await db.recipes.insert_one(doc)
    inserted = await db.recipes.find_one({"_id": res.inserted_id})
    return recipe_doc_to_out(inserted)

class RecipePatch(BaseModel):
    action: Literal['toggle_like', 'toggle_save']

@api_router.patch("/recipes/{recipe_id}", response_model=RecipeOut)
async def patch_recipe(recipe_id: str, body: RecipePatch, current_user: UserOut = Depends(get_current_user)):
    # Check if recipe exists
    doc = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    user_id = ObjectId(current_user.id)
    recipe_object_id = ObjectId(recipe_id)
    
    if body.action == 'toggle_like':
        # Check if user already liked this recipe
        existing_like = await db.user_likes.find_one({
            "userId": user_id,
            "recipeId": recipe_object_id
        })
        
        if existing_like:
            # Unlike: remove from user_likes and decrease count
            await db.user_likes.delete_one({"_id": existing_like["_id"]})
            new_likes = max(0, doc.get("likes", 0) - 1)
        else:
            # Like: add to user_likes and increase count
            await db.user_likes.insert_one({
                "userId": user_id,
                "recipeId": recipe_object_id,
                "createdAt": datetime.utcnow()
            })
            new_likes = doc.get("likes", 0) + 1
        
        # Update recipe likes count
        await db.recipes.update_one(
            {"_id": recipe_object_id},
            {"$set": {"likes": new_likes}}
        )
    
    elif body.action == 'toggle_save':
        # Check if user already saved this recipe
        existing_save = await db.user_saves.find_one({
            "userId": user_id,
            "recipeId": recipe_object_id
        })
        
        if existing_save:
            # Unsave: remove from user_saves
            await db.user_saves.delete_one({"_id": existing_save["_id"]})
        else:
            # Save: add to user_saves
            await db.user_saves.insert_one({
                "userId": user_id,
                "recipeId": recipe_object_id,
                "createdAt": datetime.utcnow()
            })
    
    # Return updated recipe with current user's like/save status
    updated = await db.recipes.find_one({"_id": recipe_object_id})
    recipe = recipe_doc_to_out(updated)
    
    # Check current user's like and save status
    user_like = await db.user_likes.find_one({
        "userId": user_id,
        "recipeId": recipe_object_id
    })
    user_save = await db.user_saves.find_one({
        "userId": user_id,
        "recipeId": recipe_object_id
    })
    
    recipe.isLiked = user_like is not None
    recipe.isSaved = user_save is not None
    
    return recipe

@api_router.delete("/recipes/{recipe_id}", response_model=dict)
async def delete_recipe(recipe_id: str, current_user: UserOut = Depends(get_current_user)):
    try:
        # Vérifier que la recette existe
        doc = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Vérifier que l'utilisateur est l'auteur de la recette
        if str(doc.get("authorId")) != current_user.id:
            raise HTTPException(status_code=403, detail="You can only delete your own recipes")
        
        # Supprimer la recette
        await db.recipes.delete_one({"_id": ObjectId(recipe_id)})
        
        # Supprimer les likes et sauvegardes associés
        await db.user_likes.delete_many({"recipeId": ObjectId(recipe_id)})
        await db.user_saves.delete_many({"recipeId": ObjectId(recipe_id)})
        
        return {"message": "Recipe deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error deleting recipe: {str(e)}"
        )

# User's liked and saved recipes
@api_router.get("/users/me/liked-recipes", response_model=List[RecipeOut])
async def get_user_liked_recipes(current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    liked_recipes = await db.user_likes.find({"userId": user_id}).to_list(1000)
    
    recipe_ids = [like["recipeId"] for like in liked_recipes]
    recipes = await db.recipes.find({"_id": {"$in": recipe_ids}}).to_list(1000)
    
    result = []
    for recipe in recipes:
        recipe_out = recipe_doc_to_out(recipe)
        recipe_out.isLiked = True
        recipe_out.isSaved = await db.user_saves.find_one({
            "userId": user_id,
            "recipeId": recipe["_id"]
        }) is not None
        result.append(recipe_out)
    
    return result

@api_router.get("/users/me/saved-recipes", response_model=List[RecipeOut])
async def get_user_saved_recipes(current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    saved_recipes = await db.user_saves.find({"userId": user_id}).to_list(1000)
    
    recipe_ids = [save["recipeId"] for save in saved_recipes]
    recipes = await db.recipes.find({"_id": {"$in": recipe_ids}}).to_list(1000)
    
    result = []
    for recipe in recipes:
        recipe_out = recipe_doc_to_out(recipe)
        recipe_out.isLiked = await db.user_likes.find_one({
            "userId": user_id,
            "recipeId": recipe["_id"]
        }) is not None
        recipe_out.isSaved = True
        result.append(recipe_out)
    
    return result

@api_router.get("/users/me/recipes", response_model=List[RecipeOut])
async def get_user_recipes(current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    recipes = await db.recipes.find({"authorId": user_id}).to_list(1000)
    
    result = []
    for recipe in recipes:
        recipe_out = recipe_doc_to_out(recipe)
        recipe_out.isLiked = await db.user_likes.find_one({
            "userId": user_id,
            "recipeId": recipe["_id"]
        }) is not None
        recipe_out.isSaved = await db.user_saves.find_one({
            "userId": user_id,
            "recipeId": recipe["_id"]
        }) is not None
        result.append(recipe_out)
    
    return result

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
