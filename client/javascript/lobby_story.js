	// 需要這三行全域變數
	/*
		story_p_arr = Array()
		$("#p_content p").each(function(index,ele){
			story_p_arr.push(
				String($("#p_content p").eq(index).html())
			)
		})
		story_type_str = $("#type_word").html()
	*/

    // 需要引入 delay.js
	async function go_p(story_p_arr,story_type_str,go_on_story){
		//p_len = $("#p_content p").length
		p_len = story_p_arr.length
		
		for(p_i=0;p_i<p_len;++p_i){
			if(!go_on_story["do"]){
				return
			}
			const each_p = async(p_i,go_on_story) =>{

				if(!go_on_story["do"]){
					return
				}

				p_i_str = story_p_arr[p_i]
					//$("#p_content p").eq(p_i).html()
				//console.log("p_i : "+p_i+"\n"+p_i_str)



				var x = window.matchMedia("(min-width: 1000px)")
				 if (x.matches) { // If media query matches


				 	rr = String(p_i_str).split("n")
					rr = String(rr[0])
					//console.log("rr : "+rr+" , mm : "+rr.length)
					rr_len = rr.length
					rr_str_len = rr_len*(20+10)
					width = $(window).width()
					left_len = (width-rr_str_len)/2

					//console.log("ww : "+width+" , left_len : "+left_len)
					
					$("#show").css({
						//position:"relative",
						left:(left_len+"px"),
					})
					

  				}
				
				p_i_str = String(p_i_str).replace(/n/g, "<br><br><br><br>");
				$("#show").css({
					opacity:"0","font-family": "幻想體",
				}).html(p_i_str)

				
				
				$("#show").animate({
					opacity:"1",
				},800).animate({
					opacity:"1",
				},200)
				
				.animate({
					opacity:"0",
				},800)

				await delay(2000) 

				$("#show").html("").css({
					opacity:"1",
				})

				
				

			}
			await each_p(p_i,go_on_story)
		}
		
		if(!go_on_story["do"]){
					return
			}
		
		// 打字機
			$("#show").html("")

			 const each_char = async(p_str_i,p_str,p_str_arr) => {
				 if(!go_on_story["do"]){
						return
					}
                now_str = ""
                now_i=0
                while(now_i<=p_str_i){
                    now_str = now_str + p_str_arr[now_i]
                    now_i ++ 
                }

				now_str = String(now_str).replace(/a/g, "<br><br><br><br>");
				//console.log(now_str)


                await delay(120) // 每個 char 顯示用的時間
				
                $("#show").html(now_str)
            };

            const go_each_char = async(p_str) => {
				if(!go_on_story["do"]){
					return
				}

                // 等待五秒
				p_str_arr = String(p_str).split("")
				p_str_arr_len = p_str_arr.length
				for(p_str_i=0;p_str_i<p_str_arr_len;++p_str_i){
					if(!go_on_story["do"]){
						return
					}
					 await each_char(p_str_i,p_str,p_str_arr,go_on_story);
				}
				// 消除
				//$("#show").html("")
            };

			
			await go_each_char(story_type_str)
			

	}