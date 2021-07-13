from os import name
from django.contrib.auth.models import User
from django.db import models
from django.db.models.base import Model

# This file is for creating class based database models, it demonstrate the Object Relational Mapping (ORM) functionality of django 
# The classes created here are then migrated to corresponding database models
# Uses dbsqlite by default
# For more information visit https://docs.djangoproject.com/en/3.2/topics/db/models/

# Meeting class stores meeeting created by a user
class Meeting(models.Model):
    name=models.CharField(max_length=100)
    user=models.CharField(max_length=100,default='None')
    def __str__(self):
        return self.name

# MeetingJoin class stores information about meeting joined by a user
class MeetingJoin(models.Model):
    name=models.CharField(max_length=100)
    User=models.CharField(max_length=100)
    owner=models.CharField(max_length=100,default='none')
    def __str__(self):
        return self.name


#Messages class stores chat messages for a particular meeting
class Messages(models.Model):
    msg=models.CharField(max_length=100)
    Meeting=models.CharField(max_length=100)
    def __str__(self):
        return self.msg
