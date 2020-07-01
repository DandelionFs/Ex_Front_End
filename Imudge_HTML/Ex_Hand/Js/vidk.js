/*返回顶部*/
$(window).scroll(function(){
    var sc=$(window).scrollTop();
    var rwidth=$(window).width()
    if(sc>0){
        $("#goTopBtn").css("display","block");
        $("#goTopBtn").css("left",(rwidth-36)+"px")
    }else{
        $("#goTopBtn").css("display","none");
    }
})
$("#goTopBtn").click(
    function(){
    var sc=$(window).scrollTop();
    $('body,html').animate({scrollTop:0},500);
})