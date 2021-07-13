// Logic that is followed to implement the video-calling functionality:
//     1) Whenever a new user joins he/she is connected to socket

//     2) new user expresses his willingness to form a p2p connection by sending a message to all the existing users 
//        with a key 'action'='new-peer'

//     3) Existing users receives this message,each one of them creates a offer sdp and then send it to the new user

//     4) new user receives the offer-sdp from all existing users,it then creates an answer-sdp and send it to all 
//        existing users

//     5) Backend/frontend logic is implemented in such a way,that offer-sdp's is only received by 
//        new-user, and answer-sdp is only received by a existing user,for whom it was meant to be.

//     6) In this fashion exchange of sdp's takes place and the local and remote description are set

//     7) In this way p2p connections are established creating a p2p mesh,video/audio are streamed through 
//        this p2p connections

//     8) p2p connection is not used to implement chat functionality,it is done by web sockets

//     9) stun/turn servers are not been used,so make sure you are on the same LAN   






var toggleAudio=document.querySelector('#toggle-audio');
var toggleVideo=document.querySelector('#toggle-video');
var videoElement=document.querySelector('#localVideo');
var mapUserToPeer={}; //a js object which stores remote peers along with the associated peer connection

var localstream=new MediaStream();//store audio and video tracks of user

const constraints={
    'video':true,
    'audio':true
};
async function asynctosync(){
    const userMedia= await navigator.mediaDevices.getUserMedia(constraints); //gets user media consisting of audio,video
    return userMedia; //return a promise
}
asynctosync().then(function(stream){
    //this method is triggered when user media is gathered successfully
    //console.log('local stream created successfully');
    localstream=stream;
    videoElement.srcObject=localstream; //user media is added to the html video element
    videoElement.muted=true;
    audioTracks=stream.getAudioTracks();
    videoTracks=stream.getVideoTracks();
    audioTracks[0].enabled=true;
    videoTracks[0].enabled=true;
    toggleAudio.addEventListener('click',()=>{
      audioTracks[0].enabled=!audioTracks[0].enabled;
      if(audioTracks[0].enabled){
          toggleAudio.innerHTML='Mute';
      }
      else{
          toggleAudio.innerHTML='UnMute'
      }
    });


    toggleVideo.addEventListener('click',()=>{
        videoTracks[0].enabled=!videoTracks[0].enabled;
        if(videoTracks[0].enabled){
            toggleVideo.innerHTML='Video Of';
        }
        else{
            toggleVideo.innerHTML='Video On';
        }
      });


}).catch(function(err){
    //this method is triggered when a problem is caused in gathering user media
   //console.log(err);
}).finally(()=>{
    //it will be called irrespective of whether the user media promise resolves or rejects
    var startPoint='ws://';
    var userName=document.getElementById('username').textContent,meetName=document.getElementById('meetname').textContent;
    var ownerName=document.getElementById('owner').textContent;
    if(window.location.protocol == 'https:'){
        //making connection secure
        startPoint='wss://';
    }
    var endPoint=startPoint+window.location.host+'/ws/chat/'+meetName+'/'+ownerName+'/';
    //console.log(endPoint)
    const socket=new WebSocket(endPoint); //web socket connection is made,which is captured by routing.py file and routed to appropriate consumer(class) in consumer.py

    function sendSignal(action,msg){
        //whenever i want to send data to socket,i call this method with appropriate parameters,done to avoid repetitions
        data=JSON.stringify({
            'peer':userName,
            'action':action,
            'msg':msg
        })
        //the action key is used by backend as well as frontend to decide what do do further
        
        
        socket.send(data);
    }
    socket.addEventListener('open',() => {
      //triggered when socket is open
      //console.log('socket connected');

      //new user is connected and sends it willingness to form a connection
      sendSignal('new-peer',{});
    });
    socket.addEventListener('error',(error) => {
        //triggered when error occurs in connecting to socket
        //console.log('Error occured',error);
    });
    socket.addEventListener('close',() => {
        //triggered when connection close
        //console.log('disconnected');
    });
    socket.addEventListener('message',(event) => {
        //triggered when socket receives a message
        data=JSON.parse(event.data);
        msg=data['msg'];
        //depending upon action key,different things are done by the code
        action=data['action']
        if(action=='new-msg'){
            //action=='new-msg' means socket has received new chat message.
            msgList=document.getElementById('msg-list');
            newMsg=document.createElement('div');
            lineBreak=document.createElement('br');
            newMsg.className='msg'
            newMsg.innerHTML=msg;
            msgList.appendChild(newMsg);
            msgList.appendChild(lineBreak);
            return;
        }
        peerUserName=data['peer']
        receiver_channel_name=msg['receiver_channel_name'] //receiver chhannel name helps in selectively sending data
                                                           //as discussed in point % of logic
        if(peerUserName==userName){
        return;
        }
        if(action == 'new-peer'){
        //action=='new-peer' means a new user want to establish a peer-to-peer connection with all the existing users
        
        //this messages is received by all existing users and the create a offer
        createOfferer(peerUserName,receiver_channel_name);
        return;
        }
        if(action=='new-offer'){
            //action=='new-offer' means the existing users have send their offer-sdp's to new user,socket will deliver this message only to new user(this logic is handles in the backend)

            //this message is received by new user and now it proceeds to create a answer
            offer=data['msg']['sdp'];
            createAnswer(offer,peerUserName,receiver_channel_name);
            return;
        }
        if(action=='new-answer'){
            //action=='new-answer' means new user has send its answer-sdp to all the existing users
            answer=data['msg']['sdp'];
            peer=mapUserToPeer[peerUserName][0];
            peer.setRemoteDescription(answer);
            //console.log('remote description successfully');
            return;
        }
    });
    
    //chat functionality begins
    var msgInput=$('#send-msg-input');
    var msgBtn=$('#send-msg-btn');

    msgBtn.on('click',()=>{
        var msg=msgInput.val();
        if(msg=='')
        return;
        msg=userName+': '+msg;
        sendSignal('new-msg',msg);
    });

    msgInput.on('keyup',(event)=>{
        if(event.keyCode==13){
            msgBtn.click();
        }
    });


    //chat functionality ends


    function createOfferer(peerUserName,receiver_channel_name){
        var peer = new RTCPeerConnection(null); // a webRTC api used to create,handle,close p2p connection

        addTracks(peer); // audio/video tracks are added to peer for streaming

        var dataChannel =peer.createDataChannel('Channel');// a data channel is created,which can be used for traansferring
                                                           //data

        dataChannel.addEventListener('open',() => {
            //console.log('Rtc channel connection opened');
        })

        dataChannel.addEventListener('message',event => {
            //console.log('msg received');
            //dummy code begins
            msg=event.data;
            chatBox=document.querySelector('#chat-box');
            chatElement=document.createElement('div');
            chatElement.id='msg';
            chatElement.textContent=msg;
            chatBox.appendChild(chatElement);
            //dummy code ends
        });


        mapUserToPeer[peerUserName]=[peer,dataChannel];//information about connection is stored so it can be used further

        var remoteVideo=createVideo(peerUserName,receiver_channel_name);//a video element is created to display video of remote peer

        addTrackToRemoteVideo(remoteVideo,peer); // audio/video tracks are added to it

        peer.addEventListener('connectionstatechange',()=>{
        //this method is triggered when their is change in connection at any end of p2p connection

         var iceConnectionState=peer.iceConnectionState;// returns the connection state

         //console.log(iceConnectionState);

         //when there is something wrong with the connection we have to close it as well as delete video element
         if(iceConnectionState=='disconnected' || iceConnectionState=='closed' || iceConnectionState=='failed'){
             delete mapUserToPeer[peerUserName];
             if(iceConnectionState=='disconnected' || iceConnectionState=='failed'){
                 //deleting remote video element
                 removeRemoteVideo(remoteVideo);

                 // closing peer connection
                 peer.close();
             }
         }
        });


        peer.addEventListener('icecandidate',(event)=>{
            //whenever a p2p connection is forming,ice candidates are gathered
            //we have to send offer/answer sdps only after gathering of all ice candidates is completed
            if(event.candidate){
                //console.log('Candidate Gathered',JSON.stringify(peer.localDescription));
            }
            else{
                //sending offer
                sendSignal('new-offer',{
                    'sdp':peer.localDescription,
                    'receiver_channel_name':receiver_channel_name
                });
            }
        });

        peer.createOffer()
        .then(offer => {
            //setting local description of p2p connection
            // remote description will be set when user receives answer sdp
            peer.setLocalDescription(offer);
        })
        .then(()=>{

            //console.log('Local Description set successfully');
        })
    }
    
    function createAnswer(offer,peerUserName,receiver_channel_name){

        //most of the methods in this function are same as createOfferer() function
        // their documention is already written in createOfferer() function

        var peer = new RTCPeerConnection(null);
        addTracks(peer);
        peer.addEventListener('datachannel',(event) => {
            peer.dc=event.channel;
            mapUserToPeer[peerUserName]=[peer,peer.dc];
            peer.dc.addEventListener('open',() => {
            //console.log('Rtc channel connection opened');
        });
        peer.dc.addEventListener('message',event => {
            //console.log('msg received');
            msg=event.data;
            chatBox=document.querySelector('#chat-box');
            chatElement=document.createElement('div');
            chatElement.id='msg';
            chatElement.textContent=msg;
            chatBox.appendChild(chatElement);
        });
        });
        var remoteVideo=createVideo(peerUserName,receiver_channel_name);
        addTrackToRemoteVideo(remoteVideo,peer);
        peer.addEventListener('connectionstatechange',()=>{
         var iceConnectionState=peer.iceConnectionState;
         //console.log(iceConnectionState);
         if(iceConnectionState=='failed' || iceConnectionState=='disconnected' || iceConnectionState=='closed'){
             delete mapUserToPeer[peerUserName];
             if(iceConnectionState=='failed' || iceConnectionState=='disconnected'){
                 removeRemoteVideo(remoteVideo);
                 peer.close();
             }
         }
        });
        peer.addEventListener('icecandidate',(event)=>{
            if(event.candidate){
                //console.log('Candidate Gathered',JSON.stringify(peer.localDescription));
            }
            //after gathering all ice candidates new user send answer sdp
            else{
                sendSignal('new-answer',{
                    'sdp':peer.localDescription,
                    'receiver_channel_name':receiver_channel_name
                });
            }
        });

        // remote description of new user is set first as we have already offer
        peer.setRemoteDescription(offer)
        .then(()=>{
            //console.log('Remote Description set successfully');
            //answer sdp is created and it will be set as local description of new-user
            return peer.createAnswer();
        })
        .then((answer)=> {
            //local description set
            peer.setLocalDescription(answer);
            //console.log('local description set successfully');
        })
    }

    //function to add audio/video tracks to RTCPeerConnection
    function addTracks(peer){
        localstream.getTracks().forEach(track => {
        //console.log(userName);
        peer.addTrack(track,localstream);
        });
    }

    //function to create a video element to show video of remote peer
    function createVideo(peerUserName,receiver_channel_name){
        var videoContainer=document.querySelector('#video-container');
        var videoWrapper=document.createElement('div');
        var videoName=document.createElement('div');
        videoName.innerHTML=peerUserName;
        videoName.className='name';
        var remoteVideoElement=document.createElement('video');
        remoteVideoElement.id=peerUserName;
        remoteVideoElement.className='UserVideo';
        remoteVideoElement.autoplay=true;
        videoWrapper.className='videoWrapper';
        videoWrapper.appendChild(videoName);
        videoWrapper.appendChild(remoteVideoElement);
        videoContainer.appendChild(videoWrapper);
        return remoteVideoElement;
    }

    // function to add audio.video tracks to remote video element
    function addTrackToRemoteVideo(remoteVideo,peer){
        var remoteStream=new MediaStream();
        remoteVideo.srcObject=remoteStream;
        peer.addEventListener('track',async (event)=>{
        //console.log(userName);
        remoteStream.addTrack(event.track,remoteStream);
        });
    }
    
    //function to delete remote video element when remote is disconnected or anything wrong happens
    function removeRemoteVideo(remoteVideo){
        var parent=document.querySelector('#video-container');
        var videoWrapper=remoteVideo.parentNode;
        parent.removeChild(videoWrapper);
        return;
    }

  //end of the logic
    
});