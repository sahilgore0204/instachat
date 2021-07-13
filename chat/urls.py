from os import name
from django.urls import path
from . import views

# when a user visits particular url it is routed to the corresponding view in views.py file using the paths 
# mentioned in urlpatterns
# the views then decide what to render
# you can read more about urls here https://docs.djangoproject.com/en/3.2/topics/http/urls/


urlpatterns=[
  path('',views.index,name='index'),
  path('room/',views.room,name='room'),
  path('createmeet/',views.createmeet,name='createmeet'),
  path('login/',views.Login.as_view(),name='login'),
  path('logout/',views.Logout,name='logout'),
  path('register/',views.Register.as_view(),name='register'),
  path('<slug:ownername>/<slug:meetname>/<slug:todo>/',views.enter,name='enter'),
  path('retrieveinfo/',views.retrieve,name='retrieve'),
  path('favicon.ico/',views.dummy),
]