from django.forms import ModelForm, fields
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

# This file provides class based forms which can be displayed on our  web page
# The CreateUser class is used as a form for user authentication
# Read more about forms here https://docs.djangoproject.com/en/3.2/topics/forms/
class CreateUser(UserCreationForm):
    class Meta:
        model=User
        fields=['username','email','password1','password2']