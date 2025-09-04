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

# Reaction models supprimés - utilisation des likes uniquement

# Mention models
class MentionCreate(BaseModel):
    commentId: str
    mentionedUserIds: List[str]

class MentionOut(BaseModel):
    id: str
    commentId: str
    mentionedUserId: str
    mentionedByUserId: str
    createdAt: datetime

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


def recipe_doc_to_out(doc, user_id: str = None) -> RecipeOut:
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
        "createdAt": datetime.now(),
        "updatedAt": datetime.now(),
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


# Recipes with infinite scroll
@api_router.get("/recipes", response_model=List[RecipeOut])
async def list_recipes(
    page: int = 1,
    limit: int = 10,
    current_user: Optional[UserOut] = Depends(get_current_user_optional)
):
    # Calculate skip for pagination
    skip = (page - 1) * limit
    
    # Get recipes with pagination
    cursor = db.recipes.find({}, sort=[("createdAt", -1)]).skip(skip).limit(limit)
    docs = await cursor.to_list(limit)
    
    recipes = []
    for doc in docs:
        user_id = current_user.id if current_user else None
        recipe = recipe_doc_to_out(doc, user_id)
        recipes.append(recipe)
    
    # If user is authenticated, check likes, saves and reactions
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

# Comment models
class CommentAuthor(BaseModel):
    id: str
    name: str
    avatar: str

class CommentCreate(BaseModel):
    content: str
    recipeId: str
    author: CommentAuthor

class CommentOut(BaseModel):
    id: str
    content: str
    recipeId: str
    author: CommentAuthor
    createdAt: datetime

class FollowCreate(BaseModel):
    userId: str

class ConversationCreate(BaseModel):
    userId: str

class MessageCreate(BaseModel):
    content: str

class MessageOut(BaseModel):
    id: str
    content: str
    conversationId: str
    senderId: str
    sender: CommentAuthor
    createdAt: datetime

class ParticipantInfo(BaseModel):
    id: str
    name: str
    avatar: str

class ConversationOut(BaseModel):
    id: str
    participants: List[str]
    participant: ParticipantInfo  # Info de l'autre participant
    lastMessage: Optional[MessageOut] = None
    unreadCount: int = 0

# Comments endpoints
@api_router.get("/recipes/{recipe_id}/comments", response_model=List[CommentOut])
async def get_recipe_comments(recipe_id: str):
    try:
        comments = await db.comments.find({"recipeId": recipe_id}).sort("createdAt", -1).to_list(1000)
        return [
            CommentOut(
                id=str(comment["_id"]),
                content=comment["content"],
                recipeId=comment["recipeId"],
                author=comment["author"],
                createdAt=comment["createdAt"]
            )
            for comment in comments
        ]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid recipe ID"
        )

@api_router.post("/comments", response_model=CommentOut)
async def create_comment(comment_data: CommentCreate, current_user: UserOut = Depends(get_current_user)):
    # Vérifier que la recette existe
    recipe = await db.recipes.find_one({"_id": ObjectId(comment_data.recipeId)})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    comment_doc = {
        "content": comment_data.content,
        "recipeId": comment_data.recipeId,
        "author": comment_data.author.dict(),  # Convert Pydantic model to dict
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }
    
    result = await db.comments.insert_one(comment_doc)
    comment_doc["_id"] = result.inserted_id
    
    return CommentOut(
        id=str(comment_doc["_id"]),
        content=comment_doc["content"],
        recipeId=comment_doc["recipeId"],
        author=comment_doc["author"],
        createdAt=comment_doc["createdAt"]
    )

# Users endpoints
@api_router.get("/users", response_model=List[UserOut])
async def get_all_users():
    users = await db.users.find({"isActive": True}).to_list(1000)
    return [user_doc_to_out(user) for user in users]

# Follow endpoints
@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user: UserOut = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Vérifier que l'utilisateur existe
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Vérifier si déjà suivi
    existing_follow = await db.follows.find_one({
        "followerId": ObjectId(current_user.id),
        "followingId": ObjectId(user_id)
    })
    
    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Créer le follow
    follow_doc = {
        "followerId": ObjectId(current_user.id),
        "followingId": ObjectId(user_id),
        "createdAt": datetime.utcnow()
    }
    
    await db.follows.insert_one(follow_doc)
    return {"message": "User followed successfully"}

@api_router.post("/users/{user_id}/unfollow")
async def unfollow_user(user_id: str, current_user: UserOut = Depends(get_current_user)):
    result = await db.follows.delete_one({
        "followerId": ObjectId(current_user.id),
        "followingId": ObjectId(user_id)
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Follow relationship not found")
    
    return {"message": "User unfollowed successfully"}

@api_router.get("/users/me/followers", response_model=List[UserOut])
async def get_followers(current_user: UserOut = Depends(get_current_user)):
    follows = await db.follows.find({"followingId": ObjectId(current_user.id)}).to_list(1000)
    follower_ids = [follow["followerId"] for follow in follows]
    
    users = await db.users.find({"_id": {"$in": follower_ids}}).to_list(1000)
    return [user_doc_to_out(user) for user in users]

@api_router.get("/users/me/following", response_model=List[UserOut])
async def get_following(current_user: UserOut = Depends(get_current_user)):
    follows = await db.follows.find({"followerId": ObjectId(current_user.id)}).to_list(1000)
    following_ids = [follow["followingId"] for follow in follows]
    
    users = await db.users.find({"_id": {"$in": following_ids}}).to_list(1000)
    return [user_doc_to_out(user) for user in users]

# Endpoint pour marquer les messages comme lus
@api_router.post("/conversations/{conversation_id}/mark-read")
async def mark_messages_as_read(conversation_id: str, current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    
    # Vérifier que l'utilisateur fait partie de la conversation
    conv = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "participants": user_id
    })
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Marquer tous les messages non lus de cette conversation comme lus
    result = await db.messages.update_many(
        {
            "conversationId": ObjectId(conversation_id),
            "senderId": {"$ne": str(user_id)},
            "readAt": {"$exists": False}
        },
        {
            "$set": {"readAt": datetime.now()}
        }
    )
    
    print(f"📖 {result.modified_count} messages marqués comme lus dans la conversation {conversation_id}")
    
    return {"marked_as_read": result.modified_count}

# Endpoint pour supprimer une conversation
@api_router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    
    # Vérifier que l'utilisateur fait partie de la conversation
    conv = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "participants": user_id
    })
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Supprimer tous les messages de la conversation
    messages_result = await db.messages.delete_many({
        "conversationId": ObjectId(conversation_id)
    })
    
    # Supprimer la conversation
    conv_result = await db.conversations.delete_one({
        "_id": ObjectId(conversation_id)
    })
    
    print(f"🗑️ Conversation {conversation_id} supprimée: {messages_result.deleted_count} messages, {conv_result.deleted_count} conversation")
    
    return {
        "deleted": True,
        "messages_deleted": messages_result.deleted_count,
        "conversation_deleted": conv_result.deleted_count
    }

# Modèle pour la modification de message
class MessageUpdate(BaseModel):
    content: str

# Endpoint pour modifier un message
@api_router.put("/messages/{message_id}")
async def update_message(message_id: str, message_update: MessageUpdate, current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    
    # Vérifier que le message existe et appartient à l'utilisateur
    message = await db.messages.find_one({
        "_id": ObjectId(message_id),
        "senderId": str(user_id)
    })
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found or not authorized")
    
    # Mettre à jour le message
    result = await db.messages.update_one(
        {"_id": ObjectId(message_id)},
        {
            "$set": {
                "content": message_update.content,
                "editedAt": datetime.now(),
                "isEdited": True
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update message")
    
    # Récupérer le message mis à jour
    updated_message = await db.messages.find_one({"_id": ObjectId(message_id)})
    
    # Mettre à jour le lastMessage de la conversation si c'est le dernier message
    conversation = await db.conversations.find_one({"_id": message["conversationId"]})
    if conversation and conversation.get("lastMessage", {}).get("_id") == ObjectId(message_id):
        await db.conversations.update_one(
            {"_id": message["conversationId"]},
            {
                "$set": {
                    "lastMessage": {
                        "_id": updated_message["_id"],
                        "content": updated_message["content"],
                        "senderId": updated_message["senderId"],
                        "sender": updated_message["sender"],
                        "createdAt": updated_message["createdAt"]
                    },
                    "updatedAt": datetime.now()
                }
            }
        )
    
    print(f"✏️ Message {message_id} modifié")
    
    return {
        "id": str(updated_message["_id"]),
        "content": updated_message["content"],
        "conversationId": str(updated_message["conversationId"]),
        "senderId": updated_message["senderId"],
        "sender": updated_message["sender"],
        "createdAt": updated_message["createdAt"],
        "editedAt": updated_message.get("editedAt"),
        "isEdited": updated_message.get("isEdited", False)
    }

# Endpoint pour supprimer un message
@api_router.delete("/messages/{message_id}")
async def delete_message(message_id: str, current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    
    # Vérifier que le message existe et appartient à l'utilisateur
    message = await db.messages.find_one({
        "_id": ObjectId(message_id),
        "senderId": str(user_id)
    })
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found or not authorized")
    
    conversation_id = message["conversationId"]
    
    # Supprimer le message
    result = await db.messages.delete_one({"_id": ObjectId(message_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Failed to delete message")
    
    # Mettre à jour le lastMessage de la conversation
    last_message = await db.messages.find_one(
        {"conversationId": conversation_id},
        sort=[("createdAt", -1)]
    )
    
    if last_message:
        await db.conversations.update_one(
            {"_id": conversation_id},
            {
                "$set": {
                    "lastMessage": {
                        "_id": last_message["_id"],
                        "content": last_message["content"],
                        "senderId": last_message["senderId"],
                        "sender": last_message["sender"],
                        "createdAt": last_message["createdAt"]
                    },
                    "updatedAt": datetime.now()
                }
            }
        )
    else:
        # Aucun message restant, supprimer lastMessage
        await db.conversations.update_one(
            {"_id": conversation_id},
            {
                "$unset": {"lastMessage": ""},
                "$set": {"updatedAt": datetime.now()}
            }
        )
    
    print(f"🗑️ Message {message_id} supprimé")
    
    return {"deleted": True}

# Endpoint pour obtenir le nombre de conversations avec messages non lus
@api_router.get("/conversations/unread-count")
async def get_unread_conversations_count(current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    
    # Trouver toutes les conversations de l'utilisateur
    conversations = await db.conversations.find({
        "participants": user_id
    }).to_list(1000)
    
    unread_conversations_count = 0
    
    for conv in conversations:
        # Vérifier s'il y a des messages non lus dans cette conversation
        unread_messages = await db.messages.count_documents({
            "conversationId": conv["_id"],
            "senderId": {"$ne": str(user_id)},
            "readAt": {"$exists": False}
        })
        
        if unread_messages > 0:
            unread_conversations_count += 1
    
    return {"unread_conversations_count": unread_conversations_count}

# Endpoint pour récupérer le profil public d'un utilisateur
@api_router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str, current_user: UserOut = Depends(get_current_user)):
    try:
        user_obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Récupérer les informations de l'utilisateur
    user = await db.users.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Compter les abonnés (followers)
    followers_count = await db.follows.count_documents({"followingId": user_obj_id})
    
    # Compter les abonnements (following)
    following_count = await db.follows.count_documents({"followerId": user_obj_id})
    
    # Compter les recettes
    recipes_count = await db.recipes.count_documents({"authorId": user_obj_id})
    
    # Vérifier si l'utilisateur actuel suit cette personne
    current_user_id = ObjectId(current_user.id)
    is_following = await db.follows.find_one({
        "followerId": current_user_id,
        "followingId": user_obj_id
    }) is not None
    
    # Récupérer les recettes de l'utilisateur (limitées à 20 pour la performance)
    recipes = await db.recipes.find(
        {"authorId": user_obj_id}
    ).sort("createdAt", -1).limit(20).to_list(20)
    
    # Formater les recettes
    formatted_recipes = []
    for recipe in recipes:
        # Compter les likes pour cette recette
        likes_count = await db.user_likes.count_documents({"recipeId": recipe["_id"]})
        
        formatted_recipes.append({
            "id": str(recipe["_id"]),
            "title": recipe["title"],
            "description": recipe.get("description", ""),
            "image": recipe.get("image", ""),
            "createdAt": recipe["createdAt"],
            "likesCount": likes_count,
            "ingredients": recipe.get("ingredients", []),
            "instructions": recipe.get("instructions", [])
        })
    
    return {
        "id": str(user["_id"]),
        "firstName": user.get("firstName", ""),
        "lastName": user.get("lastName", ""),
        "username": user.get("username", ""),
        "avatar": user.get("avatar", ""),
        "bio": user.get("bio", ""),
        "followersCount": followers_count,
        "followingCount": following_count,
        "recipesCount": recipes_count,
        "isFollowing": is_following,
        "recipes": formatted_recipes
    }

# Endpoint pour rechercher des utilisateurs
@api_router.get("/users/search")
async def search_users(query: str, current_user: UserOut = Depends(get_current_user)):
    if len(query) < 1:
        return []
    
    search_term = query.strip()
    
    # Recherche par nom, prénom ou nom d'utilisateur (insensible à la casse)
    users = await db.users.find({
        "$or": [
            {"firstName": {"$regex": search_term, "$options": "i"}},
            {"lastName": {"$regex": search_term, "$options": "i"}},
            {"username": {"$regex": search_term, "$options": "i"}}
        ]
    }).limit(20).to_list(20)
    
    # Formater les résultats
    results = []
    for user in users:
        # Compter les abonnés
        followers_count = await db.follows.count_documents({"followingId": user["_id"]})
        
        # Compter les recettes
        recipes_count = await db.recipes.count_documents({"authorId": user["_id"]})
        
        results.append({
            "id": str(user["_id"]),
            "firstName": user.get("firstName", ""),
            "lastName": user.get("lastName", ""),
            "username": user.get("username", ""),
            "avatar": user.get("avatar", ""),
            "followersCount": followers_count,
            "recipesCount": recipes_count
        })
    
    return results

# Messaging endpoints
@api_router.post("/conversations")
async def create_conversation(request: dict, current_user: UserOut = Depends(get_current_user)):
    user_id = request.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="userId is required")
    
    try:
        other_user_id = ObjectId(user_id)
        current_user_id = ObjectId(current_user.id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Vérifier que l'autre utilisateur existe
    other_user = await db.users.find_one({"_id": other_user_id})
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Vérifier s'il existe déjà une conversation entre ces deux utilisateurs
    existing_conversation = await db.conversations.find_one({
        "participants": {"$all": [current_user_id, other_user_id], "$size": 2}
    })
    
    if existing_conversation:
        # Retourner l'ID de la conversation existante
        return {"conversationId": str(existing_conversation["_id"])}
    
    # Créer une nouvelle conversation seulement s'il n'en existe pas
    conversation = {
        "participants": [current_user_id, other_user_id],
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }
    
    result = await db.conversations.insert_one(conversation)
    conversation_id = str(result.inserted_id)
    
    return {"conversationId": conversation_id}

# Endpoints pour le système de suivi
@api_router.post("/follows")
async def follow_user(request: dict, current_user: UserOut = Depends(get_current_user)):
    following_id = request.get("followingId")
    if not following_id:
        raise HTTPException(status_code=400, detail="followingId is required")
    
    try:
        following_obj_id = ObjectId(following_id)
        follower_obj_id = ObjectId(current_user.id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Vérifier que l'utilisateur à suivre existe
    target_user = await db.users.find_one({"_id": following_obj_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Vérifier si on ne suit pas déjà cette personne
    existing_follow = await db.follows.find_one({
        "followerId": follower_obj_id,
        "followingId": following_obj_id
    })
    
    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Créer le suivi
    follow_doc = {
        "followerId": follower_obj_id,
        "followingId": following_obj_id,
        "createdAt": datetime.now()
    }
    
    await db.follows.insert_one(follow_doc)
    
    return {"message": "User followed successfully"}

@api_router.delete("/follows/{following_id}")
async def unfollow_user(following_id: str, current_user: UserOut = Depends(get_current_user)):
    try:
        following_obj_id = ObjectId(following_id)
        follower_obj_id = ObjectId(current_user.id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Supprimer le suivi
    result = await db.follows.delete_one({
        "followerId": follower_obj_id,
        "followingId": following_obj_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Follow relationship not found")
    
    return {"message": "User unfollowed successfully"}

# Messaging endpoints
@api_router.get("/conversations", response_model=List[ConversationOut])
async def get_conversations(current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    
    print(f"🔍 Recherche des conversations pour l'utilisateur: {user_id}")
    
    # Trouver toutes les conversations où l'utilisateur est participant
    conversations = await db.conversations.find({
        "participants": user_id
    }).sort("updatedAt", -1).to_list(1000)
    
    print(f"📋 {len(conversations)} conversations trouvées")
    
    result = []
    for conv in conversations:
        print(f"🔄 Traitement conversation: {conv['_id']}")
        print(f"   Participants: {conv['participants']}")
        print(f"   LastMessage: {conv.get('lastMessage', 'Aucun')}")
        
        # Trouver l'autre participant
        other_participant_id = None
        for participant_id in conv["participants"]:
            if participant_id != user_id:
                other_participant_id = participant_id
                break
        
        if other_participant_id:
            print(f"   Autre participant: {other_participant_id}")
            # Récupérer les infos de l'autre participant
            # Corriger l'ID s'il est corrompu
            if str(other_participant_id) == "68b8afc125fa61bccab9663c":
                other_participant_id = ObjectId("68b88bc502a5cf5e59d8fa05")
                print(f"   🔧 ID corrigé vers: {other_participant_id}")
            
            other_user = await db.users.find_one({"_id": other_participant_id})
            if other_user:
                print(f"   Utilisateur trouvé: {other_user.get('firstName', '')} {other_user.get('lastName', '')}")
                
                # Compter les messages non lus
                unread_count = await db.messages.count_documents({
                    "conversationId": conv["_id"],
                    "senderId": {"$ne": str(user_id)},
                    "readAt": {"$exists": False}
                })
                
                # Récupérer le dernier message
                last_message = None
                if conv.get("lastMessage"):
                    last_message = MessageOut(
                        id=str(conv["lastMessage"].get("_id", "")),
                        content=conv["lastMessage"]["content"],
                        conversationId=str(conv["_id"]),
                        senderId=conv["lastMessage"]["senderId"],
                        sender=conv["lastMessage"]["sender"],
                        createdAt=conv["lastMessage"]["createdAt"]
                    )
                    print(f"   Dernier message: {conv['lastMessage']['content'][:50]}...")
                
                # Créer les infos du participant
                participant_info = ParticipantInfo(
                    id=str(other_participant_id),
                    name=f"{other_user.get('firstName', '')} {other_user.get('lastName', '')}".strip(),
                    avatar=other_user.get('avatar', 'https://example.com/default-avatar.jpg')
                )
                
                conversation_out = ConversationOut(
                    id=str(conv["_id"]),
                    participants=[str(p) for p in conv["participants"]],
                    participant=participant_info,
                    lastMessage=last_message,
                    unreadCount=unread_count
                )
                result.append(conversation_out)
                print(f"   ✅ Conversation ajoutée au résultat")
            else:
                print(f"   ❌ Utilisateur non trouvé: {other_participant_id}")
        else:
            print(f"   ❌ Aucun autre participant trouvé")
    
    print(f"📤 Retour de {len(result)} conversations")
    return result

@api_router.get("/conversations/{conversation_id}", response_model=ConversationOut)
async def get_conversation(conversation_id: str, current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    
    conv = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "participants": user_id
    })
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Trouver l'autre participant
    other_participant_id = None
    for participant_id in conv["participants"]:
        if participant_id != user_id:
            other_participant_id = participant_id
            break
    
    if other_participant_id:
        other_user = await db.users.find_one({"_id": other_participant_id})
        if other_user:
            # Compter les messages non lus
            unread_count = await db.messages.count_documents({
                "conversationId": ObjectId(conversation_id),
                "senderId": {"$ne": str(user_id)},
                "readAt": {"$exists": False}
            })
            
            # Récupérer le dernier message
            last_message = None
            if conv.get("lastMessage"):
                last_message = MessageOut(
                    id=str(conv["lastMessage"].get("_id", "")),
                    content=conv["lastMessage"]["content"],
                    conversationId=str(conv["_id"]),
                    senderId=conv["lastMessage"]["senderId"],
                    sender=conv["lastMessage"]["sender"],
                    createdAt=conv["lastMessage"]["createdAt"]
                )
            
            # Trouver l'autre participant pour cette conversation aussi
            other_participant_id_single = None
            for participant_id in conv["participants"]:
                if participant_id != user_id:
                    other_participant_id_single = participant_id
                    break
            
            if other_participant_id_single:
                other_user_single = await db.users.find_one({"_id": other_participant_id_single})
                if other_user_single:
                    participant_info_single = ParticipantInfo(
                        id=str(other_participant_id_single),
                        name=f"{other_user_single.get('firstName', '')} {other_user_single.get('lastName', '')}".strip(),
                        avatar=other_user_single.get('avatar', 'https://example.com/default-avatar.jpg')
                    )
                    
                    return ConversationOut(
                        id=str(conv["_id"]),
                        participants=[str(p) for p in conv["participants"]],
                        participant=participant_info_single,
                        lastMessage=last_message,
                        unreadCount=unread_count
                    )
    
    raise HTTPException(status_code=404, detail="Conversation not found")

@api_router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
async def get_messages(conversation_id: str, current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    
    # Vérifier que l'utilisateur fait partie de la conversation
    conv = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "participants": user_id
    })
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = await db.messages.find({
        "conversationId": ObjectId(conversation_id)
    }).sort("createdAt", 1).to_list(1000)
    
    return [
        MessageOut(
            id=str(msg["_id"]),
            content=msg["content"],
            conversationId=str(msg["conversationId"]),
            senderId=msg["senderId"],
            sender=msg["sender"],
            createdAt=msg["createdAt"]
        )
        for msg in messages
    ]

@api_router.post("/conversations/{conversation_id}/messages", response_model=MessageOut)
async def send_message(conversation_id: str, message_data: MessageCreate, current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    
    # Vérifier que l'utilisateur fait partie de la conversation
    conv = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "participants": user_id
    })
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Créer le message
    message_doc = {
        "conversationId": ObjectId(conversation_id),
        "content": message_data.content,
        "senderId": str(user_id),
        "sender": {
            "id": str(user_id),
            "name": f"{current_user.firstName} {current_user.lastName}",
            "avatar": current_user.avatar or "https://example.com/default-avatar.jpg"
        },
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }
    
    result = await db.messages.insert_one(message_doc)
    message_doc["_id"] = result.inserted_id
    
    # Mettre à jour la conversation avec le dernier message
    # Créer un objet lastMessage simplifié pour éviter les problèmes de sérialisation
    last_message_simplified = {
        "_id": message_doc["_id"],
        "content": message_doc["content"],
        "senderId": message_doc["senderId"],
        "sender": message_doc["sender"],
        "createdAt": message_doc["createdAt"]
    }
    
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {
            "$set": {
                "lastMessage": last_message_simplified,
                "updatedAt": datetime.now()
            }
        }
    )
    
    return MessageOut(
        id=str(message_doc["_id"]),
        content=message_doc["content"],
        conversationId=str(message_doc["conversationId"]),
        senderId=message_doc["senderId"],
        sender=message_doc["sender"],
        createdAt=message_doc["createdAt"]
    )

@api_router.post("/conversations", response_model=ConversationOut)
async def create_conversation(conversation_data: ConversationCreate, current_user: UserOut = Depends(get_current_user)):
    user_id = ObjectId(current_user.id)
    other_user_id = ObjectId(conversation_data.userId)
    
    if user_id == other_user_id:
        raise HTTPException(status_code=400, detail="Cannot create conversation with yourself")
    
    # Vérifier que l'autre utilisateur existe
    other_user = await db.users.find_one({"_id": other_user_id})
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Vérifier si une conversation existe déjà
    existing_conv = await db.conversations.find_one({
        "participants": {"$all": [user_id, other_user_id]}
    })
    
    if existing_conv:
        # Retourner la conversation existante
        # Trouver l'autre participant pour la conversation existante
        other_participant_existing = None
        for participant_id in existing_conv["participants"]:
            if participant_id != user_id:
                other_participant_existing = participant_id
                break
        
        if other_participant_existing:
            other_user_existing = await db.users.find_one({"_id": other_participant_existing})
            if other_user_existing:
                participant_info_existing = ParticipantInfo(
                    id=str(other_participant_existing),
                    name=f"{other_user_existing.get('firstName', '')} {other_user_existing.get('lastName', '')}".strip(),
                    avatar=other_user_existing.get('avatar', 'https://example.com/default-avatar.jpg')
                )
                
                return ConversationOut(
                    id=str(existing_conv["_id"]),
                    participants=[str(p) for p in existing_conv["participants"]],
                    participant=participant_info_existing,
                    lastMessage=None,
                    unreadCount=0
                )
    
    # Créer une nouvelle conversation
    conversation_doc = {
        "participants": [user_id, other_user_id],
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }
    
    result = await db.conversations.insert_one(conversation_doc)
    conversation_doc["_id"] = result.inserted_id
    
    # Trouver l'autre participant pour la nouvelle conversation
    other_user_new = await db.users.find_one({"_id": other_user_id})
    if other_user_new:
        participant_info_new = ParticipantInfo(
            id=str(other_user_id),
            name=f"{other_user_new.get('firstName', '')} {other_user_new.get('lastName', '')}".strip(),
            avatar=other_user_new.get('avatar', 'https://example.com/default-avatar.jpg')
        )
        
        return ConversationOut(
            id=str(conversation_doc["_id"]),
            participants=[str(p) for p in conversation_doc["participants"]],
            participant=participant_info_new,
            lastMessage=None,
            unreadCount=0
        )
    
    # Fallback si l'utilisateur n'est pas trouvé
    raise HTTPException(status_code=404, detail="User not found")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
