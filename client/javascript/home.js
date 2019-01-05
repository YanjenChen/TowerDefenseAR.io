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
// ************************************* 後端

	var message_modal_is_open = false;
	reject_cause = Object()
	reject_cause["only_num_eng"] = "Please input only number and english char"
	
	var socket = undefined
	
	
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
	
	
	function getsocket(){
	    socket = undefined
	    while(true){ 
	        try{ 
	            socket = io(); 
	            break; 
	        }catch(e){ 
				console.log("FFFF")
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

					var x = window.matchMedia("(min-width: 1000px)")
					rr = true

					// -50 , -90
					// -60 , -120
					to_top = Object()
					if (x.matches) {
						to_top["borad"] = "-60%"
						to_top["chain"] = "-120%"
					}else{
						to_top["borad"] = "-80%"
						to_top["chain"] = "-160%"
					}
					//if (x.matches) {
						$("#img_board , #enter_game_area").animate({top:to_top["borad"]},1000,"easeOutCirc",function(){
							if(!rr){
								return
							}
							rr = false
							// v1 : 背景變白色
							/*
							$("body").css({backgroundColor:"white"})
							$("#back_img").animate({opacity:"0"},1000,function(){
								activate_login(msg,name,pass,pass_check)
							})
							*/

							// v2 : 變出士兵在跑

							$("#loading").prop("src","image/loading3.gif")
							var x = window.matchMedia("(min-width: 1000px)")
							/*
							<img style="position:absolute;width:80%;height:80%;left:-10%;top:10%;"  src="loading3.gif" />
      
        					<img style="position:absolute;width:90%;height:80%;left:-10%;top:10%;"  src="loading3.gif" />
							
							*/
							if (x.matches) {
								
								$("#loading").css({
									position:"absolute",
									//width:"80%",
									height:"80%",
									left:"20%",
									top:"15%",
									visibility:"visible",
									opacity:"0",
								})
								console.log("h1")

							}else{
								$("#loading").css({
									position:"absolute",
									//width:"90%",
									height:"80%",
									left:"-20%",
									top:"30%",
									visibility:"visible",
									opacity:"0",
								})
								console.log("h2")
							}
							/*
							$("#loading").css({visibility:"visible",
									opacity:"0",
								})
								*/
							time = 250
							pp = false
							gg  = false
							$("#loading").animate({opacity:"0.25"},time)
								.animate({opacity:"0.5"},time)
								.animate({opacity:"0.75"},time)
								.animate({opacity:"1"},time,function(){
									//setTimeout(function(){
										if(!pp){
											pp = true
											$("body").css({backgroundColor:"black"})
											//$("#loading").css({visibility:"visible",opacity:"0",})
											$("#back_img , #loading").animate({opacity:"0"},1000,function(){
												if(!gg){
													gg = true
													setTimeout(function(){
														activate_login(msg,name,pass,pass_check)
													},200)
												}
											})
										}
									//},1000)
								})

						})	
						$("#img_l_chain , #img_r_chain").animate({top:to_top["chain"]},1000,"easeOutCirc")
					/*	
					}else{
						$("#img_board , #enter_game_area").animate({top:"-85%"},1000,"easeOutCirc",function(){
							
							$("body").css({backgroundColor:"white"})
							$("#back_img").animate({opacity:"0"},1000,function(){
								activate_login(msg,name,pass,pass_check)
							})
							


						
						})	
						$("#img_l_chain , #img_r_chain").animate({top:"-120%"},1000,"easeOutCirc")



					}
					*/
					//activate_login(msg,name,pass,pass_check)
	
	                
	                
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
	
	function activate_login(msg,name,pass,pass_check){

					
	                
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
	}

	$("#close_message_modal").click(function(){
        message_modal_is_open = false;
        $('#message_modal').modal('hide')
    })
	
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


	function click_login(){

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
        
    }

	function click_register(){

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

        
    }

// ************************************* 前端
	// 預設，先讓所有元素隱藏
	$("#twin_flag_area , #valhalla_logo_area , #enter_game_area , #back_img").css({visibility:"hidden"})
	function init_twin_flag(){

		$("#twin_flag_area").css({visibility:"visible"})

		$("#red_team_flag_area").backgroundor('lgradient',{
                    intervaltime: 30
					,colors: ['#B22222','#8B0000','#FF0000','#B22222']
                    ,animdegree    : '20deg'
                    ,color:"#0000BB"
					,values : [0,30,60,100]
				});
				
		$("#blue_team_flag_area").backgroundor('lgradient',{
                    intervaltime: 30
					,colors: ['#000080','#00008B','#191970','#0000FF']
                    ,animdegree    : '20deg'
                    ,color:"#0000BB"
					,values : [0,30,60,100]
                    
				});
		time1 = 175
		time2 = 300
		hasDo = false
		$("#red_team_flag_area , #blue_team_flag_area").css({opacity:"0"})
			.animate({opacity:"0.25"},time1)
			.animate({opacity:"0.5"},time1)
			.animate({opacity:"0.75"},time1)
			.animate({opacity:"1"},time1)

			.animate({opacity:"1"},time2) // 中間短暫間隔

			.animate({opacity:"0.75"},time1)
			.animate({opacity:"0.5"},time1)
			.animate({opacity:"0.25"},time1)
			.animate({opacity:"0"},time1,function(){
				if(!hasDo){
					// 好像跑了兩次
					//console.log("QQQ")
					hasDo = true
					// 觸發下一階段 函式
					init_valhalla_area()
				}
			})
				
		//console.log("vreb")
	}

	function init_valhalla_area(){
		//$("body").css({backgroundColor:"#FFFFFF"})
		$("#valhalla_logo_area").css({visibility:"visible"
			//,opacity:"0"
			}) // 直接把 ,opacity:"0" 設好，這個放到下面 animate ，會出現閃屏問題
		
		var x = window.matchMedia("(min-width: 1000px)")
		stroke_width = 0
  		if (x.matches) { // If media query matches
			stroke_width = 2
			
  		} else {
    		stroke_width = 10 // 手機，線要粗一點，才看的到
			$("#valhalla_logo_area").css({position:"absolute",top:"50%"})
		}

		$("#v1,#a1_out,#a1_in,#l1,#h1,#a2_out,#a2_in,#l2,#l3,#a3_out,#a3_in").css({ fill: 'transparent' ,stroke:"#9932CC","stroke-width":stroke_width});

		

		let svg = document.querySelector('#valhalla_logo_area');
	
		animation = new LazyLinePainter(svg, {}); 
        animation.on('start', function(){ })
        
		animation.on('complete', function(){
            //$('#v1,#a1_out,#l1,#h1,#a2_out,#l2,#l3,#a3_out').backgroundor('lgradient',{intervaltime: 80, colors: ['#3b679e','#137FD8','#7db9e8']});
			
			// fill 先調成跟背景黑色同色，才不會閃屏
			 $("#v1,#a1_out,#l1,#h1,#a2_out,#l2,#l3,#a3_out")
			 	.css({ fill: '#000000' ,stroke:"#9932CC"})
			$("#a1_in,#a2_in,#a3_in").css({ fill: '#000000' ,stroke:"#9932CC"})
			
			$("#v1,#a1_out,#l1,#h1,#a2_out,#l2,#l3,#a3_out").animate({svgFill:"#9932CC"},2000,function(){
				animation = null;
				// 電腦版，將字往上拉
				hasDo2 = false		
				var x = window.matchMedia("(min-width: 1000px)")
				if (x.matches) {
					
					 
				}else{
					$("#a1_in,#a2_in,#a3_in").css({ fill: 'transparent'})
				}

				$("#valhalla_logo_area").animate({top:"-1000px"},1000,function(){
						
						if(!hasDo2){
							hasDo2 = true
							console.log("LLL")
							init_enter_game_back()
						}
				})
				/*
				setTimeout(function(){
					init_enter_game_area()
				},2000)
				*/
				// 手機直接進步下一步動畫
				
			})

			
		});
        animation.paint();
	}


	function init_enter_game_back(){
		/*
		$("#enter_game_area").css({visibility:"visible",width:"80%",height:"500px",position:"absolute",top:"-100%",left:"10%"})
	
		$("#enter_game_area").animate({top:"40%"},1000,"easeOutCirc")
		*/
		// 方法 : https://stackoverflow.com/questions/8675131/fadein-body-background-image
		// 	記得改路徑
		image = "image/background.jpg"
		var x = window.matchMedia("(min-width: 1000px)")
		width = undefined
		height = undefined
		time = 1000
		if (x.matches) {
			width = "100%"
			height = "100%"
		}else{ // 手機需要調背景圖片大小
			width = "150%"
			height = "150%"
		}
		$("#back_img").prop("src",image)
		$("#back_img").css({
			
				position:"absolute",
				width:width,
				height:height,
				left:"0px",
				top:"0px",
				visibility:"visible",
				opacity:"0"
		})
		fff = false
		// 放多個 animate 會閃屏，注意
		$("#back_img").animate({opacity:"1"},1000,function(){
			if(!fff){
				fff = true
				init_enter_game_area()
			}
		})
	}


	function init_enter_game_area(){
		// "background-image: url(chain.jpg);background-repeat : no-repeat;background-size:cover;height:800px;"
		
		
		
		var x = window.matchMedia("(min-width: 1000px)")
		// 記得改路徑
		$("#img_board").prop("src","image/login_board.jpg")
			
		if (x.matches) {


			$("#enter_game_area").css({
				position:"absolute",
				width:"50%",
				height:"55%",
				left:"25%",
				top:"-50%",
				visibility:"hidden",
			})	

			$("#img_board").css({
			
				position:"absolute",
				width:"50%",
				height:"55%",
				left:"25%",
				top:"-50%",
				visibility:"visible",
			})


			// 記得改路徑
			$("#img_l_chain , #img_r_chain" ).prop("src","image/chain.jpg")
			$("#img_l_chain").css({
			
				position:"absolute",
				height:"55%",
				left:"25%",
				top:"-90%",
				visibility:"visible",
			})

			$("#img_r_chain").css({
			
				position:"absolute",
				height:"55%",
				left:"70%",
				top:"-90%",
				visibility:"visible",
			})
		}else{
			$("#enter_game_area").css({
				position:"absolute",
				width:"110%",
				height:"80%",
				left:"20%",
				top:"-50%",
				visibility:"hidden",
			})	
			
			$("#img_board").css({
			
				position:"absolute",
				width:"110%",
				height:"80%",
				left:"20%",
				top:"-50%",
				visibility:"visible",
			})


			$("#img_l_chain , #img_r_chain" ).prop("src","image/chain.jpg")
			$("#img_l_chain").css({
			
				position:"absolute",
				height:"55%",
				left:"25%",
				top:"-90%",
				visibility:"visible",
			})

			$("#img_r_chain").css({
			
				position:"absolute",
				height:"55%",
				left:"95%",
				top:"-90%",
				visibility:"visible",
			})
		}

		$("#enter_game_area").css({
			visibility:"visible",
		})

		
		if (x.matches) {
			$("#img_board , #enter_game_area").animate({top:"40%"},1000,"easeOutCirc")	
			$("#img_l_chain , #img_r_chain").animate({top:"-10%"},1000,"easeOutCirc")

			$("#menu").addClass("ui vertical pointing menu")
			$("#registerPassCheckInput").width(300)
			//console.log("U1")
		}else{


			$("#img_board , #enter_game_area").animate({top:"45%"},1000,"easeOutCirc")
			$("#img_l_chain , #img_r_chain").animate({top:"-5%"},1000,"easeOutCirc")

			$("#menu").addClass("ui pointing menu")
			$("#enter_game_area input").height(100)
			//console.log("U2")
		}


		// 將 Login 設為 active 
		$("#switch_login").addClass("ac")
		$("#switch_register").addClass("co")

		$(".switch").click(function(){
			
			id = $(this).prop("id")
			console.log("PPP : "+id)
			if(id=="switch_login"){

				$("#switch_login").removeClass("co").addClass("ac")
				$("#switch_register").removeClass("ac").addClass("co")
				$("#go_button").html("Login")

				$("#login_area").css({display:"block"})
				$("#register_area").css({display:"none"})
				
			}else {
				$("#switch_login").removeClass("ac").addClass("co")
				$("#switch_register").removeClass("co").addClass("ac")
				$("#go_button").html("Register")

				$("#register_area").css({display:"block"})
				$("#login_area").css({display:"none"})
			}

		})


		// 點擊，註冊 & 登入按鈕
		$(".go").click(function(){
			str = String($("#go_button").html()).trim()
			if(str=="Login"){
				click_login()
			}else if(str=="Register"){
				click_register()
			}

		})

		//console.log("KKK")

		// .go

		if (x.matches) {
			$(".go").prop("src","image/boot2_burned.png")
			$(".go").css({
			
				position:"absolute",
				height:"70%",
				width:"100%",
				top:"80%",
				visibility:"visible",
			})


			$("#go_button").html("Login")
			$("#go_button").css({
				position:"absolute",
				top:"90%",
				left:"30%",
				"font-size":"40px",
				visibility:"visible",
			})
		}else{

			$(".go").prop("src","image/boot2_burned.png")
			$(".go").css({
			
				position:"absolute",
				left:"250%",
				height:"70%",
				width:"100%",
				top:"80%",
				visibility:"visible",
			})


			$("#go_button").html("Login")
			$("#go_button").css({
				position:"absolute",
				top:"100%",
				left:"250%",
				"font-size":"80px",
				visibility:"visible",
			})

			// 字體太大，placeholder 字又太多，無法顯示完，不如不顯示
			$("#enter_game_area input").prop("placeholder","")

		}

	}
	

	function direct_enter_game_area(){

		var x = window.matchMedia("(min-width: 1000px)")
		// 記得改路徑
		$("#img_board").prop("src","image/login_board.jpg")


		image = "image/background.jpg"
		var x = window.matchMedia("(min-width: 1000px)")
		width = undefined
		height = undefined
		time = 1000
		if (x.matches) {
			width = "100%"
			height = "100%"
		}else{ // 手機需要調背景圖片大小
			width = "150%"
			height = "150%"
		}


		$("#back_img").prop("src",image)
		$("#back_img").css({
			
				position:"absolute",
				width:width,
				height:height,
				left:"0px",
				top:"0px",
				visibility:"visible",
				opacity:"1"
		})
		if (x.matches) {

			$("#enter_game_area").css({
				position:"absolute",
				width:"50%",
				height:"55%",
				left:"25%",
				top:"40%",
				visibility:"visible",
			})	

			$("#img_board").css({
			
				position:"absolute",
				width:"50%",
				height:"55%",
				left:"25%",
				top:"40%",
				visibility:"visible",
			})
			// 記得改路徑
			$("#img_l_chain , #img_r_chain" ).prop("src","image/chain.jpg")
			$("#img_l_chain").css({
			
				position:"absolute",
				height:"55%",
				left:"25%",
				top:"-10%",
				visibility:"visible",
			})

			$("#img_r_chain").css({
			
				position:"absolute",
				height:"55%",
				left:"70%",
				top:"-10%",
				visibility:"visible",
			})


			//$("#img_board , #enter_game_area").animate({top:"40%"},1000,"easeOutCirc")	
			//$("#img_l_chain , #img_r_chain").animate({top:"-10%"},1000,"easeOutCirc")
			$("#menu").addClass("ui vertical pointing menu")
			$("#registerPassCheckInput").width(300)



			$(".go").prop("src","image/boot2_burned.png")
			$(".go").css({
			
				position:"absolute",
				height:"70%",
				width:"100%",
				top:"80%",
				visibility:"visible",
			})


			$("#go_button").html("Login")
			$("#go_button").css({
				position:"absolute",
				top:"90%",
				left:"30%",
				"font-size":"40px",
				visibility:"visible",
			})
		}else{
			$("#enter_game_area").css({
				position:"absolute",
				width:"110%",
				height:"80%",
				left:"20%",
				top:"45%",
				visibility:"visible",
			})	
			
			$("#img_board").css({
			
				position:"absolute",
				width:"110%",
				height:"80%",
				left:"20%",
				top:"45%",
				visibility:"visible",
			})


			$("#img_l_chain , #img_r_chain" ).prop("src","image/chain.jpg")
			$("#img_l_chain").css({
			
				position:"absolute",
				height:"55%",
				left:"25%",
				top:"-5%",
				visibility:"visible",
			})

			$("#img_r_chain").css({
			
				position:"absolute",
				height:"55%",
				left:"95%",
				top:"-5%",
				visibility:"visible",
			})


			$("#menu").addClass("ui pointing menu")
			$("#enter_game_area input").height(100)
			//$("#img_board , #enter_game_area").animate({top:"45%"},1000,"easeOutCirc")
			//$("#img_l_chain , #img_r_chain").animate({top:"-5%"},1000,"easeOutCirc")


			$(".go").prop("src","image/boot2_burned.png")
			$(".go").css({
			
				position:"absolute",
				left:"250%",
				height:"70%",
				width:"100%",
				top:"80%",
				visibility:"visible",
			})


			$("#go_button").html("Login")
			$("#go_button").css({
				position:"absolute",
				top:"100%",
				left:"250%",
				"font-size":"80px",
				visibility:"visible",
			})

			// 字體太大，placeholder 字又太多，無法顯示完，不如不顯示
			$("#enter_game_area input").prop("placeholder","")
		}


		// 將 Login 設為 active 
		$("#switch_login").addClass("ac")
		$("#switch_register").addClass("co")

		$(".switch").click(function(){
			
			id = $(this).prop("id")
			console.log("PPP : "+id)
			if(id=="switch_login"){

				$("#switch_login").removeClass("co").addClass("ac")
				$("#switch_register").removeClass("ac").addClass("co")
				$("#go_button").html("Login")

				$("#login_area").css({display:"block"})
				$("#register_area").css({display:"none"})
				
			}else {
				$("#switch_login").removeClass("ac").addClass("co")
				$("#switch_register").removeClass("co").addClass("ac")
				$("#go_button").html("Register")

				$("#register_area").css({display:"block"})
				$("#login_area").css({display:"none"})
			}

		})


		// 點擊，註冊 & 登入按鈕
		$(".go").click(function(){
			str = String($("#go_button").html()).trim()
			if(str=="Login"){
				click_login()
			}else if(str=="Register"){
				click_register()
			}

		})


		$("body").css({opacity:"0"})
		$("body").animate({opacity:"1"},1000)
	}

	$("body").css({backgroundColor:"#000000"})
	
	direct_enter_game_area()
	
	//init_twin_flag()
	
	// 用這個檢查，是否為登出的
	/*
	if($("#from_logout_user").val()!=""){
		direct_enter_game_area()
		alert("使用者 ["+$("#from_logout_user").val()+"] 登出成功")
	}else{
		init_twin_flag()
	}
	*/
	
	
	

	
	// margin:30px 30px 0px 30px;
})