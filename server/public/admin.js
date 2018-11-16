function checkEngNum(str){
    arr="ABCDEFGHIJKLNMOPQRSTUVWXYZ"
    arr = arr + arr.toLowerCase()
    arr = arr + "0123456789"
    arr = arr.split("")
    // arr 現在是 ... [ 'A','B','C',，用來檢查每個字元，是否都在英文數字內
    strarr = str.split("")
    for(a in strarr){
        vv = true
        for(b in arr){
            if(strarr[a]==arr[b]){ // 安全，這個字就不用檢查了
                vv = false
                break
            }
        }
        // 如果最後還是 true，就糟糕了，代表這個字 不是英文也不是數字，要擋下來
        if(vv){
            return false
        }
    }
    return true
}


function getAllUser(){



}

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
        //console.log("GGGG : "+JSON.stringify(msg))
	    if(msg["event_name"]=="serverResponseAdminLogout"){
            if(msg["result"]=="ok"){
                name = String($("#username").val()).trim()
                $("#adminLogoutName").val(name)
                $("#adminLogoutHash").val(msg["adminLogoutHash"])
                /*
                 <input id="loginName" name="loginName" type="hidden" />
                <input id="loginPass" name="loginPass" type="hidden" />
                */

                //console.log("回到這邊了")
                // 通知斷線，省連線資源
                socket.emit("nonPlayingEvent",{event_name:"callForDisconnect"});
	            $("#adminLogoutForm").submit();
        
            }else{
                
	            alert(msg["cause"]) // 印出不允許的原因
	        }
        }
	})
}


$(function(){
    
    /*
    particlesJS.load('particles-js', 'particles.json', function() {
                        console.log('callback - particles.js config loaded');
                    });
    
    $("#out_block").css({visibility:"visible", opacity: 0.0})
																									.animate({opacity: 0.2},120)
																									.animate({opacity: 0.4},120)
																									.animate({opacity: 0.6},120)
																									.animate({opacity: 0.8},120)
																									.animate({opacity: 1.0},120)
    
    */
    $("#adminLogout").click(function(){
        if(!socket){
            getsocket()
        }
        try{
            socket.emit("nonPlayingEvent",{user:$("#username").val(),event_name:"requestAdminLogout"})  
        }catch(e){
            socket=undefined
            alert("網路問題，無法進行登出")
        }  
    })


})