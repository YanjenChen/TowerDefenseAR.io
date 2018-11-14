
var socket = undefined

// 送訊號 到 Server 確定玩家還在線 + 送訊通知某玩家還在線遊戲
function checkOnline(){
    
    if(!socket){
        getsocket()
    }
    
    try{
        //console.log("VVVV : "+$("#username").val()+" , "+$("#room_id").val())
        socket.emit("nonPlayingEvent",{user:$("#username").val(),event_name:"checkOnline"}) // 確定玩家還在線，送訊號回去

        // 送訊過去，通知玩家已加入 (就是 取得玩家的 socket 物件)
        socket.emit("playingEvent",{user:$("#username").val(),user_team_id:$("#user_team_id").val(),room_id:$("#room_id").val(),event_name:"informPlayerOnline"})    
        //console.log("這邊~~")    
    }catch(e){

        socket=undefined
        console.log("網路問題，無法取得room")
    }
}

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
	    // 回報，使用者是否在線，若不在線，就強制登出
        if(msg["event_name"]=="serverResponseCheckOnline"){
            //console.log("Check User Online : "+msg["isOnline"])
            if(!msg["isOnline"]){
                location.href="/login"
            }
        }
	})

    // "serverInformEndGame"
    socket.on('playingEvent', function(msg){
	    // 回報，使用者是否在線，若不在線，就強制登出
        if(msg["event_name"]=="serverInformEndGame"){ // 說要結束遊戲
           


           console.log("遊戲結束~~~ : "+msg["end_game_hash"])
           // 3 秒後跳轉回首頁 大廳頁面
           
           
           setTimeout(function(){
                $("#endGameBackUser").val($("#username").val())
                $("#endGameBackRoom").val($("#room_id").val())
                $("#endGameBackHash").val(msg["end_game_hash"])
                $("#endGameBackForm").submit()
           },3000)
           
        }
	})
}


getsocket()
$(function(){
    setInterval(checkOnline,1000)




})