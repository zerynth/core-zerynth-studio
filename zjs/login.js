

var login_type=0;
var login_timeout;
var login_window;
var login_timeout_stop=true;

function login_switch(where){

    login_type=where;
    $("#LoginModalError").html("")
    if (where==0) {
        //go to login view
        $("#LoginModalSignup").hide()
        $("#LoginModalLogin").show()
        $("#LoginModalBtn").text("Login")
        $("#LoginModalForgot").css("visibility","visible")
        $("#LoginModalName").hide()
        $("#LoginModalPwdRpt").hide()
        $(".omb_socialButtons").show()
        $(".omb_loginOr").show()
    } else {
        //go to signup view
        $("#LoginModalLogin").hide()
        $("#LoginModalSignup").show()
        $("#LoginModalBtn").text("Sign Up")
        $("#LoginModalForgot").css("visibility","hidden")
        $("#LoginModalName").show()
        $("#LoginModalPwdRpt").show()
        $(".omb_socialButtons").show()
        $(".omb_loginOr").show()
        
    }
}

function do_reset(){
    var d = bootbox.prompt({
        size:"small",
        title:"Enter the email you want to password reset",
        callback:function(result){
            if (result===null){
                d.modal("hide")
            } else {
                ZTC.reset_pwd(result)
                .then(()=>{
                    d.modal("hide")
                    bootbox.alert("Reset instructions have been sent to "+result+". Please check your email.")
                })
                .catch((err)=>{
                    d.modal("hide")
                    bootbox.alert("Can't reset password!")
                })
            }
        }
    })
}

function login_go(){
    if (login_window) return;
    //TODO: call ajax for checking
    if (login_type==0) {
        $("#login_spinner_0").show()
        $("#LoginModalError").html("")
        $.ajax(ZConf.oauth.zerynth,{
            method:"GET",
            headers: {
                Authorization: "Basic "+ btoa($("#LoginModalEmail").val()+":"+$("#LoginModalPwd").val()),
                "User-Agent": ZConf.user_agent+"/"+ZConf.vrs+"/"+ZConf.platform
            },
            success: function(data,status,xhr){
                console.log("Success")
                console.log(data.code)
                $("#login_spinner_0").hide()

                if (data.code==404){
                    $("#login_spinner_0").hide()
                    $("#LoginModalError").html("No such user")
                } else  if(data.code==200){
                    $("#LoginModalError").html("Logged!")
                    ZConf.put_token({
                            token: data.data.token,
                            expires: data.data.expires,
                            type: "manual"
                    })
                    $("#LoginModal").modal('toggle')
                    Bus.dispatch("login_ok",App,App)
                } else if(data.code==403){
                    $("#LoginModalError").html("Wrong credentials")
                } else  $("#LoginModalError").html("Unexpected error")
            },
            error: function(xhr,status,err){
                $("#login_spinner_0").hide()
                $("#LoginModalError").html("Network error")
            }
        })
    } else {
        //check
        var p1 = $("#LoginModalPwd").val()
        var p2 = $("#LoginModalPwd2").val()
        var nick = $("#LoginModalDisplayName").val()
        var email = $("#LoginModalEmail").val()

        if(!p1 || !p2 ){
            $("#LoginModalError").html("Please insert a password"); 
            return false
        }
        if(p1!=p2) {
            $("#LoginModalError").html("Passwords don't match!"); 
            return false
        }
        if(p1==p2 &&  !(p1.match(/.*[A-Z]+.*/) && p1.match(/.*[a-z]+.*/) && p1.match(/.*[0-9]+.*/))) {
            $("#LoginModalError").html("Password must contain at least 1 uppercase, 1 lowercase and 1 number"); 
            return false
        }
        if(p1==p2 && p1.length<8){
            $("#LoginModalError").html("Password must be 8 char or longer"); 
            return false
        }
        if(!nick || !nick.match(/^[A-Za-z0-9_\-\.]{3,}$/)) {
            $("#LoginModalError").html("Bad Nick Name!"); 
            return false
        }
        if(!email){
            $("#LoginModalError").html("Bad Email!"); 
            return false
        }

        $("#LoginModalError").html("")
        $("#login_spinner_0").show()
        $.ajax(ZConf.oauth.zerynth,{
            method:"POST",
            success: function(data,status,xhr){
                $("#login_spinner_0").hide()
                if (data.code==404){
                    $("#LoginModalError").html("No such user")
                } else  if(data.code==200){
                    $("#LoginModalError").html("Logged!")
                    ZConf.put_token({
                        token: data.data.token,
                        expires: data.data.expires,
                        type: "manual"
                    })
                    $("#LoginModal").modal('toggle')
                    Bus.dispatch("login_ok",App,App)

                } else if(data.code==403){
                    $("#LoginModalError").html("Wrong credentials")
                } else  $("#LoginModalError").html(data.message)
            },
            error: function(xhr,status,err){
                $("#login_spinner_0").hide()
                $("#LoginModalError").html("Network error")
            },
            dataType   : 'json',
            contentType: 'application/json; charset=UTF-8',
            data: JSON.stringify({
                username: email,
                password: p1,
                display_name:nick
            })
        })
    }

    return false
}


function login_location_uncheck(){
    if (login_timeout) {
        console.log("Clear timeout")
        clearInterval(login_timeout);
        login_timeout = null
        login_timeout_stop=true
    }

    if (login_window) {
        console.log("Close window")
        login_window.window.close()
        login_window = null
    }
}

function login_location_checker(where,callback){
    if (!login_timeout && !login_timeout_stop){
        login_timeout = setInterval(function(){
            console.log("CHECK LOCATION!")
            console.log(login_window.window.document.location.href)
            if(login_window && login_window.window.document.location.href.startsWith(ZConf.redirect[where])){
                //TODO: check content & save token
                console.log("BEFORE CHECK!")
                var cnt = login_window.window.document.body.innerHTML.replace(/(<([^>]+)>)/ig,"") //<pre> tags can be there
                console.log(cnt)
                var ok = false
                var emsg=""
                try {
                    var res = JSON.parse(cnt)
                    console.log(res)
                    if (res.data && res.data.token && res.data.expires) {
                        ok = true
                        ZConf.put_token( {
                            token: res.data.token,
                            expires: res.data.expires,
                            type: where
                        })
                        emsg="ok"
                    } else {
                        emsg="failed authentication!"
                    }
                } catch(err) {
                    emsg="unknown error"+err
                }
                login_location_uncheck()
                if (ok) {
                    $("#LoginModal").modal('toggle')
                    Bus.dispatch("login_ok",App,App)
                }
                if (callback) callback(ok,emsg)
            }
        },100)
    }
}

function login_social(title,type){
    var callback = function(res,msg) {
        if(!res){
            $("#LoginModalError").html(msg)
        } else {
            $("#LoginModalError").html("")
        }
    }
    if (!login_window) {
        var x0,y0,x1,y1,x,y;
        x0 = nw.Window.get().x;
        y0 = nw.Window.get().y;
        x1 = x0 + nw.Window.get().width;
        y1 = y0 + nw.Window.get().height;
        x = Math.round((x1+x0)/2 - 400)
        y = Math.round((y1+y0)/2 - 300)
        if(x<x0) x=x0
        if(y<y0) y=y0

        nw.Window.open(ZConf.oauth[type],{
            title:title,
            frame:true,
            width:800,
            height:600,
            x:x,
            y:y},function(win){
            win.on("closed", function(){
                login_window=null
                login_location_uncheck()
            })
            login_window = win
            login_timeout_stop=false
            login_location_checker(type,callback)
        })
    }
}
