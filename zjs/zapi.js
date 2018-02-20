

var ZApi = {

    NOT_LOGGED: 1,
    NET_ERROR:2,
    RENEW_ERROR:3,
    API_ERROR:4,
    _token:null,
    _login_callback:null,
    _error_callback:null,
    _working_callback: null,
    //url: "https://backend.zerynth.com/v1",
    url :"",
    _ajax_error: function(endpoint,xhr,status,err){
        console.log("Endpoint error for "+endpoint+":"+status)

    },
    init: function(token_store,login_callback,error_callback,working_callback){
        ZApi._token = token_store
        ZApi.url = ZConf.url
        ZApi._login_callback = function(){if (login_callback) login_callback()}
        ZApi._error_callback = function(err){if (error_callback) error_callback(err)}
        ZApi._working_callback = function(status){if (working_callback) working_callback(status)}
    },
    check_token: function() {
        return new Promise(
            function(resolve,reject){
                var ts = parseInt(Date.now()/1000)
                var token = ZApi._token.get_token()
                console.log(token)
                if (token && token.expires>ts && (token.expires-ts)<60*60*24*5){//TODO: reduce expiring threshold!
                    //try to renew current token
                    console.log("Renewing token")
                    ZApi._call("/user/renew",token.token,{
                        success: function(res,status,xhr){
                            if(res.data && res.data.token && res.data.expires){
                                token.token = res.data.token
                                token.expires = res.data.expires
                                ZApi._token.put_token(token)
                                Z.log("Session renewed")
                                // ZTC.set_token(token.token)
                                // .then(()=>{
                                //     resolve(token.token)
                                // })
                                // .catch((err)=>{
                                //     reject(ZApi.RENEW_ERROR)
                                // })
                            } else reject(ZApi.RENEW_ERROR)
                        },
                        error: function(xhr,status,err){
                            reject(ZApi.NET_ERROR)
                        }
                    })
                } else if (!token || token.expires<ts){
                    //no token or expired token
                    console.log("Expired Token Or Not Logged")
                    console.log(token)
                    reject(ZApi.NOT_LOGGED)
                } else {
                    console.log("Token ok")
                    resolve(token.token)
                    // ZTC.set_token(token.token)
                    //     .then(()=>{
                    //         resolve(token.token)
                    //     })
                    //     .catch((err)=>{
                    //         reject(err)
                    //     })
                }
        })
    },
    user: {
        get_profile: function(){},
        set_profile: function(){}
    },
    projects: {
        list: function(longlist){
            return new Promise(
                function(resolve,reject){
                ZApi.check_token()
                .then(function(token){
                    ZApi._call("/projects",token,{
                        success: function(res,status,xhr){
                            if (res.data) {
                                resolve(res.data)
                            } else reject(ZApi.API_ERROR)
                        },
                        error: function(xhr,status,err){
                            reject(ZApi.NET_ERROR)
                        },
                        data:(longlist) ? {"longlist":1}:undefined
                    })
                })
                .catch(ZApi._error_callback)
            })
        }
    },
    devices: {

    },
    vms: {

    },
    _call: function(endpoint,token,opt){
        $.ajax(ZApi.url+endpoint,{
            method: opt.method | "GET",
            headers: (token) ? {"Authorization": "Bearer "+token}:undefined,
            success: opt.success,
            error: opt.error,
            timeout: opt.timeout | 5000,
            data: opt.data,
            dataType: 'json',
            contentType: 'application/json; charset=UTF-8'
        })
    }
}