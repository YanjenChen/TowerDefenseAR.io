                async function run_figure_demo(){

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
				var figure_flag=[ "image/Blue.png","image/Red.png"]


					 w_w = $(window).width()
                                    w_h = $(window).height()      

					$("#figure_story , #Scrol1 , #Scrol1_in , #book , #images , #fac_flag , #say , #name").css({
					    display:"block",
					    visibility:"visible",
					    opacity:"1",
				    })

                    console.log("\n\nBBBBBB\n\n")
					for(team=0;team<2;++team){
						var x = window.matchMedia("(min-width: 1000px)")
						if (x.matches) { // 大螢幕
								// 卷軸拉開


									console.log("\n\nNNNNN : "+team+" , "+"\n\n")
                                   


                                    $("#images img").css({display:"none",visibility:"hidden",opacity:"0"
                                        ,width:((w_w/4)+"px")
                                        ,height:((w_h*0.9)+"px")})

                                    $("#fac_flag").css({display:"none",visibility:"hidden",opacity:"0"})
                                    /*
                                    image_len = 4
                                    for(i=0;i<image_len;++i){
                                        
                                        lf = (i/4)*w_w
                                        $("#images img").eq(i).css({position:"absolute",top:"5%",left:(lf+"px")})
                                    }
                                    */

                                    $("#Scrol1").css({opacity:"1"})
                                    $("#Scrol1_in").css({opacity:"0",width:((w_w)+"px"),height:(w_h+"px")})
                                     $("#book").css({height:(w_h+"px")})
                                     each_pen_time = 200
                                     height =  $("#Scrol1_in").height()
                                      width =  $("#Scrol1_in").width()


                                      $("#Scrol1").width(0)
                                     
                                    //$("#Scrol1").css({width:"0px",opacity:"0"})
                                    console.log(width)
									max = 20
                                
									for(i1=1;i1<=max;++i1){
                                         
										gg = i1*(1/max)
                                        console.log("aa11 : "+(width)+" , i : "+i1+" , max : "+max)
										if(i1!=max){
                                            $("#book").animate({left:((-150+(width*gg))+"px")},each_pen_time)
                                        }
                                        
                                        
                                        await delay(each_pen_time)
                                        $("#Scrol1").animate(  {width:((width*gg)+"px")   },each_pen_time)
                                        $("#Scrol1_in").css({opacity:"1"})

                                        if(i1==max){
                                            await delay(each_pen_time)
                                        }
                                    }
                                    console.log("\n\nMMMMMMMMMM\n\n")

                                    // 開始顯示人物

                                   // console.log("PPP")
                                     //$("#images img").css({display:"block",visibility:"visible",opacity:"0"})
                                     //$("#images img").animate({opacity:"1"},1000)


                                     // Blue.png
                                     // Red.png
                                
								// 開始顯示人物
                                     for(i3=0;i3<2;++i3){


										 // 顯示旗子
                                        if(i3==0){
                                             
											 if(team==0){
											 	$("#fac_flag").css({display:"block",visibility:"visible",opacity:"0",left:((w_w*0.7)+"px")
                                                        //,height:((w_h*0.1)+"px")
                                                        ,top:((w_h*0.1)+"px")
                                                        ,position:"absolute"
                                                    ,width:((w_w*0.3)+"px")
                                                   })
											 }else{
												$("#fac_flag").css({display:"block",visibility:"visible",opacity:"0",left:((w_w*0.7)+"px")
                                                        //,height:((w_h*0.1)+"px")
                                                        ,top:((w_h*0.1)+"px")
                                                        ,position:"absolute"
                                                    ,width:((w_w*0.2)+"px")
                                                   })
											 }
                                            $("#fac_flag").prop("src",
												//"Blue.png"
												
												figure_flag[team]
												)
                                            $("#fac_flag").animate({opacity:"1"},1000)
                                            await delay(1100)
                                        }
                                        

                                        // 顯示人物
                                        if(i3==1){
                                            $(
												//".blue"
												
											figure[team]	
											).eq(i3-1).animate({opacity:"0"},500)
                                            await delay(600)
                                        }
                                        $(
											//".blue"
											figure[team]
											).eq(i3).css({width:"auto",height:(w_h*0.9)+"px",left:((w_w*0.1)+"px"),display:"block",visibility:"visible",position:"absolute"})
                                        $(
											//".blue"
											figure[team]
											
											).eq(i3).animate({opacity:"1"},500)
                                        await delay(600)
                                        
                                        


                                        say = figure_say[team][i3]
                                        name = figure_name[team][i3]
                                        
                                            $("#say").css({display:"block",visibility:"visible",opacity:"1"
                                                ,"z-index":"4",
                                                position:"absolute",
                                                left:((w_w*0.3)+"px"),
                                                width:((w_w*0.4)+"px"),
                                                top:((w_h*0.3)+"px"),
                                                "font-size":"60px",
                                                "line-height":"70px",
                                                opacity:"0"
                                            }).html(say)

                                            $("#name").css({display:"block",visibility:"visible",opacity:"1"
                                                ,"z-index":"4",
                                                position:"absolute",
                                                left:((w_w*0.3)+"px"),
                                                width:((w_w*0.4)+"px"),
                                                top:((w_h*0.1)+"px"),
                                                "font-size":"60px",
                                                "line-height":"70px",
                                                opacity:"0"
                                            }).html(name)

                                            $("#say , #name").animate({opacity:"1"},1000)
                                            await delay(1100) // 等待字顯示

                                        // 等待1100ms 消失
                                        await delay(1100)

                                         $("#say , #name").animate({opacity:"0"},1000)
										 if(i3==1){
											 $("#fac_flag").animate({opacity:"0"},1000)
                                           $(
												//".blue"
												figure[team]
										   ).eq(i3).animate({opacity:"0"},1000)
										 }
                                            await delay(1100) // 等待字顯示
                                    
                                     }
								


								// 卷軸關閉
									//$("#Scrol1_in").css({opacity:"1",width:((w_w)+"px"),height:(w_h+"px")})
                                    $("#book").css({height:(w_h+"px")})
                                    each_pen_time = 200
                                    height =  $("#Scrol1").height()
                                    width =  $("#Scrol1").width()
                                     // $("#Scrol1").width(0)
                                     
                                    //$("#Scrol1").css({width:"0px",opacity:"0"})
                                    console.log(width)
									max = 20
                                
									for(i2=max;i2>=0;--i2){
                                         
										gg = i2*(1/max)
                                        console.log("aa11 : "+(width*gg))
										if(i2!=max){
                                            //$("#book").animate({left:((-150+(width*gg))+"px")},each_pen_time)
											$("#Scrol1").animate(  {width:((width*gg)+"px")   },each_pen_time)
										}
                                        
                                        
                                        await delay(each_pen_time)
                                        //$("#Scrol1").animate(  {width:((width*gg)+"px")   },each_pen_time)
                                        if((i2!=0)&&(i2!=max)){
											$("#book").animate({left:((-150+(width*gg))+"px")},each_pen_time,function(){
											
											
											})
										}
										//$("#Scrol1_in").css({opacity:"1"})

                                        if(i2==0){
                                            $("#Scrol1_in").css({opacity:"0"})
											$("#Scrol1").css({opacity:"0"})
											await delay(each_pen_time)
											console.log("JJJJ")
											
                                        }
                                    }
						}else{
								// 卷軸拉開


									console.log("\n\nNNNNN\n\n")
                                   


                                    $("#images img").css({display:"none",visibility:"hidden",opacity:"0"
                                        ,width:((w_w/4)+"px")
                                        ,height:((w_h*0.9)+"px")})

                                    $("#fac_flag").css({display:"none",visibility:"hidden",opacity:"0"})
                                    /*
                                    image_len = 4
                                    for(i=0;i<image_len;++i){
                                        
                                        lf = (i/4)*w_w
                                        $("#images img").eq(i).css({position:"absolute",top:"5%",left:(lf+"px")})
                                    }
                                    */

                                    $("#Scrol1").css({opacity:"1"})
                                    $("#Scrol1_in").css({opacity:"0",width:((w_w)+"px"),height:(w_h+"px")})
                                     $("#book").css({height:(w_h+"px")})
                                     each_pen_time = 200
                                     height =  $("#Scrol1_in").height()
                                      width =  $("#Scrol1_in").width()


                                      $("#Scrol1").width(0)
                                     
                                    //$("#Scrol1").css({width:"0px",opacity:"0"})
                                    console.log(width)
									max = 20
                                
									for(i=1;i<=(max-5);++i){
                                         
										gg = i*(1/max)
                                        console.log("aa11 : "+(width))
										if(i!=max){
                                            $("#book").animate({left:((-150+(width*gg))+"px")},each_pen_time)
                                        }
                                        
                                        
                                        await delay(each_pen_time)
                                        $("#Scrol1").animate(  {width:((width*gg)+"px")   },each_pen_time)
                                        $("#Scrol1_in").css({opacity:"1"})

                                        if(i==(max-5)){
                                            await delay(each_pen_time)
                                        }
                                    }


                                    // 開始顯示人物

                                   // console.log("PPP")
                                     //$("#images img").css({display:"block",visibility:"visible",opacity:"0"})
                                     //$("#images img").animate({opacity:"1"},1000)


                                     // Blue.png
                                     // Red.png
                                
								// 籃隊
                                     for(i=0;i<2;++i){


										 // 顯示旗子
                                        if(i==0){
                                             
											 if(team==0){
											 	$("#fac_flag").css({display:"block",visibility:"visible",opacity:"0",left:((w_w*0.3)+"px")
                                                        //,height:((w_h*0.1)+"px")
                                                        ,top:((w_h*0.05)+"px")
                                                        ,position:"absolute"
                                                    ,width:((w_w*0.7)+"px")
                                                   })
											 }else{
												$("#fac_flag").css({display:"block",visibility:"visible",opacity:"0",left:((w_w*0.5)+"px")
                                                        //,height:((w_h*0.1)+"px")
                                                        ,top:((w_h*0.05)+"px")
                                                        ,position:"absolute"
                                                    ,width:((w_w*0.5)+"px")
                                                   })
											 }
                                            $("#fac_flag").prop("src",
												//"Blue.png"
												
												figure_flag[team]
												)
                                            $("#fac_flag").animate({opacity:"1"},1000)
                                            await delay(1100)
                                        }
                                        

                                        // 顯示人物
                                        if(i==1){
                                            $(
												//".blue"
												
											figure[team]	
											).eq(i-1).animate({opacity:"0"},500)
                                            await delay(600)
                                        }
                                        $(
											//".blue"
											figure[team]
											).eq(i).css({width:"auto",height:(w_h*0.4)+"px",left:((w_w*0.1)+"px"),display:"block",visibility:"visible",position:"absolute"
												,top:((w_h*0.05)+"px")
												
												,width:((w_w*0.4)+"px")
												
											})
                                        $(
											//".blue"
											figure[team]
											
											).eq(i).animate({opacity:"1"},500)
                                        await delay(600)
                                        
                                        


                                        say = figure_say[team][i]
                                        name = figure_name[team][i]
                                        
                                            $("#say").css({display:"block",visibility:"visible",opacity:"1"
                                                ,"z-index":"4",
                                                position:"absolute",
                                                left:((w_w*0.1)+"px"),
                                                width:((w_w*0.8)+"px"),
                                                top:((w_h*0.55)+"px"),
                                                "font-size":"60px",
                                                "line-height":"75px",
                                                opacity:"0"
                                            }).html(say)

                                            $("#name").css({display:"block",visibility:"visible",opacity:"1"
                                                ,"z-index":"4",
                                                position:"absolute",
                                                left:((w_w*0.1)+"px"),
                                                width:((w_w*0.8)+"px"),
                                                top:((w_h*0.5)+"px"),
                                                "font-size":"60px",
                                                "line-height":"75px",
                                                opacity:"0"
                                            }).html(name)

                                            $("#say , #name").animate({opacity:"1"},1000)
                                            await delay(1100) // 等待字顯示

                                        // 等待1100ms 消失
                                        await delay(1100)

                                         $("#say , #name").animate({opacity:"0"},1000)
										 if(i==1){
											 $("#fac_flag").animate({opacity:"0"},1000)
                                           $(
												//".blue"
												figure[team]
										   ).eq(i).animate({opacity:"0"},1000)
										 }
                                            await delay(1100) // 等待字顯示
                                    
                                     }
								


								// 卷軸關閉
									//$("#Scrol1_in").css({opacity:"1",width:((w_w)+"px"),height:(w_h+"px")})
                                    $("#book").css({height:(w_h+"px")})
                                    each_pen_time = 200
                                    height =  $("#Scrol1").height()
                                    width =  $("#Scrol1").width()
                                     // $("#Scrol1").width(0)
                                     
                                    //$("#Scrol1").css({width:"0px",opacity:"0"})
                                    console.log(width)
									max = 20
                                
									for(i=max;i>=0;--i){
                                         
										gg = i*(1/max)
                                        console.log("aa11 : "+(width*gg))
										if(i!=max){
                                            //$("#book").animate({left:((-150+(width*gg))+"px")},each_pen_time)
											$("#Scrol1").animate(  {width:((width*gg)+"px")   },each_pen_time)
										}
                                        
                                        
                                        await delay(each_pen_time)
                                        //$("#Scrol1").animate(  {width:((width*gg)+"px")   },each_pen_time)
                                        if((i!=0)&&(i!=max)){
											$("#book").animate({left:((-150+(width*gg))+"px")},each_pen_time,function(){
											
											
											})
										}
										//$("#Scrol1_in").css({opacity:"1"})

                                        if(i==0){
                                            $("#Scrol1_in").css({opacity:"0"})
											$("#Scrol1").css({opacity:"0"})
											await delay(each_pen_time)
											console.log("JJJJ")
											
                                        }
                                    }



						}
					}
				}