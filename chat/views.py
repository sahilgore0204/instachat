import json
from os import name
from django.http.response import HttpResponse
from django.shortcuts import redirect, render
from .models import Meeting,Messages,MeetingJoin
from django.http import JsonResponse
from django.views import View
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .forms import CreateUser
from django.contrib import messages
from django.contrib.auth import authenticate,login,logout
from django.contrib import messages
# Create your views here.

# The class based views mentioned here decide which html page to be rendered for a particular url

# All views here are login protected i.e. you have to login first then only you can proceed further.

# you can read more about views here https://docs.djangoproject.com/en/3.2/topics/http/views/

#View for home page
def index(req):
    if not req.user.is_authenticated:
        return redirect('chat:login')
    return render(req,'chat/index.html')



#view for retrieving meeting created and meetings joined by a particular user in asynchronous manner 
# using JSON/AJAX mechanism
def retrieve(req):
    if not req.user.is_authenticated:
        return redirect('chat:login')
    if not 'username' in req.POST:
        return redirect('chat:index')
    meetings=[[]]
    meetingsjoin=[[]]
    name=req.user.username
    for meet in Meeting.objects.values():
        if meet['user']==name:
            msg='/'+name+'/'+meet['name']+'/chat/'
            meetlist=[msg,meet['name']]
            meetings.append(meetlist)
    for meet in MeetingJoin.objects.values():
        if meet['User']==name:
            msg='/'+meet['owner']+'/'+meet['name']+'/chat/'
            meetlist=[msg,meet['name']]
            meetingsjoin.append(meetlist)
    return JsonResponse({
        'created':meetings,
        'joined':meetingsjoin,
    })



#view for video chat room
def room(req):
    if not req.user.is_authenticated:
        return redirect('chat:login')
    name=req.POST['name']
    room_no=req.POST['room_no']
    cntx={
        'name':name,
        'room_no':room_no
    }
    return render(req,'chat/room.html',cntx)


#view for creating a meeting and displaying its url in asynchronous manner using JSON/AJAX mechanism
def createmeet(req):
    if not req.user.is_authenticated:
        return redirect('chat:login')
    if 'meetname' not in req.POST:
        return redirect('chat:index')
    meeting_name=req.POST['meetname']
    name=req.user.username
    try:
        obj=Meeting.objects.get(name=meeting_name,user=name)
        msg=['You are not allowed to create multiple meetings with same name']
        return JsonResponse(msg,safe=False)
    except Meeting.DoesNotExist:
        Meeting(name=meeting_name,user=name).save()
        msg='/'+name+'/'+meeting_name+'/chat/'
        msglist=[msg,meeting_name]
        return JsonResponse(msglist,safe=False)


#view for login page,if user is already authenticated/logged in,redirects user to home page
#After successful login,redirects a user to the page he/she came from
class Login(View):
    def get(self,req):
        if req.user.is_authenticated:
            return redirect('chat:index')
        return render(req,'chat/login.html')
    def post(self,req):
        username=req.POST['username']
        password=req.POST['password']
        user=authenticate(req,username=username,password=password)
        if user is not None:
            login(req,user)
            return redirect('chat:index')
        messages.info(req,'Username or Pasword in wrong')
        return redirect(req.path)

#view for logout,after logout simply redirects you to login page
def Logout(req):
    logout(req)
    return redirect('chat:login')


#view for registration page
#You have to first registered yourself,then you are redirected to login page and then you have to login
#Logged in users are automatically redirected to home page
class Register(View):
    def get(self,req):
        if req.user.is_authenticated:
            return redirect('chat:index')
        form=CreateUser()
        cntx={'form':form}
        return render(req,'chat/registration.html',cntx)
    def post(self,req):
        form=CreateUser(req.POST)
        if form.is_valid():
            form.save()
            user=req.POST['username']
            messages.success(req,'Account was successfully created for '+user)
            return redirect('chat:login')
        cntx={'form':form}
        return render(req,'chat/registration.html',cntx)

#This view is called when user visits a meeting through a link
# The todo parameter tells whether to display a chat page,or a video-meet page
def enter(req,ownername,meetname,todo):
    if not req.user.is_authenticated:
        return redirect('chat:login')
    username=req.user.username
    try:
        obj=Meeting.objects.get(name=meetname,user=ownername)
    except Meeting.DoesNotExist:
        return HttpResponse('Meeting with given name doest not exits,please contact the owner of meeting')
    try:
        obj=MeetingJoin.objects.get(name=meetname,User=username,owner=ownername)
    except MeetingJoin.DoesNotExist:
        MeetingJoin(name=meetname,User=username,owner=ownername).save()
    messages=[]
    meetnamemodel=meetname+ownername
    for msg in Messages.objects.filter(Meeting=meetnamemodel).values():
        messages.append(msg['msg'])
    cntx={
        'meetname':meetname,
        'owner':ownername,
        'username':username,
        'messages':messages,
    }
    if todo=='chat':
        return render(req,'chat/chatroom.html',cntx)
    if todo=='meet':
        return render(req,'chat/room.html',cntx)
    return HttpResponse('Page you are trying to view does not exists!')


#Not so importantview.
def dummy(req):
    return HttpResponse('you are at dummy page')

#end of views