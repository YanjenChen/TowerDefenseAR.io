

var socket = undefined

var out_team_id = 0 // 預設0，可寫 1,2，在第一次取得此 room 所有玩家時，會更新自己玩家的 team_id
var out_ready_id = 0 // 預設是0 (準備中)，可寫 0 跟 1 (準備好)
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
	    }else if(msg["event_name"]=="serverResponseLeaveRoom"){
            // room 已經存在，檢查過了
            $("#leaveRoomUser").val($("#username").val())
            $("#leaveRoomId").val($("#room_id").val())
            $("#leaveRoomHash").val(msg["leaveRoomHash"])
            $("#leaveRoomForm").submit()            

        }else if(msg["event_name"]=="serverResponseCheckRoomExist"){
            sss = msg["room_exist"]
            //console.log("Room Exist : "+sss)
            if(!sss){
                // 不存在，就要回到大廳頁面
                // 直接用 post 丟到 /

                $("#backLobbyUser").val($("#username").val())
                $("#backLobbyRoom").val(msg["leave_room_id"])
            
                $("#backLobbyForm").submit()
            }
        }
        // 回報，使用者是否在線，若不在線，就強制登出
        else if(msg["event_name"]=="serverResponseCheckOnline"){
            //console.log("Check User Online : "+msg["isOnline"])
            if(!msg["isOnline"]){
                location.href="/login"
            }
        }else if(msg["event_name"]=="serverResponseRenewRoomUser"){
           // console.log("回應囉 : \n"+JSON.stringify(msg))
           

           //先把所有的block 設成看不見
            $(".block").css({"visibility":"hidden"})

           len=$(".block").length
           join_room_user = msg["join_room_user"]
           user_num = join_room_user.length
           i=0
           for(user in join_room_user){
                if(String(user)==String($("#username").val())){
                    
                    out_team_id = join_room_user[user]["team_id"]
                   // console.log("out_team_id : "+out_team_id)
                }
                 $(  (".block:eq("+i+")")  ).find(".player").html(user)
                 //console.log("P1 : "+join_room_user[user]["status"])
                 status_str = 0
                 if(join_room_user[user]["status"]){
                    //console.log("P2")
                     status_str = "準備完成"
                
            
                }else{
                    //console.log("P3")
                     status_str = "準備中"
                 }
                
                //console.log("P4 : "+join_room_user[user]["status"]+" , "+status_str+" , "+out_ready_id)
                $(  (".block:eq("+i+")")  ).find(".status").html(status_str)
               // console.log("i : "+i+" , user : "+user)
               
               back_color = 0
               if(join_room_user[user]["team_id"]==1){
                    back_color="red"
               }else if(join_room_user[user]["team_id"]==2){
                    back_color="blue"
               }

               $((".block:eq("+i+") > div")).eq(0).css({"background-color":back_color})
               $(  (".block:eq("+i+")")  ).css({"visibility":"visible"})
               ++i
            }
           

        }
        else if(msg["event_name"]=="serverResponseUserChangeTeam"){
            if(msg["result"]=="ok"){
                $.ajax({
				        type: "POST",
					    url: "/changeTeam",
					    dataType: "json",
                        data: {
                            changeTeamUser:$("#username").val(),
                            changeTeamHash:msg["changeTeamHash"],
                            new_team_id:msg["new_team_id"],
                            room_id:$("#room_id").val()
                        },
					    success: function(data) {
						    if (data) {
                                //alert(data)
                                //alert("回來啦")                       
                            
                                // 成功回來了
                                // 更新，換好的 team_id 到全域變數去
                                out_team_id = data["new_team_id"]
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
        else if(msg["event_name"]=="serverResponseUserChangeReady"){
            if(msg["result"]=="ok"){
                
                $.ajax({
				        type: "POST",
					    url: "/changeReady",
					    dataType: "json",
                        data: {
                            changeReadyUser:$("#username").val(),
                            changeReadyHash:msg["changeTeamHash"],
                            new_ready_id:msg["new_ready_id"],
                            room_id:$("#room_id").val()
                        },
					    success: function(data) {
						    if (data) {
                                //alert(data)
                                //alert("回來啦")                       
                            
                                // 成功回來了
                                // 更新，換好的 new_ready_id 到全域變數去
                                out_ready_id = data["new_ready_id"]
                                console.log("更新本地 out_ready_id : "+out_ready_id)
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

	})
}
getsocket()

// 送訊號 到 Server 確定玩家還在線 + 查詢 room 是否還在，若不在了，就會自動退房
function checkOnline(){
    
    if(!socket){
        getsocket()
    }
    
    try{
        //console.log("VVVV : "+$("#username").val()+" , "+$("#room_id").val())
        socket.emit("nonPlayingEvent",{user:$("#username").val(),event_name:"checkOnline"}) // 確定玩家還在線，送訊號回去
        socket.emit("nonPlayingEvent",{room_id:$("#room_id").val(),event_name:"checkRoomExist"}) // 查詢 room 是否還在
    }catch(e){

        socket=undefined
        console.log("網路問題，無法取得room")
    }
}

function renew_room_user_list(){
    obj = Object()
    obj["event_name"] = "requestRenewRoomUser"
    obj["room_id"] = $("#room_id").val()
    socket.emit("nonPlayingEvent",obj)
}


$(function(){
    setInterval(checkOnline,1000)
    setInterval(renew_room_user_list,1000)
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


    // 離開房間按鈕
    $("#leave_room").click(function(){
        //alert("CCC")
        if(!socket){
            getsocket()
        }
        try{
            socket.emit("nonPlayingEvent",{user:$("#username").val(),event_name:"requestLeaveRoom",room_id:$("#room_id").val()})  
        }catch(e){
            socket=undefined
            alert("網路問題，無法進行登出")
        }  
    })

    /*
    // (成功) 測試，讓 room 消失，會自動被偵測到
    $("#test").click(function(){
        socket.emit("nonPlayingEvent",{event_name:"test",room_id:$("#room_id").val()})  
    })
    
    // 測試，讓 user 被登出，會自動被偵測到
    $("#test2").click(function(){
        socket.emit("nonPlayingEvent",{event_name:"test2",user:$("#username").val()})  
    })
    */
     $(".block").css({"visibility":"hidden"})

    //變換 team 
    $(".team_button").each(function(index,val){
        // index 代表 0,1，是兩個 button 的 idnex，0 為 紅色按鈕 team1，1 為 紅色按鈕 team2
        $(this).click(function(){
            //alert(err)
            // 若是按下原本同的隊伍，就不會發送換隊伍請求
            if(out_team_id==(index+1)){
                return
            }
            obj = Object()
            obj["event_name"] = "requestUserChangeTeam"
            obj["user"] = $("#username").val()
            obj["new_team_id"] = (index+1)
            obj["room_id"] = $("#room_id").val()
            socket.emit("nonPlayingEvent",obj)
        })
    })

    //準備好 or 取消準備
    $(".ready_button").each(function(index,val){
        // out_ready_index
        $(this).click(function(){
            if(index == out_ready_id){
            // 代表狀態一樣，不用丟封包
                //alert("CCCC")
                return
            }
            console.log("VVVVVVV")
            obj = Object()
            obj["event_name"] = "requestUserChangeReady"
            obj["user"] = $("#username").val()
            obj["new_ready_id"] = (index)
            obj["room_id"] = $("#room_id").val()
            socket.emit("nonPlayingEvent",obj)
        })
    })
})