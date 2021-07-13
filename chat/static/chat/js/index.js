

createBtn=document.getElementById('create-meeting-btn');
         formContent3=document.getElementById('form-content-3');
         formContent1=document.getElementById('form-content-1');
         userName=document.getElementById('username').value;
         createBtn.addEventListener('click',()=>{
             toggleDisplay(formContent1);
         });
         function toggleDisplay(visible){
          formContent3.style.display="none";
          visible.style.display="flex";
         }

         $('#create-meet-submit-btn').on('click',()=>{
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            meetName=$('#meetname').val();
            if(meetName=='')
            return;

            // when a user types a name of the meeting he want to createImageBitmap,ajax request is made to Server 
            // which return url for the meeting


            //the urls are routed to their specific views in views.py file through url.py

            $.ajax({url: "/createmeet/", 
            type:'POST',
            headers: {'X-CSRFToken': csrftoken},
            data:{
              'meetname':meetName,
            },
            success: function(result){
            formContent1.style.display="none";
            $('#meetname').val('');
            if(result.length == 1){
            formContent3.style.display="flex";
            $("#form-content-3").html(result[0]);
            return;
            }
            var meetUrl=window.location.protocol+'//'+window.location.host+result[0];
            formContent3.style.display="flex";
            $("#form-content-3").html('Url for meeting '+result[1] + ' is '+meetUrl);
            var anchor=document.createElement('a');
            anchor.href=result[0];
            anchor.innerHTML=result[1];
            var par=document.createElement('p');
            par.appendChild(anchor);
            document.getElementById('list1').appendChild(par);
            document.getElementById('list1').style.display='block';
            }});
         });


         function addLink(list,x){
             if(x){
                 var par=document.createElement('p');
                 var anchor=document.createElement('a');
                 anchor.href=x[0];
                 anchor.innerHTML=x[1];
                 par.appendChild(anchor);
                 list.appendChild(par);
             }
         }


         document.getElementById('listexpand').addEventListener('click',()=>{
           var display1=document.getElementById('list1').style.display;
           var display2=document.getElementById('list2');

           if(display1 == 'none'){
            document.getElementById('list1').innerHTML='<strong>Created</strong>';
            display2.innerHTML='<strong>Joined</strong>';
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            //ajax request is made to retrieve the meetings that the user created and join
            //It is done so there is no need to ask for urls again and again

            $.ajax({url: "/retrieveinfo/", 
            type:'POST',
            headers: {'X-CSRFToken': csrftoken},
            data:{
              'username':userName,
            },
            success: function(result){
            createList=result['created'];
            joinedList=result['joined'];
            for(x in createList){
              var list=document.getElementById('list1');
              if(createList[x].length)
              addLink(list,createList[x]);
            }
            
            for(x in joinedList){
               var list=document.getElementById('list2');
               if(joinedList[x].length)
               addLink(list,joinedList[x]);
            }

            }});

            
            document.getElementById('list1').style.display='block';
            display2.style.display='block';
           }
           else{
            document.getElementById('list1').innerHTML='';
            display2.innerHTML='';
            document.getElementById('list1').style.display='none';
            display2.style.display='none';
           }
         });




         meetname.addEventListener('keydown',(event)=>{

            if(event.keyCode === 13){
                event.preventDefault();
            }
         });

         document.getElementById('meetname').addEventListener('keyup',(event)=>{
            if(event.keyCode==13){
                document.getElementById('create-meet-submit-btn').click();
            }
         });
