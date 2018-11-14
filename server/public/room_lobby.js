
// SELECT * FROM COMPANY LIMIT 3 OFFSET 2

var socket = undefined



function getsocket(){
    socket = undefined
    while(true){ 
        try{ 
            socket = io(); 
            break; 
        }catch(e){ 
        
        } 
    } 
	socket.on('nonPlayingEvent', function(msg){
	    if(msg["event_name"]=="serverResponseLogout"){
	        if(msg["result"]=="ok"){
	            //alert("允許提交註冊")

                name = String($("#username").val()).trim()
                $("#logoutName").val(name)
                $("#logoutHash").val(msg["logoutHash"])
                /*
                 <input id="loginName" name="loginName" type="hidden" />
                <input id="loginPass" name="loginPass" type="hidden" />
                */

                //console.log("回到這邊了")
                // 通知斷線，省連線資源
                socket.emit("nonPlayingEvent",{event_name:"callForDisconnect"});
	            $("#logoutForm").submit();
                
	        }else{
	            alert(msg["cause"]) // 印出不允許的原因
	        }
	    }else if(msg["event_name"]=="serverResponseRoom"){

            // 處理頁數，if 請求的是第一頁，就 把上一頁按鈕隱藏
            console.log()
            if(msg["page"]==1){
                //console.log("A pp : "+msg["page"])
                $("#lastPage").css({"display":"none"})
            }else{
                //console.log("B pp : "+msg["page"])
                $("#lastPage").css({"display":"inline"})
            }

            if(msg["hasNextPage"]){
                $("#nextPage").css({"display":"inline"})
            }else{
                $("#nextPage").css({"display":"none"})
            }

            //console.log("AAAAA : "+JSON.stringify(msg["rooms"]))
            room_arr = msg["rooms"]

            rooms = $(".room")
            //console.log(rooms.length)
            len = room_arr.length
            i=0
            $(".room").css({display:"none"})
            $(".room_name").html("")
            while(i<len){
                //rooms.eq(i).find(".room_name").html(JSON.stringify(room_arr[i]))
                //$(   (".room:eq("+i+") > .room_name") )  .html(room_arr[i]["room_id"])
                 //$((".room:eq("+i+") > .room_name")) .html("XXXXXX")
                 $(".room").eq(i).find(".room_name").html(room_arr[i]["room_id"])
                 //console.log($(   (".room:eq("+i+")> .room_name") ))
                $(".room").eq(i).css({display:"inline"})
                ++i
            }
        }else if(msg["event_name"]=="serverResponseCreateRoom"){
            if(msg["result"]=="ok"){

                //alert("允許開房")
                name = String($("#username").val()).trim()
                $("#createRoomName").val(name)
                $("#createRoomHash").val(msg["createRoomHash"])


                //$("#createRoomForm").submit();
                $.ajax({
				        type: "POST",
					    url: "/createRoom",
					    dataType: "json",
                        data: {
                            createRoomName:name,
                            createRoomHash:msg["createRoomHash"],
                        },
					    success: function(data) {
						    if (data) {
                                //alert(data)
                                obj=Object()
                                obj["event_name"] = "requestJoinRoom"
                                obj["user"]=String($("#username").val())
                                obj["room_name"] = data["join_room_id"]
                                try{
                                    socket.emit("nonPlayingEvent",obj)
                                }catch(e){

                                    socket=undefined
                                    alert("網路問題，無法進行加入房間動作")
                                }                       
                            }
					    },
					    error: function(jqXHR) {
                            alert("發生錯誤")
                             //$("#search_message").html("<h1>發生錯誤: " + JSON.stringify(jqXHR)+"</h1>")
					    }
				})  
            }else{
	            alert(msg["cause"]) // 印出不允許的原因
	        }
        }
        else if(msg["event_name"]=="serverResponseAnotherPage"){
            if(msg["result"]=="ok"){
                // 先把所有房間名稱清空
                $(".room_name").html("")
                // 先把所有房間都弄成不顯示
                $(".room").css({"display":"none"})


                new_room_arr = msg["newrooms"]

                rooms = $(".room")
                //onsole.log(rooms.length)
                len = room_arr.length
                i=0
                $(".room").css({display:"none"})
                $(".room_name").html("")

                // 更新顯示頁數
                $("#page").html(String(msg["newpage"]))

                // 更新顯示的房間
                while(i<len){
                    $(".room").eq(i).find(".room_name").html(room_arr[i]["room_id"])
                    $(".room").eq(i).css({display:"inline"})
                    ++i
                }

                //更新顯示，是否有上一頁or下一頁按鈕
                if(msg["hasLastPage"]){
                    $("#lastPage").css({"display":"inline"})
                }else{
                    $("#lastPage").css({"display":"none"})
                }

                if(msg["hasNexyPage"]){
                    $("#nextPage").css({"display":"inline"})
                }else{
                    $("#nextPage").css({"display":"none"})
                }

            }else{
                if(obj["way"]){ // 代表此頁，已無法按下
                
                    if(obj["way"]=="next"){
                        $("#nextPage").css({"display":"none"})
                    }else if(obj["way"]=="last"){
                        $("#lastPage").css({"display":"none"})
                    }else{

                    }
                }
	            alert(msg["cause"]) // 印出不允許的原因
	        }
        }
        else if(msg["event_name"]=="serverResponseJoinRoom"){
            if(msg["result"]=="ok"){
                name = String($("#username").val()).trim()
                room_name = msg["join_room_id"]
                //user = String($("#username").val())
                //alert("S room_name : "+room_name)
                $("#joinRoomName").val(name) // 人的name
                $("#joinRoomId").val(room_name) // 房間 name
                $("#joinRoomHash").val(msg["joinRoomHash"])
                $("#joinRoomForm").submit();
            }else{
	            alert(msg["cause"]) // 印出不允許的原因
	        }
        }
        // 回報，使用者是否在線，若不在線，就強制登出
        else if(msg["event_name"]=="serverResponseCheckOnline"){
            console.log("Check User Online : "+msg["isOnline"])
            if(!msg["isOnline"]){
                location.href="/login"
            }
        }
        // Server 通知，可以開始遊戲了
        else if(msg["event_name"]=="serverResponseCheckOnline"){

        }

	})
}
getsocket()

function tickGetRooms(){
    
    if(!socket){
        getsocket()
    }
    
    try{
        //console.log("CCCC")
        socket.emit("nonPlayingEvent",{user:$("#username").val(),event_name:"checkOnline"})
        
        //console.log("DDD : "+$("#page").html())
        pagenum = parseInt($("#page").html())
        //請求目前新的房間數
        socket.emit("nonPlayingEvent",{event_name:"requestRoom",page:pagenum})
    }catch(e){

        socket=undefined
        console.log("網路問題，無法取得room")
    }
}

function getAnotherPage(){
    // way 方向
    way = String($(this).prop("id"))
    newPage = 0
    waystr = " "
    if(way=="nextPage"){ // 下一頁按鈕
        newPage = parseInt($("#page").html())+1
        waystr = "next"
    }else if(way=="lastPage"){ // 上一頁按鈕
        newPage = parseInt($("#page").html())-1
        waystr = "last"
    }else{
        return
    }

    obj = Object()
    obj["event_name"] = "requestAnotherPage"
    obj["way"] = waystr
    obj["newpage"] = newPage
    socket.emit("nonPlayingEvent",obj)

}

function clickJoinRoom(){
    // 抓到房間名稱了
    room_name = $(this).parent().prev(".room_name").eq(0).html()
    
    user = String($("#username").val())

    if(!socket){
        getsocket()
    }
        
   
    obj=Object()
    obj["event_name"] = "requestJoinRoom"
    obj["user"]=user
    obj["room_name"] = room_name
    try{
        socket.emit("nonPlayingEvent",obj)
    }catch(e){

        socket=undefined
        alert("網路問題，無法進行加入房間動作")
    }  

    //alert(room_name)
}


$(function(){
    setInterval(tickGetRooms,1000)
    
    //登出按鈕
    $("#signout").click(function(){
        //alert("CCC")

        if(!socket){
            getsocket()
        }

        try{
            socket.emit("nonPlayingEvent",{user:$("#username").val(),event_name:"requestLogout"})  
        }catch(e){

            socket=undefined
            alert("網路問題，無法進行登出")
        }  
    })

    $(".inroom").css({maxHeight:"300px"})
    $(".room").css({maxHeight:"300px"})
    // 在 加入room鍵上的特效
    $(".iconth").css("font-size","90px")
    $(".iconth").hover(function(){
        
        $(this).css("font-size","100px");
    },function(){
        
        $(this).css("font-size","90px");
    });


    //新開房間按鈕
    $("#create_new_room").click(function(){
        obj = Object()
        obj["user"] = $("#username").val()
        obj["event_name"] = "requestCreateRoom"
        obj["isCreateRoom"] = true
        if(!socket){
            getsocket()
        }

        try{
            socket.emit("nonPlayingEvent",obj)  
        }catch(e){

            socket=undefined
            alert("網路問題，無法進行登出")
        }  
    })
    
    // 換頁按鈕，上一頁下一頁
    $("#nextPage").click(getAnotherPage)
    $("#lastPage").click(getAnotherPage)


    //設置 click 加入房間用的函示
    $(".iconth").click(clickJoinRoom)

    // 測試，讓 user 被登出，會自動被偵測到
    $("#test2").click(function(){
        socket.emit("nonPlayingEvent",{event_name:"test2",user:$("#username").val()})  
    })
})

/*
$(function(){
    // 定時更新現有的房間
    setInterval(tickGetRooms,1500)

    

})
*/