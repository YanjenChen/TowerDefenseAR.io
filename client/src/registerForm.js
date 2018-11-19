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
	    if(msg["event_name"]=="serverResponseRegister"){
	        if(msg["result"]=="ok"){
	            //alert("允許提交註冊")
                //console.log("1允許提交註冊")

                name=String($("#registerNameInput").val()).trim()
                pass=String($("#registerPassInput").val()).trim()
                pass_check=String($("#registerPassCheckInput").val()).trim()


                if((!checkEngNum(name)) || (!checkEngNum(pass))){
                    alert("請勿輸入非英文數字的字元")
                    return 
                }

	            $("#registerNameInput").prop('disabled', false).val("");
	            $("#registerPassInput").prop('disabled', false).val("");
	            $("#registerPassCheckInput").prop('disabled', false).val("");

                $("#registerName").val(name)
                $("#registerPass").val(pass)
                $("#registerHash").val(msg["registerHash"])
                /*
                 <input id="registerName" name="registerName" type="hidden" />
                <input id="registerPass" name="registerPass" type="hidden" />
                */
                // 通知斷線，省連線資源
                socket.emit("nonPlayingEvent",{event_name:"callForDisconnect"});
                //console.log("2允許提交註冊")
	            $("#registerForm").submit();
                
	        }else{
                $("#registerNameInput").prop('disabled', false).val("");
	            $("#registerPassInput").prop('disabled', false).val("");
	            $("#registerPassCheckInput").prop('disabled', false).val("");
	            alert(msg["cause"]) // 印出不允許的原因
	        }
	    }
	})
}
getsocket()
$(function(){
    $("#register").click(function(){

        name=String($("#registerNameInput").val()).trim()
        pass=$("#registerPassInput").val()
        pass_check=$("#registerPassCheckInput").val()

        if((name.length==0)||(pass.length==0)||(pass_check.length==0)){
            alert("請勿空白，請確實填寫欄位")
            return 
        }
        if(pass!=pass_check){
            alert("密碼欄位 以及 確認密碼欄位，應填寫相同")
            return 
        }

        pass=String(pass).trim()
        pass_check=String(pass_check).trim()

        if((!checkEngNum(name)) || (!checkEngNum(pass))){
            alert("請勿輸入非英文數字的字元")
            return 
        }

        obj = Object()
        obj["event_name"] = "requestRegister"
        obj["user"] = name
        obj["password"] = pass
        $("#registerNameInput").prop('disabled', true);
        $("#registerPassInput").prop('disabled', true);
        $("#registerPassCheckInput").prop('disabled', true);
        try{
            if(!socket){
                getsocket()
            }
            socket.emit("nonPlayingEvent",obj);
            //console.log("到這邊了")    
        }catch(e){
            socket = undefined
            alert("網路錯誤，等待網路恢復時再註冊")

        }

        
    })
})