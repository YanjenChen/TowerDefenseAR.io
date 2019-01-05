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
			height = $(window).height() * 0.85 + "px"
			//alert(height)
			$("#card").css({width:"50%",height:height,position:"absolute",left:"40%",top:"100px","background-image":"url(booktexture.png)","background-repeat":"no-repeat","background-size":"cover", "border":"20px solid #1a1a1a"})
            $(".front").css({width:"94%",height:height,position:"absolute",margin:"0px 0px 0px 0px"})
            $(".back").css({width:"94%",height:height,position:"absolute",margin:"0px 0px 0px 0px"})
			$(".page").height($(window).height() * 0.75)
			$(".page").css({position:"relative",top:"20px",left:"20px",padding:"0px","border-width":"0px"})


			// 先把頁碼 隱藏

		}

		function renew_room(){

			// 開始丟 request

			$(".room_id_show").css({visibility:hidden})
			$(".page_number").css({visibility:hidden})

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
/*
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


                //console.log("回到這邊了")
                // 通知斷線，省連線資源
                socket.emit("nonPlayingEvent",{event_name:"callForDisconnect"});
	            $("#logoutForm").submit();



	        }else{
	            alert(msg["cause"]) // 印出不允許的原因
	        }
	    }else if(msg["event_name"]=="serverResponseRoom"){


        // 新版 (不須管下一頁按鈕，只要管顯示 room)

            //console.log("serverResponseRoom 這邊\n\n"+JSON.stringify(msg))

            // 顯示 room
            room_arr = msg["rooms"]

            rooms = $(".room")
            //console.log(rooms.length)
            len = room_arr.length
            i=0
            $(".room").css({visibility:"hidden"})
            $(".room_id_show").html("")
            while(i<len){
                //rooms.eq(i).find(".room_name").html(JSON.stringify(room_arr[i]))
                //$(   (".room:eq("+i+") > .room_name") )  .html(room_arr[i]["room_id"])
                 //$((".room:eq("+i+") > .room_name")) .html("XXXXXX")
                 $(".room").eq(i).find(".room_id_show").html(room_arr[i]["room_id"])
                 //console.log($(   (".room:eq("+i+")> .room_name") ))
                $(".room").eq(i).css({visibility:"visible"})
                ++i
            }

            // 顯示頁數
            // msg["page"]

            if(now_front){
				$(".back .page .page_number").css({visibility:"hidden"})

                $(".front .page .page_number").eq(0).html(msg["page"])
                $(".front .page .page_number").eq(1).html(msg["page"]+1)
                $(".front .page .page_number").css({visibility:"visible"})



            }else{
                $(".front .page .page_number").css({visibility:"hidden"})

                $(".back .page .page_number").eq(0).html(msg["page"])
                $(".back .page .page_number").eq(1).html(msg["page"]+1)
                $(".back .page .page_number").css({visibility:"visible"})
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

	})
}
getsocket()

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
}*/

$(function(){


    // 初始化 flip
    init_flip()


    // 關閉訊息Modal
    $("#close_message_modal").click(function(){
        message_modal_is_open = false;
        $('#message_modal').modal('hide')
    })
    //setInterval(tickGetRooms_checkOnline,1000)

})
