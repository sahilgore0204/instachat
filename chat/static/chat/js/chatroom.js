var startPoint='ws://';
             if(window.location.protocol == 'https:'){
                 // changing to a secure protocol
                 startPoint='wss://';
             }

             //creating socket at the mentioned url
             //this connection is routed to appropriate class present in consumers.py file by routing.py file
             var meetName=document.getElementById('meet').textContent;
             var ownerName=document.getElementById('owner').textContent
             var userName=document.getElementById('user').textContent;
             const chatsoc = new WebSocket(startPoint+window.location.host+'/ws/chat/'+meetName+'/'+ownerName+'/');

             $('#input2').on('click',function(){
              var msg=$('#input1').val();
              if (msg=='')
              return
              chatsoc.send(JSON.stringify({'msg':userName+': '+msg,
                      'action':'new-msg',
               }));
              $('#input1').val('');
             });


             chatsoc.onmessage=function(e){
               data=JSON.parse(e.data);
               msg=data['msg'];
               document.querySelector('#messages').innerHTML+='<div class="msg">'+ msg +'</div><br>';
             };


             $('#input1').on('keyup',function(e){
              if(e.keyCode==13){
                  $('#input2').click();
              }
             });


             var owner=$('#owner').text();
             var meet=$('#meet').text();


             $('#meet-btn').on('click',()=>{
                 window.location.pathname='/'+owner+'/'+meet+'/meet/';
             });


             $('#index-btn').on('click',()=>{
                 window.location='/';
             });
