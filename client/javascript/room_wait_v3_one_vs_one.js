$(function(){
	
	// 紀錄，初始狀態，遮圖的 relative 的 top , left
	
	var out_fac_a_screen = {

		left:"20%",
	  	top:"20%",
	 	width: "70%",
	 	height:"40%",
		"z-index":5,
	}

	var out_fac_b_screen = {

		left:"0px",
	  	top:"150px",
	  	width: "100%",
	  	height:"50%",
		  "z-index":5,
	}

	var out_fac_a_mobile = {
		left:"80px",
	  	top:"150px",
	  	width: "80%",
	  	height:"40%",
		  "z-index":5,
	}

	var out_fac_b_mobile = {
		left:"0px",
	  	top:"150px",
	  	width: "100%",
	  	height:"50%",
		  "z-index":5,
	}

	// 一開始先隱藏
	$("#Fac_img").css({visibility:"hidden"})
	

	/*
	var fac_fade_top;
	var fac_fade_left;
	fac_fade_top = $("#Fac_fade").css("top")
	fac_fade_left = $("#Fac_fade").css("left")
	// fac_fade_top : 57.9972px , fac_fade_left : 199.957px
	console.log("fac_fade_top : "+fac_fade_top+" , fac_fade_left : "+fac_fade_left)
	*/
	
	// 紀錄現在陣營
    var now_fac = 'A'
	var in_phone = false
	function rwd_regulate(){

		var x = window.matchMedia("(min-width: 1000px)")		
		if (x.matches) { // 大螢幕
			$("#outer").addClass("ui grid segment")
			$(".button_area").addClass("four wide column ui segment container")
			$(".chess_area").addClass("eleven wide column ui segment container")


			$("#Fac_fade").css({

				left:"20%",
	  			top:"20%",
	 			width: "70%",
	 			height:"40%",
				"z-index":5,
			})
		} else { // 手機
			$("#outer").addClass("ui segment")
			$(".button_area").addClass("ui segment container").css({height:"40%"})
			$(".chess_area").addClass("ui segment container").css({height:"60%"})

			$("#ChangeFaction").css({position:"relative",bottom:"10px"})
			$("#Ready").css({position:"absolute",left:"65%",bottom:"10%"}) // 用 relative 一直調不好，煩死
				
			$("#Fac").css({visibility:"hidden"}) // 管他的，先隱藏，在 renewUser 時，獨到自己的時，就會顯示 flag 了
			//$("#Fac").css({position:"absolute",top:"30%",left:"35%"})
			
			$(".block").css({position:"relative",left:"-15%",top:"10%",width:"150%",height:"150%"})
			
			// 所有
			//ss = $(".block").css()
			//alert(JSON.stringify(ss))
		}
	}



	
	rwd_regulate()
	$(window).resize(rwd_regulate)

	var out_username = String($("#username").val()).trim()
	// 搶先取得username，不斷設回去
	setInterval(function(){
		$("#username").val(String(out_username))
	},100)

	var ori_fac = undefined

// 原先在外面的部份
    var socket = undefined
	
	var out_team_id = 0 // 預設0，可寫 1,2，在第一次取得此 room 所有玩家時，會更新自己玩家的 team_id
	var out_ready_id = 0 // 預設是0 (準備中)，可寫 0 跟 1 (準備好)
	
    
    // 紀錄，現在準備狀態
    var div=document.getElementById("ReadyFont");
    
    var first_time_need_renew_my_chess_flag = true


	var changeclick=true;
	var still_in_change_faction1 = false;
    var still_in_change_faction2 = false;

	function run_pen(){


			//console.log(changeclick);
			if(!pen_still_flying){
				pen_still_flying = true

				
				
				$('#pen').animate({"top":"-=200%"},200,
					
					function(){
						/*
					$('#Fac').fadeOut(3000,function(){
						if($('#Fac').hasClass("FacA")){
							$('#Fac').toggleClass("FacB");
							$('#Fac').removeClass("FacA");
						}
						else if($('#Fac').hasClass("FacB")){
							$('#Fac').toggleClass("FacA");
							$('#Fac').removeClass("FacB");
						}
						console.log("C1")     
						still_in_change_faction1 = false 
	
						setTimeout(function(){
							still_in_change_faction2 = false 
							console.log("G1")
						},3000)
        			});
					*/
					//$('#Fac').fadeIn(1500);
					
					var i,j,k;
					for(k=0;k<2;k++){
						for(i=0;i<20;i++){
							$('#pen').animate({"left":"+=5%"},8);
							for(j=0;j<10;j++){}
							$('#pen').animate({"top":"+=5%"},4);
							$('#pen').animate({"top":"-=5%"},4);
						}
        
						$('#pen').animate({"top":"+=80%","left":"-=100%"},400);
					}
        			$('#pen').animate({"top":"+=40%"},200,function(){

						pen_still_flying = false

					});
             
      			});
      			//console.log($('#Fac').attr('class'));
     		}else{
				 console.log("still pen is flying")
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
	
	        // 搞定
		    if(msg["event_name"]=="serverResponseLogout"){
		        if(msg["result"]=="ok"){
		            //alert("允許提交註冊")
					
					$("body").css({opacity:"1"})
					$("body").animate({opacity:"0"},600,function(){
	            	    name = String($("#username").val()).trim()
	                	$("#logoutName").val(name)
	                	$("#logoutHash").val(msg["logoutHash"])
	                	/*
	                 		<input id="loginName" name="loginName" type="hidden" />
	                		<input id="loginPass" name="loginPass" type="hidden" />
	                	*/
	
	                	//console.log("回到這邊了")
	                	// 通知斷線，省連線資源
						console.log("登出 , logoutName : "+logoutName+" , logoutHash : "+logoutHash)
	                	socket.emit("nonPlayingEvent",{event_name:"callForDisconnect"});
		            	$("#logoutForm").submit();
					})
		        }else{
		            alert(msg["cause"]) // 印出不允許的原因
		        }
		    }
	        // 搞定
	        else if(msg["event_name"]=="serverResponseLeaveRoom"){
	            // room 已經存在，檢查過了

				$("body").css({opacity:"1"})
				$("body").animate({opacity:"0"},600,function(){
					$("#leaveRoomUser").val($("#username").val())
	            	$("#leaveRoomId").val($("#room_id").val())
	            	$("#leaveRoomHash").val(msg["leaveRoomHash"])
	            	$("#leaveRoomForm").submit()
				})
	                        
	
	        }
	        // 搞定
	        else if(msg["event_name"]=="serverResponseCheckRoomExist"){
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
	        // 搞定
	        // 回報，使用者是否在線，若不在線，就強制登出
	        else if(msg["event_name"]=="serverResponseCheckOnline"){
	            //console.log("Check User Online : "+msg["isOnline"])
	            if(!msg["isOnline"]){
	                location.href="/login"
	            }
	
	        // 先搞定，變換陣營 + 狀態 (online) ，再回來繼續看這裡
	        // 部分搞定
	        }else if(msg["event_name"]=="serverResponseRenewRoomUser"){
	           // console.log("回應囉 : \n"+JSON.stringify(msg))
	           
	
	           //先把所有的block 設成看不見
	            $(".block").css({"visibility":"hidden"})
	
	           len=$(".block").length
	           join_room_user = msg["join_room_user"]
	           user_num = join_room_user.length
	           i=0
	           for(user in join_room_user){
	                
                    // 若是剛進入，則必須先更新自己的 棋子 & 旗子
                    // 之後手動按鈕更新，會在各在的 "serverResponseUserChangeTeam" , "serverResponseUserChangeReady" 處理
                    /*
					if(
                        (String(user)==String($("#username").val()))
                        && 

                        first_time_need_renew_my_chess_flag
                        ){
                            dom = $(".block").filter(
				                function(index){
		                            //console.log("k1 : "+$(this).find(".block_in").html()+" , "+$("#username").val())
				                    return ( ($(this).find(".block_in").html())==(String(user)) )  ;// 選取 目前 物件(抓每個<p>檢查) 內 <span> 數量，若是2就回傳 true
				                }
				            )

                            $(dom).css({visibility:"hidden"})
                             //$(  (".block:eq("+i+")")  ).css({"visibility":"hidden"})
	                    // 更新自己 所在陣營
                        // 更新棋子
	                    out_team_id = join_room_user[user]["team_id"]
                        if(out_team_id == 1){
                            now_fac = 'A'
                            $('#Fac').addClass("FacA").removeClass("FacB")
                        }else if(out_team_id == 2){
                            now_fac = 'B'
                            $('#Fac').addClass("FacB").removeClass("FacA")
                        }


                        // 更新棋子顏色
                        if(join_room_user[user]["team_id"]==1){
	                        // 紅隊 A對
	                        $(  (".block:eq("+i+")")  ).removeClass("chessB",).addClass("chessA")
	                        //back_color="red"
	                    }else if(join_room_user[user]["team_id"]==2){
	                        // 藍隊 B對
	                        $(  (".block:eq("+i+")")  ).removeClass("chessA",).addClass("chessB")
	                        //back_color="blue"
	                    }

                        // 更新完，才會顯示旗子，這樣比較不醜
                        //$("#Fac").css({visibility:"visible"})

                        


                        // 更新準備狀態
                            
                        if(join_room_user[user]["status"]){ // 準備好了
                            
                            if(dom.length==1){
		                        dom = dom[0]
                                if(join_room_user[user]["team_id"]==1){
                                     $(dom).css({"-webkit-filter": "drop-shadow(0px 0px 40px rgba(255, 0, 0, 0.8))"});
                                }else if(join_room_user[user]["team_id"]==2){
                                    $(dom).css({"-webkit-filter": "drop-shadow(0px 0px 40px rgba(0, 191, 255, 0.8))"});
                                }
                            }
                        }else{
                            if(dom.length==1){
		                        dom = dom[0]
                                $(dom).css({"-webkit-filter": ""});
                            }
                        }

                        // 有動畫效果的
                        $("#Fac").css({visibility:"visible", opacity: 0.0})
							.animate({opacity: 0.2},200)
						    .animate({opacity: 0.4},200)
							.animate({opacity: 0.6},200)
							.animate({opacity: 0.8},200)
							.animate({opacity: 1.0},200)

                        // 有動畫效果的
                        //$(dom)
                        
                         $(  (".block:eq("+i+")")  ).css({visibility:"visible", opacity: 0.0})
							.animate({opacity: 0.2},200)
						    .animate({opacity: 0.4},200)
							.animate({opacity: 0.6},200)
							.animate({opacity: 0.8},200)
							.animate({opacity: 1.0},200,function(){
                                    console.log("P1")
                                    
                            })

                        

                        first_time_need_renew_my_chess_flag = false
                        console.log("初始載入 , now_fac : "+now_fac+" , ")	                   
                        // console.log("out_team_id : "+out_team_id)
	                }
                    
					*/
					//console.log("user : "+user)
					// 更新全域變數就好
					// 有換旗子的動畫
					if(
                        (String(user)==String($("#username").val()))

						//&&
						//first_time_need_renew_my_chess_flag

					){
						
						// 注意，旗子若要加動畫，得跑得比定時更新還快 (兩個 setInterval)
						// setInterval 現在為 2000，旗子動畫時常為 800+800 = 1600 ，比 2000 小。還OK
						// 為了動畫效果，還把 後端 monitor() 的時間間隔調成2100，原本1050
						// 旗子動畫，成功 
						// 旗子只限我方

						out_team_id = join_room_user[user]["team_id"]

						var x = window.matchMedia("(min-width: 1000px)")		
						
							each_pen_time = -1
						   if (x.matches){

								each_pen_time = 150
						   }else{
								each_pen_time = 200
						   }

						//$('#Fac').css({visibility:"visible"})
                       // console.log("進來了 ,  : "+out_team_id)
						if(out_team_id == 1){
                            now_fac = 'A'
                           //console.log("開始動畫 , out_team_id : "+out_team_id)
							// v1 版，隊旗單純 fade 顯引
							/*	
							if(!ori_fac){

								//初次顯示時，也要對手機做調整
									var x = window.matchMedia("(min-width: 1000px)")		
									if (! x.matches) { // 手機
										$("#Fac").css({position:"absolute",top:"30%",left:"35%"})
									}

								//console.log("e1 : "+ori_fac+" , now_fac : "+now_fac)
								$('#Fac').fadeOut(800,function(){
							   		$('#Fac').addClass("FacA").removeClass("FacB")
						   			$('#Fac').css({visibility:"visible"})

									$('#Fac').fadeIn(800,function(){})
						   		})
								   ori_fac = now_fac
							}else{
								if(ori_fac!= now_fac){ // 代表要更新，使用動畫效果

									run_pen()

									var x = window.matchMedia("(min-width: 1000px)")		
									if (! x.matches) { // 手機
										$("#Fac").css({position:"absolute",top:"30%",left:"35%"})
									}
									$('#Fac').css({visibility:"hidden"})
									//console.log("e2 : "+ori_fac+" , now_fac : "+now_fac)
									$('#Fac').fadeOut(800,function(){
							   			$('#Fac').addClass("FacA").removeClass("FacB")
						   				$('#Fac').css({visibility:"visible"})

										$('#Fac').fadeIn(800,function(){})
						   			})


									   ori_fac = now_fac
								}else{
									//console.log("e3 : "+ori_fac+" , now_fac : "+now_fac)
									// 同隊伍，沒變，不須特效
									$('#Fac').addClass("FacA").removeClass("FacB")
						   				$('#Fac').css({visibility:"visible"})
										   ori_fac = now_fac
								}
							}
						   */

						  

						   // v2 : 隊旗 由上而下出現

						   if(!ori_fac){

								$("#Fac_img").css({visibility:"hidden"})
								$("#Fac_img").prop("src","../image/Red.png")
								
								if (x.matches){

									$("#Fac_wrapper").css(out_fac_a_screen)
								
									
						
								}else{
									$("#Fac_img").css({width:"60%",height:(($(window).height()*0.15)+"px")})
									$("#Fac_img").css({visibility:"visible"})
									
									$("#Fac_wrapper").css({
										//position:"absolute"
										top:"25%",left:"27%"
										,width:(($(window).width()*0.6)+"px"),
										height:(($(window).height()*0.3)+"px"),
										})
									
								}

									$("#Fac_img").css({visibility:"visible"})
								
									height = $("#Fac_wrapper").height()

									// 高度先歸零
									$("#Fac_wrapper").css({height:"0px"})

									max = 20
									for(i=1;i<max;++i){
										gg = i*(1/max)
										$("#Fac_wrapper").animate(  {height:((height*gg)+"px")   },each_pen_time)
									}

								ori_fac = now_fac
							}else{
								
								if(ori_fac!= now_fac){ // 代表要更新，使用動畫效果

									run_pen()

									$("#Fac_img").css({visibility:"hidden"})
									$("#Fac_img").prop("src","../image/Red.png")
									
									if (x.matches){

										$("#Fac_wrapper").css(out_fac_a_screen)
								
									
						
									}else{
										$("#Fac_img").css({width:"60%",height:(($(window).height()*0.15)+"px")})
										
										
										$("#Fac_wrapper").css({
											//position:"absolute"
											top:"25%",left:"27%"
											,width:(($(window).width()*0.6)+"px"),
											height:(($(window).height()*0.3)+"px"),
											})
									}

									$("#Fac_img").css({visibility:"visible"})
								
									height = $("#Fac_wrapper").height()

									// 高度先歸零
									$("#Fac_wrapper").css({height:"0px"})

									max = 20
									for(i=1;i<max;++i){
										gg = i*(1/max)
										$("#Fac_wrapper").animate(  {height:((height*gg)+"px")   },each_pen_time)
									}

									ori_fac = now_fac
								}else{
									// 跟原本同隊，不用特別改
									ori_fac = now_fac
								}
								
							}
						   

						   // v0 原版
						   /*
						   $('#Fac').addClass("FacA").removeClass("FacB")
						   $('#Fac').css({visibility:"visible"})
						   */
						}else if(out_team_id == 2){
                            now_fac = 'B'
							

							if(!ori_fac){
								$("#Fac_img").css({visibility:"hidden"})
								$("#Fac_img").prop("src","../image/Blue.png")
								

								if (x.matches){
									$("#Fac_wrapper").css(out_fac_b_screen)
								}else{
									$("#Fac_img").css({width:"60%",height:(($(window).height()*0.15)+"px")})

									$("#Fac_wrapper").css({
											//position:"absolute"
											top:"25%",left:"27%"
											,width:(($(window).width()*0.6)+"px"),
											height:(($(window).height()*0.3)+"px"),
											})
								}


								
								$("#Fac_img").css({visibility:"visible"})
								
								height = $("#Fac_wrapper").height()
								top = parseInt( $("#Fac_wrapper").css("top") )

								// 高度先歸零
								$("#Fac_wrapper").css({height:"0px"})

								max = 20
								for(i=1;i<max;++i){
									gg = i*(1/max)
									$("#Fac_wrapper").animate(  {height:((height*gg)+"px")   },each_pen_time)
								}

								ori_fac = now_fac
							}else{
								if(ori_fac!= now_fac){ // 代表要更新，使用動畫效果

									run_pen()

									$("#Fac_img").css({visibility:"hidden"})
									$("#Fac_img").prop("src","../image/Blue.png")
									

									if (x.matches){
										$("#Fac_wrapper").css(out_fac_b_screen)
									}else{
										$("#Fac_img").css({width:"60%",height:(($(window).height()*0.15)+"px")})

										$("#Fac_wrapper").css({
											//position:"absolute"
											top:"25%",left:"27%"
											,width:(($(window).width()*0.6)+"px"),
											height:(($(window).height()*0.3)+"px"),
											})
									}


									
									$("#Fac_img").css({visibility:"visible"})
								
									height = $("#Fac_wrapper").height()
									top = parseInt( $("#Fac_wrapper").css("top") )

									// 高度先歸零
									$("#Fac_wrapper").css({height:"0px"})

									max = 20
									for(i=1;i<max;++i){
										gg = i*(1/max)
										$("#Fac_wrapper").animate(  {height:((height*gg)+"px")   },each_pen_time)
									}


									   ori_fac = now_fac
								}else{




										   ori_fac = now_fac
								}
							}

							// 原版
							/*
							$('#Fac').addClass("FacB").removeClass("FacA")
							$('#Fac').css({visibility:"visible"})
							*/
						}

						//first_time_need_renew_my_chess_flag = false
					}
					
	                // block_in
	                 //$(  (".block:eq("+i+")")  ).find(".player").html(user)
	                 $(  (".block:eq("+i+")")  ).find(".block_in").html(user)
                     
					 
					 //console.log("\nww : "+$(window).width()+" , wh : "+$(window).height()+"\n")
                     $(  (".block:eq("+i+")")  ).css({visibility:"visible", opacity: 1.0,})
	                
                   // 對不是自己的，更新 棋子顏色 & 準備狀態
                   if(   //(String(user)!=String($("#username").val())) 
				   	true
                        
						// 不要打開，打開問題會很多
						//||

                        //((String(user)==String($("#username").val())) && (!first_time_need_renew_my_chess_flag))
                     ){
	                    $(  (".block:eq("+i+")")  ).css({"visibility":"hidden"})
                        // 棋子顏色
                        if(join_room_user[user]["team_id"]==1){
	                        // 紅隊 A對
	                        $(  (".block:eq("+i+")")  ).removeClass("chessB",).addClass("chessA")
	                        //back_color="red"
	                    }else if(join_room_user[user]["team_id"]==2){
	                        // 藍隊 B對
	                        $(  (".block:eq("+i+")")  ).removeClass("chessA",).addClass("chessB")
	                        //back_color="blue"
	                    }

						// 自己的旗子
						if(String(user)==String($("#username").val())){
							if(join_room_user[user]["team_id"]==1){
								$('#Fac').addClass("FacA").removeClass("FacB")
							}else if(join_room_user[user]["team_id"]==2){
								$('#Fac').addClass("FacB").removeClass("FacA")
						
							}
						}

						/*
						// 第一次顯示時，更新旗子
						if(first_time_need_renew_my_chess_flag){
							if(join_room_user[user]["team_id"]==1){ // 紅隊

							}else{ // 藍隊

							}
							first_time_need_renew_my_chess_flag = false
						}
						*/

                        // 更新準備狀態
		                if(  join_room_user[user]["status"] ){
		                	//console.log("DDDD")
		                    
		                    // 不需要這兩行
		                    //div.innerHTML = "Ready";
		                    //changeclick=false;
		                      
		
		                    // 測試，只變'#one'
		                    if(join_room_user[user]["team_id"]==1){ // A對，進入準備狀態
		
								// 記得改成，每個人各自的區塊，不一定是 #one
		                    	//$('#one').css({"-webkit-filter": "drop-shadow(0px 0px 40px rgba(255, 0, 0, 0.8))"});
		                        //$('#one').addClass("chessA").removeClass("chessB")
		
		                        
		                        // 找 有哪個 .block ，裡面的 .block_in 的 html() 為 aaa(玩家名稱)，找到指定玩家在的位置
		                        dom = $(".block").filter(
				                    function(index){
		                                // 在這邊，是耕莘每個玩家顯示，所以改寫 String(user) ，因為是對各自玩家
				                        return ( ($(this).find(".block_in").html())==(String(user)) )  ;// 選取 目前 物件(抓每個<p>檢查) 內 <span> 數量，若是2就回傳 true
				                    }
				                )
		
		                        // 對第一個 block 加上 css
		                        if(dom.length==1){
		                            dom = dom[0]
		                            
		                            $(dom).css({"-webkit-filter": "drop-shadow(0px 0px 40px rgba(255, 0, 0, 0.8))"});
		                            
		                            // 用 class 無法顯示想要的..不知為啥
		                            //$(dom).addClass("ready_a").removeClass("ready_b").removeClass("ready_no")
		                        }
		
		                        
		                    }
		                    else{ // B對，進入準備狀態
		
		                        // 找 有哪個 .block ，裡面的 .block_in 的 html() 為 aaa(玩家名稱)，找到指定玩家在的位置
		                        dom = $(".block").filter(
				                    function(index){
		                                //console.log("k1 : "+$(this).find(".block_in").html()+" , "+$("#username").val())
				                        return ( ($(this).find(".block_in").html())==(String(user)) )  ;// 選取 目前 物件(抓每個<p>檢查) 內 <span> 數量，若是2就回傳 true
				                    }
				                )
		
		                        // 對第一個 block 加上 css
		                        if(dom.length==1){
		                            dom = dom[0]
		                            
		                            $(dom).css({"-webkit-filter": "drop-shadow(0px 0px 40px rgba(0, 191, 255, 0.8))"});
		                            
		                            // 用 class 無法顯示想要的..不知為啥
		                            //$(dom).addClass("ready_a").removeClass("ready_b").removeClass("ready_no")
		                        }
		        
		            		}
		
						}
						else{
		                     // 不需要這兩行
		                    //changeclick=true;
		                	//div.innerHTML = curText;
		
							// 記得改成，每個人各自的區塊，不一定是 #one
		                        dom = $(".block").filter(
				                    function(index){
		                                //console.log("k1 : "+$(this).find(".block_in").html()+" , "+$("#username").val())
				                        return ( ($(this).find(".block_in").html())==(String(user)) )  ;// 選取 目前 物件(抓每個<p>檢查) 內 <span> 數量，若是2就回傳 true
				                    }
				                )
		                        if(dom.length==1){
		                            dom = dom[0]
		                            
		                            $(dom).css({"-webkit-filter": ""})
		                            
		                            // 用 class 無法顯示想要的..不知為啥
		                            //$(dom).addClass("ready_a").removeClass("ready_b").removeClass("ready_no")
		                        }
		                        //console.log(changeclick);
						}

                         $(  (".block:eq("+i+")")  ).css({"visibility":"visible"})
                   }
	
	
	                // $((".block:eq("+i+") > div")).eq(0).css({"background-color":back_color})
	               
                   // 這句放到 if(String(user)!=String($("#username").val())){ ... 內
                   // $(  (".block:eq("+i+")")  ).css({"visibility":"visible"})
	               
	               
	               
	               ++i
	            }
	           
	
	        }

            // 已搞定，有加上動畫效果
	        else if(msg["event_name"]=="serverResponseUserChangeTeam"){
	            if(msg["result"]=="ok"){
	
	                console.log("A2")
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


			                        dom = $(".block").filter(
						                    function(index){
				                                // 在這邊，是耕莘每個玩家顯示，所以改寫 String(user) ，因為是對各自玩家
						                        return ( ($(this).find(".block_in").html())==(String(user)) )  ;// 選取 目前 物件(抓每個<p>檢查) 內 <span> 數量，若是2就回傳 true
						                    }
						            )
				
				                        

                                    // 換陣營，變換棋子顏色 + 自己faction用的旗子，兩個的 css ，更新寫在 "serverResponseRenewRoomUser"
                                    if(out_team_id==1){
                                        now_fac = 'A'
                                        
										// 這個也丟到 renex user
                                        // 換旗子
                                        //$('#Fac').addClass("FacA").removeClass("FacB")

										/*
                                        // 換棋子顏色
				                        if(dom.length==1){
				                            dom = dom[0]
				                            $(dom).removeClass("chessB",).addClass("chessA")
				                        }
                                        */

										/*
                                        // 這段是有動畫效果的
                                        $('#Fac').fadeOut(1000,function(){
                		                    $('#Fac').addClass("FacA").removeClass("FacB")
                		                    $('#Fac').fadeIn(1000,function(){ })
            		                    })


                                        if(dom.length==1){
				                            dom = dom[0]
                                            $(dom).fadeOut(1000,function(){
                                                $(dom).removeClass("chessB",).addClass("chessA")
                                                $(dom).fadeIn(1000,function(){ })
                                            })
				                        }
										*/

                                    }else if(out_team_id==2){
                                        now_fac = 'B'

                                        // 這個也丟到 renex user
                                        //$('#Fac').addClass("FacB").removeClass("FacA")
										/*
                                         // 換棋子顏色
				                        if(dom.length==1){
				                            dom = dom[0]
				                            $(dom).removeClass("chessA",).addClass("chessB")
				                        }
                                        */

										/*
                                        // 這段是有動畫效果的
                                        $('#Fac').fadeOut(1000,function(){
                		                    $('#Fac').addClass("FacB").removeClass("FacA")
                		                    $('#Fac').fadeIn(1000,function(){ })
            		                    })


                                        if(dom.length==1){
				                            dom = dom[0]
                                            $(dom).fadeOut(1000,function(){
                                                $(dom).removeClass("chessA",).addClass("chessB")
                                                $(dom).fadeIn(1000,function(){ })
                                            })
				                        }
										*/
                                    }


                                    
                                    
	                                console.log("A3 , out_team_id : "+out_team_id+" , now_fac : "+now_fac)
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

            // 已搞定
	        else if(msg["event_name"]=="serverResponseUserChangeReady"){
	            if(msg["result"]=="ok"){
	                console.log("B2")
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
									out_ready_id = data["new_ready_id"]
									
                                     dom = $(".block").filter(
						                    function(index){
				                                // 在這邊，是耕莘每個玩家顯示，所以改寫 String(user) ，因為是對各自玩家
						                        return ( ($(this).find(".block_in").html())==(String($("#username").val())) )  ;// 選取 目前 物件(抓每個<p>檢查) 內 <span> 數量，若是2就回傳 true
						                    }
						            )

	                                // 成功回來了
	                                // 更新，換好的 new_ready_id 到全域變數去
	                                
                                    if(out_ready_id==0){
                                        div.innerHTML = "Wait";

                                        
                                        if(dom.length==1){
				                            dom = dom[0]
                                            //console.log("r0")
                                            $(dom).css({"-webkit-filter": ""});
                                        }
                                
                                    }else if(out_ready_id==1){
                                        div.innerHTML = "Ready";
                                        // 棋子亮燈 or 不亮，代表是否準備好
                                        if(dom.length==1){
				                            dom = dom[0]
                                            if(now_fac=='A'){
                                                //console.log("r1")
												$(dom).css({"-webkit-filter": "drop-shadow(0px 0px 40px rgba(255, 0, 0, 0.8))"});
                                            }else if(now_fac=='B'){
												//console.log("r2")
											    $(dom).css({"-webkit-filter": "drop-shadow(0px 0px 40px rgba(0, 191, 255, 0.8))"});
                                            }
				                               
				                        }
                                    }
                                    
                                    

                                    console.log("B3 , out_ready_id : "+out_ready_id+" , div.innerHTML : "+div.innerHTML)
	                                //console.log("更新本地 out_ready_id : "+out_ready_id)
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
	
	        else if(msg["event_name"]=="serverInformStartGame"){
	            console.log("出現了 : "+JSON.stringify(msg))
	            $("#startGameUser").val(msg["user"])
	            $("#startGameRoom").val(msg["room_id"])
	            $("#startGameHash").val(msg["start_game_hash"])
	            $("#startGameForm").submit()
	    
	
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
	
	
	function informAddRoom(){
	    obj2 = Object()
	    obj2["event_name"] = "request_informAddRoom"
	    obj2["user"] = $("#username").val()
	    obj2["room_id"] = $("#room_id").val()
	    socket.emit("nonPlayingEvent",obj2)
	    console.log("發射~")
	}
	
	
	function resize_dom(){
	
	    width = $(window).width()
	    $(".ready_button").width(width*0.2)
	    $(".team_button").width(width*0.2)
	}



// **********************  後端的功能
	setInterval(checkOnline,2000)
    setInterval(renew_room_user_list,2000)
    informAddRoom() // 發動一次就好了

	// 登出按鈕
	$("#Signout").click(function(){
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
    $("#Leave").click(function(){
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
// ************************ 頁面上的
		/*
		var changeclick=true;
		var still_in_change_faction1 = false;
    	var still_in_change_faction2 = false;
		*/
		var ele = document.getElementById("Ready");
		
        // 移到上面去
        //var div=document.getElementById("ReadyFont");
		var curText = div.innerHTML;
		var target;
		var FacChange=document.getElementById("ChangeFaction");
		
		var pen_still_flying = false


        // 拉到上面去
        // 紀錄現在陣營
        // var now_fac = 'A'

		// 變換準備狀態按鈕
    	ele.addEventListener("click", function(){
            
            // 原作者寫的
            /*
        	if((!still_in_change_faction1)&&(!still_in_change_faction2)&&(!pen_still_flying)){
                
				if(div.innerHTML == 'Wait'   ){
                	//console.log("DDDD")
                    div.innerHTML = "Ready";
                    changeclick=false;
                      

                    // 測試，只變'#one'
                    if($('#Fac').hasClass("FacA")){ // A對，進入準備狀態

						// 記得改成，每個人各自的區塊，不一定是 #one
                    	//$('#one').css({"-webkit-filter": "drop-shadow(0px 0px 40px rgba(255, 0, 0, 0.8))"});
                        //$('#one').addClass("chessA").removeClass("chessB")

                        
                        // 找 有哪個 .block ，裡面的 .block_in 的 html() 為 aaa(玩家名稱)，找到指定玩家在的位置
                        dom = $(".block").filter(
		                    function(index){
                                //console.log("k1 : "+$(this).find(".block_in").html()+" , "+$("#username").val())
		                        return ( ($(this).find(".block_in").html())==($("#username").val()) )  ;// 選取 目前 物件(抓每個<p>檢查) 內 <span> 數量，若是2就回傳 true
		                    }
		                )

                        // 對第一個 block 加上 css
                        if(dom.length==1){
                            dom = dom[0]
                            
                            $(dom).css({"-webkit-filter": "drop-shadow(0px 0px 40px rgba(255, 0, 0, 0.8))"});
                            
                            // 用 class 無法顯示想要的..不知為啥
                            //$(dom).addClass("ready_a").removeClass("ready_b").removeClass("ready_no")
                        }

                        console.log(changeclick);
                    }
                    else{ // B對，進入準備狀態

                        // 找 有哪個 .block ，裡面的 .block_in 的 html() 為 aaa(玩家名稱)，找到指定玩家在的位置
                        dom = $(".block").filter(
		                    function(index){
                                //console.log("k1 : "+$(this).find(".block_in").html()+" , "+$("#username").val())
		                        return ( ($(this).find(".block_in").html())==($("#username").val()) )  ;// 選取 目前 物件(抓每個<p>檢查) 內 <span> 數量，若是2就回傳 true
		                    }
		                )

                        // 對第一個 block 加上 css
                        if(dom.length==1){
                            dom = dom[0]
                            
                            $(dom).css({"-webkit-filter": "drop-shadow(0px 0px 40px rgba(0, 191, 255, 0.8))"});
                            
                            // 用 class 無法顯示想要的..不知為啥
                            //$(dom).addClass("ready_a").removeClass("ready_b").removeClass("ready_no")
                        }
                        console.log(changeclick);
            		}

				}
				else{
                  
                    changeclick=true;
                	div.innerHTML = curText;

					// 記得改成，每個人各自的區塊，不一定是 #one
                    

                        dom = $(".block").filter(
		                    function(index){
                                //console.log("k1 : "+$(this).find(".block_in").html()+" , "+$("#username").val())
		                        return ( ($(this).find(".block_in").html())==($("#username").val()) )  ;// 選取 目前 物件(抓每個<p>檢查) 內 <span> 數量，若是2就回傳 true
		                    }
		                )
                        if(dom.length==1){
                            dom = dom[0]
                            
                            $(dom).css({"-webkit-filter": ""})
                            
                            // 用 class 無法顯示想要的..不知為啥
                            //$(dom).addClass("ready_a").removeClass("ready_b").removeClass("ready_no")
                        }
                        console.log(changeclick);
                    
				}
			}else {
				console.log("still in change faction , can not change ready state")
			}
            */
            
			if(pen_still_flying){
				console.log("pen is still flying , can not change ready state")
				return
			}

            new_out_ready_id  = -1
            if(div.innerHTML == 'Wait'){ // 準備中 ，切換成 準備好了
                // 更新全域變數，移到上面，ws >> response >> ajax >> success
                /*
                div.innerHTML = "Ready";
                out_ready_id  = 1
                */
                new_out_ready_id = 1
            }else{ // 準備好了 ，切換成 準備中
                /*
                div.innerHTML = "Wait";
                out_ready_id  = 0
                */
                new_out_ready_id = 0
            }

            //console.log("B1")
            obj = Object()
            obj["event_name"] = "requestUserChangeReady"
            obj["user"] = $("#username").val()
            obj["new_ready_id"] = new_out_ready_id
            obj["room_id"] = $("#room_id").val()
            socket.emit("nonPlayingEvent",obj)


		}, false);
		
		// 換陣營按鈕
		FacChange.addEventListener("click", function(){
			// 檢查，準備完成，不能換對

			if(pen_still_flying){
				console.log("pen is still flying , can not change faction")
				return
			}

			if(div.innerHTML == 'Ready'){
				console.log("準備完成，不可變換陣營")
				return
			}

            // 原本 原作者寫的
            /*
            console.log(changeclick);
			if(changeclick&&(!pen_still_flying)){
				pen_still_flying = true

				if(now_fac=='A'){ // A隊換成B隊

					$('#one').fadeOut(4000,function(){
                		$('#one').removeClass("chessA").addClass("chessB")
                		$('#one').fadeIn(2000,function(){})
					})
					now_fac = 'B'
				}else{ // B隊換A隊
            
            		$('#one').fadeOut(4000,function(){
                		$('#one').removeClass("chessB",).addClass("chessA")
                		$('#one').fadeIn(2000,function(){ })
            		})
           
            		now_fac = 'A'
        		}
				still_in_change_faction1  = true
				still_in_change_faction2  = true
				
				$('#pen').animate({"top":"-=200%"},500,function(){
					$('#Fac').fadeOut(3000,function(){
						if($('#Fac').hasClass("FacA")){
							$('#Fac').toggleClass("FacB");
							$('#Fac').removeClass("FacA");}
						else if($('#Fac').hasClass("FacB")){
							$('#Fac').toggleClass("FacA");
							$('#Fac').removeClass("FacB");
						}
						console.log("C1")     
						still_in_change_faction1 = false 
	
						setTimeout(function(){
							still_in_change_faction2 = false 
							console.log("G1")
						},3000)
        			});
					
					$('#Fac').fadeIn(1500);
					var i,j,k;
					for(k=0;k<2;k++){
						for(i=0;i<20;i++){
							$('#pen').animate({"left":"+=5%"},20);
							for(j=0;j<10;j++){}
							$('#pen').animate({"top":"+=5%"},10);
							$('#pen').animate({"top":"-=5%"},10);
						}
        
						$('#pen').animate({"top":"+=80%","left":"-=100%"},1000);
					}
        			$('#pen').animate({"top":"+=40%"},500,function(){

						pen_still_flying = false

					});
             
      			});
      			console.log($('#Fac').attr('class'));
     		}else{
				 console.log("still in change faction , can not change faction again")
			}
            */

            // 先送 封包過去，通知一下
            new_team_id = -1
            if(now_fac=='A'){
                new_team_id =2 // 原本A，現在要改B
                /*
                out_team_id = 2
                now_fac = 'B'
                */
            }else{
                new_team_id = 1 // 原本B，現在要改A
                // 要改全域變數，到 ws 接收回應內的 Ajax 的 success func 寫，確定收到了，再改
                
                
                /*
                now_fac = 'A' // 這個記得也要改!!!，紀錄隊伍的全域變數
                out_team_id = 1    
                */
            }
            

             
            obj = Object()
            obj["event_name"] = "requestUserChangeTeam"
            obj["user"] = $("#username").val()
            obj["new_team_id"] = new_team_id
            obj["room_id"] = $("#room_id").val()
            //console.log("A1 , now fac : "+now_fac)
            socket.emit("nonPlayingEvent",obj)

    	}, false);


// body

$("body").css({opacity:"0"})
$("body").animate({opacity:"1"},500)

//$("body").fadeIn(1000)
})