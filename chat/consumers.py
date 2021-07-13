from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .models import Messages,Meeting
from asgiref.sync import sync_to_async
from django.dispatch.dispatcher import receiver

# This file is for web socket related stuff
# The ChatUser class handles everything related to websockets, whether it is related to chat or video
# It has several event based methods which are triggered when the event occurs
# It takens help of 'action' key to decide the further logic
# It act as a signalling server for video-chat functionality
# please visit https://channels.readthedocs.io/en/stable/ for more information

class ChatUser(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name=self.scope['url_route']['kwargs']['meetname']+self.scope['url_route']['kwargs']['ownername']
        self.room_group_name='chat_'+str(self.room_name)
        #group is created and whichever user connects is added to that particular group
        await self.channel_layer.group_add(self.room_group_name,self.channel_name)
        await self.accept()
    async def disconnect(self):
        #user is removed from the group when he disconnects
        await self.channel_layer.group_discard(self.room_group_name,self.channel_name)
    async  def receive(self, text_data):
        #triggered when it receives the data
        data=json.loads(text_data)
        action=data['action']
        #depending on 'action' key further logic is decided
        if (action=='new-offer') or (action=='new-answer'):
            receiver_channel_name=data['msg']['receiver_channel_name']
            data['msg']['receiver_channel_name']=self.channel_name
            #message is only send to user whose channel name==receiver_channel_name
            await self.channel_layer.send(
                receiver_channel_name,
                {
                    'data':data,
                    'type':'send_back'
                }
            )
            return
        if action=='new-msg':
            msg=data['msg']
            #chat message stored in database
            await sync_to_async(Messages(msg=msg,Meeting=self.room_name).save)()
            #msg is send to all the users
            await self.channel_layer.group_send(self.room_group_name,{
            'msg':msg,
            'action':'new-msg',
            'type':'send_back1'
            })
            return
        data['msg']['receiver_channel_name']=self.channel_name
        await self.channel_layer.group_send(self.room_group_name,{
            'data':data,
            'type':'send_back'
        })
    async def send_back(self,e):
        data=e['data']
        await self.send(text_data=json.dumps(data))
    async def send_back1(self,e):
        msg=e['msg']
        action=e['action']
        await self.send(text_data=json.dumps({
            'msg':msg,
            'action':action,
        }))
   