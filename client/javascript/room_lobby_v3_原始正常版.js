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

$(function(){

async function whole(){

// ************************************** story 需要的全域變數
var story_p_arr = Array()
$("#p_content p").each(function(index,ele){
	story_p_arr.push(
		String($("#p_content p").eq(index).html())
	)
})
var story_type_str = $("#type_word").html()
// **************************************** 原本後端1
        var out_username = String($("#username").val()).trim()
	    // 搶先取得username，不斷設回去
	    setInterval(function(){
		    $("#username").val(String(out_username))
	    },100)

        
		function SidebarToggle(){
			ref = this
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

            // 舊版
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
			//height = $(window).height() * 0.85 + "px"
			//alert(height)
			
            // 新板
             // 換頁按鈕，上一頁下一頁
            // 決定是否翻頁成功，看別處
            $(".left_page").click(function(){
                //console.log("\nleft page\n")
                getAnotherPage('lastPage')
                //alert("left page")
            })
            $(".right_page").click(function(){
                //console.log("\nright page\n")
                getAnotherPage('nextPage')
                //alert("right page")
            })
		}




        
        // JavaScript 調整 media-query
        // 這邊CSS重要!!
        function media_regulate(){
            var x = window.matchMedia("(min-width: 1000px)")
            /*
                background-image:url(image/booktexture2.png); background-size: 20% 90%; background-repeat:no-repeat;
					background-image:url(image/booktexture2.png); background-size:cover;
            */
            if (x.matches) { // 大螢幕
                height = $(window).height() * 0.92 + "px"
                // 這句重要，背景顯示設定
                $("#card").css({width:"50%",height:height,position:"absolute",left:"45%",padding:"0px",margin:"0",
                    top:"5%","background-image":"url(image/booktexture.png)","background-repeat":"no-repeat","background-size":"cover", "border":"20px solid #1a1a1a"})
                $(".front").css({width:"94%",height:height,position:"absolute",margin:"0px 0px 0px 0px",padding:"0px",margin:"0"})
                $(".back").css({width:"94%",height:height,position:"absolute",margin:"0px 0px 0px 0px",padding:"0px",margin:"0"})
			    $(".page").height($(window).height() * 0.83)
			    $(".page").css({position:"relative",top:"20px",left:"20px",padding:"0px","border-width":"0px"})


                // 針對 背面右頁 CSS 特殊處理
                height = $(window).height()
                //console.log("fff : "+height)
                // relative : top:"230px",left:"45%"
                // 836 920
                // 150 230
                // 0.179 0.25

                //absolute
                // 836 920
                // 640 710
                // 0.765 0.771
                // 取 0.768
                $("#ppp").find(".page_number").css({position:"absolute",top:((height*0.768)+"px"),left:"45%"})
                //$("#ppp").prop("style","background-image:url(image/booktexture2.png); background-size:cover;")
            } else {    // 小螢幕
                height = $(window).height() * 0.75 + "px"
                // 這句重要，背景顯示設定
                $("#card").css({width:"90%",height:height,position:"absolute",left:"5%",padding:"0px",margin:"0",
                    top:"25%","background-image":"url(image/booktexture.png)","background-repeat":"no-repeat","background-size":"cover", "border":"20px solid #1a1a1a"})
                $(".front").css({width:"94%",height:height,position:"absolute",margin:"0px 0px 0px 0px"})
                $(".back").css({width:"94%",height:height,position:"absolute",margin:"0px 0px 0px 0px"})
			    $(".page").height($(window).height() * 0.63)
			    $(".page").css({position:"relative",top:"20px",left:"20px",padding:"0px","border-width":"0px"})
                
                // 針對 背面右頁 CSS 特殊處理
                // 放棄，手機板的....
                $("#ppp").prop("style","background-image:url(image/booktexture2.png); background-size: 0px 0px; background-repeat:no-repeat;")
                $("#ppp").find(".room").css({position:"relative",top:"1.5%"})
                // position:absolute;bottom:50px;left:45%
                $("#ppp").find(".page_number").css({position:"relative",top:"5%",left:"45%"})


				$(".room").css({
					width: (($(window).width())*0.4)+"px",
					height: (($(window).height())*0.12)+"px",
					
				})
            
            }
        }
        

		function renew_room(){

			// 開始丟 request

			$(".room_id_show").css({visibility:"hidden"})
			$(".page_number").css({visibility:"hidden"})

        }


		//*********************************************************************************************************************
		
		
		
		var socket = undefined
		
		// 記錄在第幾"面"，一面兩頁
		var now_page = 1 // 預設是1

// **************************************** 原本後端2
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
		
						$("body").css({opacity:"1",background:"black"})
						$("body").animate({opacity:"0"},1000,function(){
		                	name = String($("#username").val()).trim()
		                	$("#logoutName").val(name)
		                	$("#logoutHash").val(msg["logoutHash"])
		
		                	//console.log("回到這邊了")
		                	// 通知斷線，省連線資源
		                	socket.emit("nonPlayingEvent",{event_name:"callForDisconnect"});
			            	$("#logoutForm").submit();
						})
		                
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
		
		                //$("#ppp").find(".room").prop("style","width:160px;height:75px;position:relative;right:40px;margin: 0px 0px 20px 0px;")
		                
		
		                $(".front .page .page_number").css({visibility:"hidden"})
		
		                $(".back .page .page_number").eq(0).html((2*msg["page"])-1)
		                
		                $(".back .page .page_number").eq(1).html(2*msg["page"])
		                
		                    
		                $(".back .page .page_number").css({visibility:"visible"})
		
		                
		
		                // 若沒有超過四間room要顯示，就不用顯示 right page 的頁碼
		                if(len<=4){
		                    $(".back .page .page_number").eq(1).css({visibility:"hidden"})
		                }
		
		
		                
		            }
		
		            // 這邊別打開，否則混亂
		            // 尤其是點擊第一頁或最後一頁後，會嚴重閃屏錯位
		            //media_regulate()
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
		                


						$("body").css({opacity:"1",background:"black"})
						$("body").animate({opacity:"0"},1000,function(){
		                	name = String($("#username").val()).trim()
		                	room_name = msg["join_room_id"]
		                	//user = String($("#username").val())
		                	//alert("S room_name : "+room_name)
		                	$("#joinRoomName").val(name) // 人的name
		                	$("#joinRoomId").val(room_name) // 房間 name
		                	$("#joinRoomHash").val(msg["joinRoomHash"])
		                	$("#joinRoomForm").submit();
						})
		            }else{
			            alert(msg["cause"]) // 印出不允許的原因
			        }
		        }
		        // 調整完成
		        // 回報，使用者是否在線，若不在線，就強制登出
		        else if(msg["event_name"]=="serverResponseCheckOnline"){
		            console.log("Check User Online : "+msg["isOnline"])
		            if(!msg["isOnline"]){
		            	$("body").css({opacity:"1",background:"black"})
						$("body").animate({opacity:"0"},1000,function(){
						    location.href="/login"
						})
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
		    //alert("抓到Room Name : "+room_name)
		    
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
		
		    // 要寫這句，不然點第一頁 or 最後一頁的房間時，會先跳出一個框說 (下一頁 or 上一頁) 已無房間
		    // 不想跳出，就寫這句，事件就不會繼續冒泡，傳到 class="left_page" 或 class="right_page" 的物件，造成page物件的 click 事件 
		    return false
		}

// **************************************** 前端
    // 初始化 flip
    init_flip()
    media_regulate()

    // 關閉訊息Modal
    $("#close_message_modal").click(function(){
        message_modal_is_open = false;
        $('#message_modal').modal('hide')
    })

    // 定時取得Room + 傳送玩家還在線的狀態
    setInterval(tickGetRooms_checkOnline,1000)


    //設置 click 加入房間用的函示
    /*
    $(".room").click(function(event){
        console.log("\nVVV\n")
        //event.stopPropagation();    
        clickJoinRoom()
    
    })
    */

	// sidebar toggle
	$("#toggle-btn").click(SidebarToggle)

	// 點擊加入各Room
    $(".room").click(clickJoinRoom)

    
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


    //新開房間按鈕
    $("#createroom").click(function(){
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
//****************************************** story 東西

	// 紀錄，是否要繼續跑
	var go_on_story = Object()
	//go_on_story["do"] = false
	
		// skip按鈕 // 搞定
	
	var flow = Object()
	flow["go_on_figure_story"] = true
	flow["go_on_lobby_story"] = true

	// 還原 lobby
	async function restore_lobby(go_on_story){ // lobby 重新顯現
		$(".scene").css({opacity:"0",display:"block",visibility:"visible"})
		$("#lobby_all").css({display:"block",visibility:"visible",opacity:"0"}) // 先別完全顯現
		//console.log("g2")
		$("#lobby_all").animate({opacity:"1"},2000)
		$(".scene").animate({opacity:"1"},2000)
		await delay(2100)
		//console.log("g3")
		$("#skip").click(skip_func) // 此時恢復 skip 按鈕
		go_on_story["do"] = false // 設回來 false
	}

	// 關閉 lobby 
	async function close_lobby(go_on_story){
		go_on_story["do"] = true
	
		$("body").css({background:"black"}) // 先黑屏，不然跳轉 URL 時，一瞬間會出現閃光白屏
		$("#lobby_all").css({display:"none",visibility:"hidden"})
		$(".scene").css({display:"none",visibility:"hidden"})

	}

	// 原本，按下 story skip，
	async function skip_func(need_go_on_figure_story){
		go_on_story["do"] = false
		console.log("\nYYY : "+need_go_on_figure_story+"\n")
	
		//下面就照抄即可
	
		$("#skip , #show").css({opacity:"1"})
			.animate({opacity:"0",color:"black"},1000)
		
		await delay(1100) // 等待消失完
		$("body").css({background:"black"})
		$("#story_back").animate({opacity:"0",color:"black"},1000)
		await delay(1100)
		$("#show").html("")

	
	
		$("#type_word , #p_content").css({display:"none",visibility:"hidden"})
		$("#story_back, #skip , #show").css({display:"none",visibility:"hidden"})


		/*
		if(need_go_on_figure_story){
			init_figure_story(go_on_story,false,true)
		}else{
			await restore_lobby(go_on_story)
		}
		*/
		await restore_lobby(go_on_story)
		/*
		$(".scene").css({opacity:"0",display:"block",visibility:"visible"})
		$("#lobby_all").css({display:"block",visibility:"visible",opacity:"0"}) // 先別完全顯現
		//console.log("g2")
		$("#lobby_all").animate({opacity:"1"},2000)
		$(".scene").animate({opacity:"1"},2000)
		await delay(2100)
		//console.log("g3")
		$("#skip").click(skip_func) // 此時恢復 skip 按鈕
		go_on_story["do"] = false // 設回來 false
		*/
	}
	
	// 動態決定
	$("#skip").click(skip_func)
	
	$(".scene").prop("src","image/scene.png").css({
		width:"100%",
		height:"100%",
	
	})
	


	// 開啟 
	async function init_figure_story(go_on_story,need_close_lobby,need_close_story){
		if(need_close_lobby){
			await close_lobby(go_on_story)
		}

		if(need_close_story){
			await close_lobby_story(go_on_story)
		}

		console.log("\n\nFFFFFFFFFFFFFFF\n\n")
		// #Scrol1 , #Scrol1_in , #book , #images , #fac_flag , #say , #name



		$("#figure_story").css({
					display:"block",
					visibility:"visibility",
					opacity:"1",
				})
		await run_figure_demo()


	}

	async function init_figure_story(go_on_story){
				$("#figure_story , #Scrol1 , #Scrol1_in , #book , #images , #fac_flag , #say , #name").css({
					display:"none",
					visibility:"hidden",
					opacity:"0",
				})
	}

	


	// 關閉 lobby story
	async function close_lobby_story(go_on_story,need_go_on_figure_story){
		$("#type_word , #p_content").css({display:"none",visibility:"hidden"})
		$("#story_back, #skip , #show").css({display:"none",visibility:"hidden"})
		
		if(need_go_on_figure_story){
			await init_figure_story(go_on_story,false,false)
		}
		
		
		await restore_lobby(go_on_story)

		/*
		$(".scene").css({opacity:"0",display:"block",visibility:"visible"})
		$("#lobby_all").css({display:"block",visibility:"visible",opacity:"0"}) // 先別完全顯現
	
		$("#lobby_all").animate({opacity:"1"},2000)
		$(".scene").animate({opacity:"1"},2000)
		await delay(2100)
		$("#skip").click(skip_func) // 此時恢復 skip 按鈕
		go_on_story["do"] = false // 設回來 false
		*/
	}

	// 預設，開啟 lobby story
	//$("#lobby_story").css({display:"none",visibility:"hidden"})
	//$("#lobby_all").css({display:"none",visibility:"hidden"})
	// 開啟 lobby story
	async function init_lobby_story(story_p_arr,story_type_str,go_on_story){
		need_go_on_figure_story = false
				// 我不管了!!給我打開，不然一直顯示，煩死
				$("#figure_story , #Scrol1 , #Scrol1_in , #book , #images , #fac_flag , #say , #name").css({
					display:"none",
					visibility:"hidden",
					opacity:"0",
				})

		//$("#skip").click("skip_func("+need_go_on_figure_story+")")
		console.log("\nKKK\n")
		// 預設，先設 true
		/*
		go_on_story["do"] = true
	
		$("body").css({background:"black"}) // 先黑屏，不然跳轉 URL 時，一瞬間會出現閃光白屏
		$("#lobby_all").css({display:"none",visibility:"hidden"})
		$(".scene").css({display:"none",visibility:"hidden"})
		*/
		//await init_figure_story(go_on_story)
		//await close_lobby(go_on_story)


		// 這句太暴力了
		//$("#lobby_story").css({display:"none",visibility:"hidden"})
		$("#type_word , #p_content").css({display:"none",visibility:"hidden"})
		$("#story_back, #skip , #show").css({display:"block",visibility:"visible",opacity:"0"})
	
		$("#story_back, #skip , #show").animate({opacity:"1"},1000)
		await delay(1200)
	
		await go_p(story_p_arr,story_type_str,go_on_story)
		//console.log("KKK")
		// 到這邊，都還算正常
		
		$("#skip").click(undefined) // 此時先讓 skip 按鈕禁按
	
		await delay(1000) // 再暫留1秒
		
	
	
		//$("body").css({background:"black"})
		$("#skip , #show").css({opacity:"1"})
			.animate({opacity:"0",color:"black"},1000)
		
		await delay(1100) // 等待消失完
		$("body").css({background:"black"})
		$("#story_back").animate({opacity:"0",color:"black"},1000)
		await delay(1100)
		$("#show").html("")
		// 到這邊，都還算正常
		
		if(!go_on_story["do"]){ // 如果已經按下 skip 按鈕，就不會繼續往下跑
	 		await close_lobby_story(go_on_story,need_go_on_figure_story)
			 return
		}
		
		await close_lobby_story(go_on_story,need_go_on_figure_story)
		
		/*
		$("#type_word , #p_content").css({display:"none",visibility:"hidden"})
		$("#story_back, #skip , #show").css({display:"none",visibility:"hidden"})
		
		$(".scene").css({opacity:"0",display:"block",visibility:"visible"})
		$("#lobby_all").css({display:"block",visibility:"visible",opacity:"0"}) // 先別完全顯現
	
		$("#lobby_all").animate({opacity:"1"},2000)
		$(".scene").animate({opacity:"1"},2000)
		await delay(2100)
		$("#skip").click(skip_func) // 此時恢復 skip 按鈕
		go_on_story["do"] = false // 設回來 false
		//$("#story_back")
		*/
	}
	
	async function common_enter_lobby(){
		$(".scene , #skip , #show , #story_back , body").css({display:"none",visibility:"hidden",opacity:"0"})
		$("body").css({background:"black"})
		await delay(200)
	
		// 先別完全顯現
		// 記得 body 也要加上，這樣黑屏時，room & 按鈕才不會顯現
		$("#lobby_all , .scene , body").css({display:"block",visibility:"visible",opacity:"0"}) 
	
		$("#lobby_all , .scene , body").animate({opacity:"1"},1000)
		//$(".scene").animate({opacity:"1"},2000)
		await delay(1100)
		$("body").css({background:"transparent"})
	}
	
	var not_from_login = $("#not_from_login").length
	if(not_from_login!=0){ // 一般顯引特效
		await common_enter_lobby()
		return
	}
	
	var from_login = $("#from_login").length
	
	if(from_login!=0){ // 放一段故事
		await close_lobby(go_on_story)
		await init_lobby_story(story_p_arr,story_type_str,go_on_story,true)
		return
	}
// ************************************* ** 人物介紹
                var figure_say = [
                    [
                    	// 威廉，王子
                    	"理查的養子，理查利用他來爭奪王位的繼承權，內心單純，一直認為理查是一位仁慈的父親，並且從小與安妮一起長大，是兒時的玩伴，感情相當的深厚。",
                    	// 理查，爸爸
                    	"表面看似忠厚老實，內心其實是狡詐的老狐狸。此外，他表面上對威廉相當慈祥，殊不知，他只是在利用威廉來達成他的野心。",
                    ],
                    [   
                        // 瑪莉，皇后
                        "在亨利逝世後代理王位，與女兒的感情相當親膩，她教導安妮正直與勇氣，並且自詡成為一名好的女皇，期許能使英格蘭再次強大，是個善良與正直的人。",
                        // 安妮，公主
                        "年僅16歲，是瑪麗的唯一女兒，從小便經歷了許多宮廷的鬥爭，即使深知政局是如此的黑暗，她仍就希望為英格蘭帶來一絲和平的曙光。"
                    ]

                ]

                var figure_name=[
                    [
                        "威廉 William",
                        "理查 Richard"
                    ],

                    [   
                        "瑪莉 Mary",
                        "安妮 Annie"
                    ]
                ]


				 var figure = [
				 	".blue",".red",
				 ]

				// Blue.png
                                     // Red.png
				var figure_flag=[ "Blue.png","Red.png"]
				
				// #Scrol1 , #Scrol1_in , #book , #images , #fac_flag , #say , #name
				$("#figure_story , #Scrol1 , #Scrol1_in , #book , #images , #fac_flag , #say , #name").css({
					display:"none",
					visibility:"hidden",
					opacity:"0",
				})
				

}
whole()
})