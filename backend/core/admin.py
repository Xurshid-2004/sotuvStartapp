from django.contrib import admin
from .models import User, Product, Request, Conversation, Message, Favorite

admin.site.register(User)
admin.site.register(Product)
admin.site.register(Request)
admin.site.register(Conversation)
admin.site.register(Message)
admin.site.register(Favorite)
