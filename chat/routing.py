from django.urls import path
from . import consumers

# This file routes web socket urls to their respective cunsumers(views) present in consumers.py file
# please visit https://channels.readthedocs.io/en/stable/ for more information

wurl_patterns=[
    path('ws/chat/<slug:meetname>/<slug:ownername>/',consumers.ChatUser.as_asgi()),
]