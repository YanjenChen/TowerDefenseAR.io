// 直接覆寫 alert 最快XDDD
	function alert(message){
	    //message_modal_is_open = true
	    $("#message_to_alert").html(message)
	    $('#message_modal').modal({allowMultiple:true,closable : true
	        ,onShow:function(){message_modal_is_open = true}
	        ,onHide:function(){message_modal_is_open = false}})
	        .modal('show')    
	}
$(function(){
// ****************************** 原本後端

	var message_modal_is_open = false;
	
	
	
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
	
	reject_cause = Object()
	reject_cause["only_num_eng"] = "Please input only number and english char"
	
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
		    if(msg["event_name"]=="serverResponseLogin"){
		        if(msg["result"]=="ok"){
		            //alert("允許提交註冊")
	
	
	                name=String($("#loginNameInput").val()).trim()
	                pass=String($("#loginPassInput").val()).trim()
	                pass_check=String($("#loginPassCheckInput").val()).trim()
	
	                if((!checkEngNum(name)) || (!checkEngNum(pass))){
	                    alert("請勿輸入非英文數字的字元")
	                    return 
	                }
	                
		            $("#loginNameInput").prop('disabled', false).val("");
		            $("#loginPassInput").prop('disabled', false).val("");
	
	                $("#loginName").val(name)
	                $("#loginPass").val(pass)
	                $("#loginHash").val(msg["loginHash"])
	                /*
	                 <input id="loginName" name="loginName" type="hidden" />
	                <input id="loginPass" name="loginPass" type="hidden" />
	                */
	
	                //console.log("回到這邊了")
	                // 通知斷線，省連線資源
	                socket.emit("nonPlayingEvent",{event_name:"callForDisconnect"});
		            $("#loginForm").submit();
	                
		        }else{
	                $("#loginNameInput").prop('disabled', false).val("");
		            $("#loginPassInput").prop('disabled', false).val("");
		            $("#loginPassCheckInput").prop('disabled', false).val("");
		            alert(msg["cause"]) // 印出不允許的原因
		        }
		    }else if(msg["event_name"]=="serverResponseRegister"){
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
		            
	                
	                // 別用 post ，在原頁面重新登入
	                //$("#registerForm").submit();
	
	
	                jQuery.ajax({
	                    type: 'POST',
	                    url: "/register",
	                    data: {registerName:name,registerPass:pass,registerHash:msg["registerHash"]},
	                    success: function(msg){
	                        if(msg){
	                            alert("註冊成功")
	                            $("#login_item").click() // 直接跳回 Login 的 Tab
	                        }
	                    },
	                    dataType: "json"
	                });
	                
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
	
	
	
	function media_regulate(){
	    var x = window.matchMedia("(min-width: 1000px)")
	
	    if (x.matches) { // 大螢幕
	        $("#requset_url").addClass("ui celled striped table");
	
	        //document.getElementById("").style = ""
	        // 無效
	        //$("login_box_outer").prop("style","background-image:url(image/eddie-mendoza-valhalla.jpg);background-size:cover;margin:0;")
	
	    } else {    // 小螢幕
	        // 無效
	        //$("login_box_outer").prop("style","background-image:url(image/eddie-mendoza-valhalla.jpg);background-size:cover;margin:0;")
	    }
	
	}

// ****************************** 原本前端
    // 啟動 modal tab 功能
    $('.menu .item').tab();

    // 按下 play 按鈕，開啟 modal
    $("#play_button").click(function(){

        //$('#play_modal').modal('show').modal({closable : false})
        
        /*
        $('#play_modal').modal({
            onHide:function(){
                // 如果 message_modal 正在開啟，則這個無法關閉
                return (!message_modal_is_open)
            },onHidden:function(){
                // 還原
                //message_modal_is_open = true 
            },onShow:function(){
                // 如果 message_modal 正在開啟，則這個無法關閉
                return (!message_modal_is_open)
            }
        }).modal('show')
        */

        // 直接這樣最省事...
        $('#play_modal').modal('show').modal({closable : false})
    })

    // 關閉 modal 的按鈕
    $(".close_play_modal").click(function(){
        $('#play_modal').modal('hide')
    })

    $("#close_message_modal").click(function(){
        message_modal_is_open = false;
        $('#message_modal').modal('hide')
    })

    // 登入按鈕
    $("#login_button").click(function(){

        name = String($("#loginNameInput").val()).trim()
        password = String($("#loginPassInput").val()).trim()
        if((name.length==0)||(password.length==0)){
            alert("請勿空白，請確實填寫欄位")
            return 
        }

        if((!checkEngNum(name)) || (!checkEngNum(password))){
            alert("請勿輸入非英文數字的字元")
            return 
        }

        obj = Object()
        obj["event_name"] = "requestLogin"
        obj["user"] = name
        obj["password"] = password
        $("#loginNameInput").prop('disabled', true);
        $("#loginPassInput").prop('disabled', true);
        try{
            if(!socket){
                getsocket()
            }
            socket.emit("nonPlayingEvent",obj);
            //console.log("到這邊了")    
        }catch(e){
            socket = undefined
            alert("網路錯誤，等待網路恢復時再登入")
        }
        
    })

    // 註冊按鈕
    $("#register_button").click(function(){

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



    //$("#hacker_guide_area").modal("show")

    $("#hacker_login").click(function(){
        $("#hacker_guide_area").modal("hide")
        $('#play_modal').modal('show').modal({closable : false})
        $("#login_item").click()

    })


    $("#hacker_register").click(function(){
        $("#hacker_guide_area").modal("hide")
        $('#play_modal').modal('show').modal({closable : false})
        $("#register_item").click()

    })


    $("#open_hacker_guide").click(function(){
        $("#hacker_guide_area").modal("show")
    })


    media_regulate()

    var len = $(".is_from_signout").length;
    //console.log("\nlen : "+len+"\n")
    // 如果是經由登出回到原頁面，就不會自動跳出 hacker guide
    if(len==0){
        $("#hacker_guide_area").modal("show")
    }
    
})