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
        console.log("GGGG : "+JSON.stringify(msg))
	    if(msg["event_name"]=="serverResponseAdminLogin"){
            //console.log("SGGGG : "+JSON.stringify(msg))
	        if(msg["result"]=="ok"){
	            //alert("允許提交註冊")


                name=String($("#adminLoginNameInput").val()).trim()
                pass=String($("#adminLoginPassInput").val()).trim()

                if((!checkEngNum(name)) || (!checkEngNum(pass))){
                    alert("請勿輸入非英文數字的字元")
                    return 
                }
                
	            $("#adminLoginNameInput").prop('disabled', false).val("");
	            $("#adminLoginPassInput").prop('disabled', false).val("");

                $("#adminLoginName").val(name)
                $("#adminLoginPass").val(pass)
                $("#adminLoginHash").val(msg["adminLoginHash"])
                /*
                 <input id="loginName" name="loginName" type="hidden" />
                <input id="loginPass" name="loginPass" type="hidden" />
                */

                //
                // 通知斷線，省連線資源
                socket.emit("nonPlayingEvent",{event_name:"callForDisconnect"});
	            $("#adminLoginForm").submit();
                //console.log("回到這邊了")
                
	        }else{
                $("#loginNameInput").prop('disabled', false).val("");
	            $("#loginPassInput").prop('disabled', false).val("");
	            $("#loginPassCheckInput").prop('disabled', false).val("");
	            alert(msg["cause"]) // 印出不允許的原因
	        }
	    }else if(msg["event_name"]=="serverResponseAdminLogout"){
            if(msg["result"]=="ok"){
            
        
            }else{
                
	            alert(msg["cause"]) // 印出不允許的原因
	        }
        }
	})
}
getsocket()
$(function(){
    $("#adminLogin").click(function(){

        name = String($("#adminLoginNameInput").val()).trim()
        password = String($("#adminLoginPassInput").val()).trim()
        if((name.length==0)||(password.length==0)){
            alert("請勿空白，請確實填寫欄位")
            return 
        }

        if((!checkEngNum(name)) || (!checkEngNum(password))){
            alert("請勿輸入非英文數字的字元")
            return 
        }

        obj = Object()
        obj["event_name"] = "requestAdminLogin"
        obj["admin"] = name
        obj["password"] = password
        $("#adminLoginNameInput").prop('disabled', true);
        $("#adminLoginPassInput").prop('disabled', true);
        try{
            if(!socket){
                getsocket()
            }
            socket.emit("nonPlayingEvent",obj);
            console.log("到這邊了")    
        }catch(e){
            socket = undefined
            alert("網路錯誤，等待網路恢復時再登入")
        }
        
    })
})