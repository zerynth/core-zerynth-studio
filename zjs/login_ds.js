
var LoginDS = {

    login_type:0,
    login_window:null,

    login_switch:function(where){
        LoginDS.login_type=where;
        console.log("Switch!")
        console.log(where)
        console.log(LoginDS.login_type)
        if (where==0) {
            //go to login view
            $("#login_modal_ds_register").hide()
            $("#login_modal_ds_login").show()
            $("#LoginModalDSSignup").hide()
            $("#LoginModalDSLogin").show()
            //$("#LoginModalBtn").text("Login")
            $("#LoginModalDSForgot").css("visibility","visible")
            $("#LoginModalDSName").hide()
            $("#LoginModalDSPwdRpt").hide()
        } else {
            //go to signup view
            $("#login_modal_ds_login").hide()
            $("#login_modal_ds_register").show()
            $("#LoginModalDSLogin").hide()
            $("#LoginModalDSSignup").show()
            //$("#LoginModalBtn").text("Sign Up")
            $("#LoginModalDSForgot").css("visibility","hidden")
            $("#LoginModalDSName").show()
            $("#LoginModalDSPwdRpt").show()
        }
    },
    start: function(){
        $("#LoginModal").modal("hide")
        $("#LoginDSModal").modal("show")
    },
    home: function(){
        $("#LoginDSModal").modal("hide")
        $("#LoginModal").modal("show")
    },
    login_go: function(){
        if (LoginDS.login_window) return;
        //TODO: call ajax for checking
        console.log("LOGIN GO!")
        console.log(LoginDS.login_type)
        if (LoginDS.login_type==0) {
            $("#login_ds_spinner_0").show()
            $("#LoginModalDSError").html("")
            $.ajax(ZConf.oauth.zerynth,{
                type:"GET",
                headers: {
                    Authorization: "Basic "+ btoa($("#LoginModalDSEmail").val()+":"+$("#LoginModalDSPwd").val()),
                    "User-Agent": ZConf.user_agent+"/"+ZConf.vrs+"/"+ZConf.platform
                },
                data: {
                    origin:"design_spark",
                    origin_username: $("#LoginModalDSEmail").val()
                },
                success: function(data,status,xhr){
                    $("#login_ds_spinner_0").hide()
                    console.log("Success")
                    console.log(data.code)
                    console.log(data)
                    if (data.code==404){
                        $("#LoginModalDSError").html("No such user")
                    } else  if(data.code==200){
                        $("#LoginModalDSError").html("Logged!")
                        ZConf.put_token({
                                token: data.data.token,
                                expires: data.data.expires,
                                type: "manual"
                        })
                        $("#LoginDSModal").modal('toggle')
                        Bus.dispatch("login_ok",App,App)
                    } else if(data.code==403){
                        $("#LoginModalDSError").html("Wrong credentials")
                    } else  $("#LoginModalDSError").html("Unexpected error")
                },
                error: function(xhr,status,err){
                    $("#login_ds_spinner_0").hide()
                    $("#LoginModalDSError").html("Network error")
                }
            })
        } else {
            //check
            var p1 = $("#RegisterModalDSPwd").val()
            var p2 = $("#RegisterModalDSPwd2").val()
            var nick = $("#RegisterModalDSDisplayName").val()
            var email = $("#RegisterModalDSEmail").val()
            var title = $("#RegisterModalDSTitle option:selected").val()
            var firstname = $("#RegisterModalDSFirstName").val()
            var lastname = $("#RegisterModalDSLastName").val()
            var country = $("#RegisterModalDSCountry option:selected").val()
            var jobtitle = $("#RegisterModalDSJobTitle").val()
            var jobrole = $("#RegisterModalDSJobRole option:selected").val()
            var companyname = $("#RegisterModalDSCompanyName").val()
            var companywebsite = $("#RegisterModalDSCompanyWebsite").val()
            var news = $("#RegisterModalDSNews").is(":checked") ? 1:0
            var agree = $("#RegisterModalDSAgree").is(":checked") ? 1:0


            if(!p1 || !p2 ){
                $("#RegisterModalDSError").html("Please insert a password"); 
                return false
            }
            if(p1!=p2) {
                $("#RegisterModalDSError").html("Passwords don't match!"); 
                return false
            }
            if(p1==p2 &&  !(p1.match(/.*[A-Z]+.*/) && p1.match(/.*[a-z]+.*/) && p1.match(/.*[0-9]+.*/))) {
                $("#RegisterModalDSError").html("Password must contain at least 1 uppercase, 1 lowercase and 1 number"); 
                return false
            }
            if(p1==p2 && p1.length<8){
                $("#RegisterModalDSError").html("Password must be 8 char or longer"); 
                return false
            }
            if(!nick || !nick.match(/^[A-Za-z0-9_\-\.]{3,}$/)) {
                $("#RegisterModalDSError").html("Bad Nick Name!"); 
                return false
            }
            if(!email){
                $("#RegisterModalDSError").html("Bad Email!"); 
                return false
            }

            if (!title || !firstname || !country || !jobrole) {
                var emsg ="Missing required fields:"
                var eflds = []
                if (!title) eflds.push("Title")
                if (!firstname) eflds.push("First Name")
                if (!country) eflds.push("Country of residence")
                if (!jobrole) eflds.push("Job Role")

                $("#RegisterModalDSError").html(emsg+eflds.join(", "));
                return false
            }

            if (agree!=1) {
                $("#RegisterModalDSError").html("Please read and accept Terms of Service to proceed"); 
                return false
            }
            $("#login_ds_spinner_1").show()
            $("#ResgisterModalDSError").html("")
            $.ajax(ZConf.oauth.zerynth,{
                method:'POST',
                headers: {
                    "User-Agent": ZConf.user_agent+"/"+ZConf.vrs+"/"+ZConf.platform
                },
                success: function(data,status,xhr){
                    $("#login_ds_spinner_1").hide()
                    if (data.code==404){
                        $("#RegisterModalDSError").html("No such user")
                    } else  if(data.code==200){
                        $("#RegisterModalDSError").html("Logged!")
                        ZConf.put_token({
                            token: data.data.token,
                            expires: data.data.expires,
                            type: "manual"
                        })
                        $("#LoginDSModal").modal('toggle')
                        Bus.dispatch("login_ok",App,App)

                    } else if(data.code==403){
                        $("#RegisterModalDSError").html("Wrong credentials")
                    } else  $("#RegisterModalDSError").html(data.message)
                },
                error: function(xhr,status,err){
                    $("#login_ds_spinner_1").hide()
                    $("#RegisterModalDSError").html("Network error")
                },
                dataType   : 'json',
                contentType: 'application/json; charset=UTF-8',
                data: JSON.stringify({
                    username: email,
                    password: p1,
                    display_name:nick,
                    origin: "design_spark",
                    origin_info:{
                        username:nick,
                        emailAddress:email,
                        title:title,
                        firstName:firstname,
                        lastName:lastname,
                        countryOfResidence:country,
                        jobTitle:jobtitle,
                        jobRole:jobrole,
                        companyName: companyname,
                        companyWebsite: companywebsite,
                        password:p1,
                        confirmPassword:p1,
                        receiveNewsAndUpdates:news,
                        agreeToTerms:agree
                    }
                })
            })
        }

        return false
    }

}


