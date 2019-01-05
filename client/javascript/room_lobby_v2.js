//*********************************************************************************************************************
function SidebarToggle(ref){
  ref.classList.toggle('active');
  document.getElementById('sidebar').classList.toggle('active');
}

function FlipPage(page){
  page.classList.toggle('flip');
  document.getElementById('cover').classList.toggle('active');
  $('#cover').transition('horizontal flip')
}


function FlipPage2(page){
  page.classList.toggle('flip');
  document.getElementById('cover').classList.toggle('active');
  $('#cover2').transition('horizontal flip')
}



        var now_front = true
		function change_show_front_back(){
			// 因為要更新 room，所以都先看不見即可
            /*
            if(now_front){
				$(".back .page .room").css({visibility:"hidden"})
				$(".front .page .room").css({visibility:"visible"})
				$(".back .page .page_number").css({visibility:"hidden"})
				$(".front .page .page_number").css({visibility:"visible"})
				
			}else{
				$(".front .page .room").css({visibility:"hidden"})
				$(".back .page .room").css({visibility:"visible"})
				$(".front .page .page_number").css({visibility:"hidden"})
				$(".back .page .page_number").css({visibility:"visible"})
			}

            */
            $(".page .room").css({visibility:"hidden"})
			$(".page .page_number").css({visibility:"hidden"})
		}

		function init_flip(){

			change_show_front_back()
            $("#card").flip({trigger:"manual"});
            
            // 會跟翻頁形成干擾
            /*
            $(".front").click(function(){
				now_front = false
				change_show_front_back()
                $("#card").flip(true);
            });
             $(".back").click(function(){
				now_front = true
				change_show_front_back()
				$("#card").flip(false);
            });
            */

            // 換頁按鈕，上一頁下一頁
            // 決定是否翻頁成功，看別處
            $(".left_page").click(function(){
                getAnotherPage('lastPage')
                //alert("left page")
            })
            $(".right_page").click(function(){
                getAnotherPage('nextPage')
                //alert("right page")
            })


			height = $(window).height() * 0.85 + "px"
			//alert(height)
			$("#card").css({width:"50%",height:height,position:"absolute",left:"30%",top:"100px","background-image":"url(image/booktexture.png)","background-repeat":"no-repeat","background-size":"cover", "border":"20px solid #1a1a1a"})
			// $("#cover").css({"background-color":"red", border:"5px solid transparent",})
            $(".front").css({width:"94%",height:height,position:"absolute",margin:"0px 0px 0px 0px"})
            $(".back").css({width:"94%",height:height,position:"absolute",margin:"0px 0px 0px 0px"})
			$(".page").height($(window).height() * 0.75)
			$(".page").css({position:"relative",top:"20px",left:"20px",padding:"0px","border-width":"0px"})


			// 先把頁碼 隱藏

		}

		function renew_room(){

			// 開始丟 request

			$(".room_id_show").css({visibility:"hidden"})
			$(".page_number").css({visibility:"hidden"})

		}


//*********************************************************************************************************************

var message_modal_is_open = false;
// SELECT * FROM COMPANY LIMIT 3 OFFSET 2
// 直接覆寫 alert 最快XDDD
function alert(message){
    //message_modal_is_open = true
    $("#message_to_alert").html(message)
    $('#message_modal').modal({allowMultiple:true,closable : true
        ,onShow:function(){message_modal_is_open = true}
        ,onHide:function(){message_modal_is_open = false}})
        .modal('show')    
}

var socket = undefined

// 記錄在第幾"面"，一面兩頁
var now_page = 1 // 預設是1

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
                
                
                // 改用 Ajax
                /*
                $.ajax({
				        type: "POST",
					    url: "/logout",
					    dataType: "json",
                        data: {
                            logoutName:name,
                            logoutHash:msg["logoutHash"],
                        },
					    success: function(data) {
						    if (data) {

                                // 這個 alert 沒效果
                               //alert("登出成功2")     
                               location.href="/"             
                            }
					    },
					    error: function(jqXHR) {
                            alert("發生錯誤")
                             //$("#search_message").html("<h1>發生錯誤: " + JSON.stringify(jqXHR)+"</h1>")
					    }
				})  
                */

	        }else{
	            alert(msg["cause"]) // 印出不允許的原因
	        }
	    }
        
        // 調整完成
        else if(msg["event_name"]=="serverResponseRoom"){

        // 舊版
            /*
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
            */

        // 新版 (不須管下一頁按鈕，只要管顯示 room)

            //console.log("serverResponseRoom 這邊\n\n"+JSON.stringify(msg))

            // 顯示 room
            room_arr = msg["rooms"]

            rooms = $(".room")
            //console.log(rooms.length)
            len = room_arr.length
            i=0
            shift = 0
            if(now_front){ // 決定由正面 or 反面的 room 顯示
                shift = 0
            }else{
                shift = 8
            }

            $(".room").css({visibility:"hidden"})
            $(".room_id_show").html("")
            while(i<len){
                //rooms.eq(i).find(".room_name").html(JSON.stringify(room_arr[i]))
                //$(   (".room:eq("+i+") > .room_name") )  .html(room_arr[i]["room_id"])
                 //$((".room:eq("+i+") > .room_name")) .html("XXXXXX")
                 $(".room").eq(i+shift).find(".room_id_show").html(room_arr[i]["room_id"])
                 //console.log($(   (".room:eq("+i+")> .room_name") ))
                $(".room").eq(i+shift).css({visibility:"visible"})
                ++i
            }

            // 顯示頁數
            // msg["page"]

            if(now_front){
				$(".back .page .page_number").css({visibility:"hidden"})

                $(".front .page .page_number").eq(0).html((2*msg["page"])-1)
                
                
                $(".front .page .page_number").eq(1).html(2*msg["page"])
                
                $(".front .page .page_number").css({visibility:"visible"})
                
                // 若沒有超過四間room要顯示，就不用顯示 right page 的頁碼
                if(len<=4){
                    $(".front .page .page_number").eq(1).css({visibility:"hidden"})
                }

                
            }else{
                $(".front .page .page_number").css({visibility:"hidden"})

                $(".back .page .page_number").eq(0).html((2*msg["page"])-1)
                
                $(".back .page .page_number").eq(1).html(2*msg["page"])
                
                    
                $(".back .page .page_number").css({visibility:"visible"})

                // 若沒有超過四間room要顯示，就不用顯示 right page 的頁碼
                if(len<=4){
                    $(".back .page .page_number").eq(1).css({visibility:"hidden"})
                }
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


        // 翻頁，調整完成
        else if(msg["event_name"]=="serverResponseAnotherPage"){
            
            // 舊版
            /*
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
            */


            
            if((msg["result"]=="ok") && (msg["newpage"]>0)  ){
                //alert("這邊~~~~ newPage : "+msg["newpage"])


                now_page = msg["newpage"]
                
                
                
                $("#card").flip(now_front); // true 代表原本正面，就翻到背面
                now_front = !now_front // 交換正反面
				change_show_front_back()


            }else{
                if(msg["cause"]){
                    alert(msg["cause"])
                    return
                }
	            alert("已到達首頁，無上一頁") // 印出不允許的原因
	        }
        }

        // 調整完成
        else if(msg["event_name"]=="serverResponseJoinRoom"){
            if(msg["result"]=="ok"){
                //alert("到這邊了唷AAAA")
                
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
        // 調整完成
        // 回報，使用者是否在線，若不在線，就強制登出
        else if(msg["event_name"]=="serverResponseCheckOnline"){
            console.log("Check User Online : "+msg["isOnline"])
            if(!msg["isOnline"]){
                location.href="/login"
            }
        }

	})
}
getsocket()
// 調整完成
function tickGetRooms_checkOnline(){
    
    if(!socket){
        getsocket()
    }
    
    try{
        //console.log("CCCC")
        socket.emit("nonPlayingEvent",{user:$("#username").val(),event_name:"checkOnline"})
        
        //console.log("DDD : "+$("#page").html())
        
        // 舊版
        //pagenum = parseInt($("#page").html())
        
        // 新版
        pagenum = now_page
        
        
        //請求目前新的房間數
        socket.emit("nonPlayingEvent",{event_name:"requestRoom",page:pagenum})
    }catch(e){

        socket=undefined
        console.log("網路問題，無法取得room")
    }
}
// 翻頁，調整完成
function getAnotherPage(way_out){
    // way 方向
    
    // 舊版
    /*
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
    */

    way = way_out
    newPage = 0
    waystr = " "
    if(way=="nextPage"){ // 下一頁按鈕
        newPage = now_page+1
        waystr = "next"
    }else if(way=="lastPage"){ // 上一頁按鈕
        newPage = now_page-1
        waystr = "last"
    }else{
        //alert("KKKKKK + newPage : "+way)
        return
    }

    // 新版
    
    obj = Object()
    obj["event_name"] = "requestAnotherPage"
    obj["way"] = waystr
    obj["newpage"] = newPage
    //alert("BBBBBB + newPage : "+newPage)
    socket.emit("nonPlayingEvent",obj)

}


// 調整完成
function clickJoinRoom(){
    // 抓到房間名稱了
    // 舊版
    //room_name = $(this).parent().prev(".room_name").eq(0).html()
    // 新版
    room_name = $(this).find(".room_id_show").html()
    //console.log("\n\n\n"+"抓到Room Name : "+room_name+"\n\n\n")
    alert("抓到Room Name : "+room_name)
    
    user = String($("#username").val())

    if(!socket){
        getsocket()
    }
        
   //alert("SSS : "+room_name)
    obj=Object()
    obj["event_name"] = "requestJoinRoom"
    obj["user"]=user
    obj["room_name"] = room_name
    try{
        socket.emit("nonPlayingEvent",obj)
        //alert("WWW : "+room_name)
    }catch(e){

        socket=undefined
        alert("網路問題，無法進行加入房間動作")
    }  
    
    //alert(room_name)
}

$(function(){


    // 初始化 flip
    init_flip()


    // 關閉訊息Modal
    $("#close_message_modal").click(function(){
        message_modal_is_open = false;
        $('#message_modal').modal('hide')
    })

    // 定時取得Room + 傳送玩家還在線的狀態
    setInterval(tickGetRooms_checkOnline,1000)


    //設置 click 加入房間用的函示
    $(".room").click(clickJoinRoom)

    


    

})