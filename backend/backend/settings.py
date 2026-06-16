"""
Django settings — production-ready.
Sozlamalar muhit o'zgaruvchilari (.env) orqali boshqariladi.
Dev rejimida xavfsiz standart qiymatlar ishlatiladi.
"""

from pathlib import Path
from datetime import timedelta
import os

from dotenv import load_dotenv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# .env faylini yuklash (loyiha tubidan)
load_dotenv(BASE_DIR / ".env")


def env_bool(key, default=False):
    return os.getenv(key, str(default)).lower() in ("1", "true", "yes", "on")


def env_list(key, default=""):
    raw = os.getenv(key, default)
    return [x.strip() for x in raw.split(",") if x.strip()]


# ============ XAVFSIZLIK ============
# Production'da SECRET_KEY ni .env orqali bering. Dev uchun standart qiymat bor.
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-dev-only-CHANGE-ME-in-production-p0n4242",
)

# Production'da DEBUG=False bo'lishi shart.
DEBUG = env_bool("DEBUG", True)

# Production'da o'z domeningizni qo'ying: ALLOWED_HOSTS=api.example.com,example.com
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")


# ============ ILOVALAR ============
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "core",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # statik fayllar (prod)
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"


# ============ MA'LUMOTLAR BAZASI ============
# DATABASE_URL berilsa (masalan postgres://...), o'sha ishlatiladi.
# Aks holda dev uchun SQLite. Har bir foydalanuvchi ma'lumoti bazada
# alohida yozuvlarda saqlanadi (User, Product, Request, Conversation,
# Message, Favorite jadvallarida foreign key orqali bog'langan).
DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(DATABASE_URL, conn_max_age=600, ssl_require=env_bool("DB_SSL", False))
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# ============ PAROL VALIDATSIYA ============
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ============ XALQAROLASHTIRISH ============
LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("TIME_ZONE", "Asia/Tashkent")
USE_I18N = True
USE_TZ = True


# ============ STATIK / MEDIA FAYLLAR ============
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ============ AUTH / DRF / JWT ============
AUTH_USER_MODEL = "core.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    # Production'da so'rovlar sonini cheklash (DDoS himoyasi)
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.getenv("THROTTLE_ANON", "60/min"),
        "user": os.getenv("THROTTLE_USER", "1000/min"),
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_MIN", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": True,
}


# ============ CORS (frontend ulanishi) ============
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "")


# ============ PRODUCTION XAVFSIZLIK HEADERLARI ============
# DEBUG=False bo'lganda (ya'ni production) avtomatik yoqiladi.
if not DEBUG:
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    X_FRAME_OPTIONS = "DENY"
