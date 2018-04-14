var fs = require('fs');
var path = require('path');


var ZConf = {
    //TODO: fix absolute path
    conf_file: Z.zdir("cfg"),
    cvmdir: Z.zdir("cvm"),
    index_file: Z.zdir("index.json"),
    tempdir:Z.zdir("tmp"),
    sysdir:Z.zdir("sys"),
    "badges":{
        "completed_profile": "Completed Profile 100%",
        "trial_period_tapped": "Trial Period Released",
        "pro_asset_received": "Pro Asset - 50 VMs - FreeRTOS"
    },
    projfilename: ".zproject",
    conf: {
        env:{
            workspaces:[Z.homedir()],
            recent_projects: []
        },
        editor_theme: "blackboard",
        editor_font_size:12,
        device_mode:"auto"
    },
    init: function(){
        if (process.env.ZERYNTH_TESTMODE == 1) {
            ZConf.oauth={
                "google":"http://localhost/v1/user/google?json=1",
                "facebook":"http://localhost/v1/user/facebook?json=1",
                "zerynth":"http://localhost/v1/user",
                "github":"https://localhost/v1/user/github/auth",
            }
            ZConf.redirect={
                "google":"http://localhost/v1/user/google/auth",
                "facebook":"http://locahost/v1/user/facebook/auth",
                "zerynth":"http://localhost/v1/user",  
                "github":"https://localhost/v1/user/github/auth",
            }
            ZConf.docurl = "http://localdoc"
            ZConf.url = "http://localhost/v1"
            ZConf.adm_url = "http://localhost:7700"
            ZConf.testmode = true
        } else if (process.env.ZERYNTH_TESTMODE == 2) {
            ZConf.oauth = {
                    "google":"https://test.zerynth.com/v1/user/google?json=1",
                    "facebook":"https://test.zerynth.com/v1/user/facebook?json=1",
                    "zerynth":"https://test.zerynth.com/v1/user",
                    "github":"https://github.com/login/oauth/authorize?client_id=882c71c6f98cd0354d97&scope=user,repo&state=",
                },
            ZConf.redirect = {
                    "google":"https://test.zerynth.com/v1/user/google/auth",
                    "facebook":"https://test.zerynth.com/v1/user/facebook/auth",
                    "zerynth":"https://test.zerynth.com/v1/user",  
                    "github":"https://test.zerynth.com/v1/user/github/auth",
            }
            ZConf.docurl = "http://docs.zerynth.com"
            ZConf.url = "http://test.zerynth.com/v1"
            ZConf.adm_url = "http://test.zerynth.com:7700"
            ZConf.testmode = true
            ZConf.cimode = true
        } else {
            ZConf.oauth = {
                    "google":"https://backend.zerynth.com/v1/user/google?json=1",
                    "facebook":"https://backend.zerynth.com/v1/user/facebook?json=1",
                    "zerynth":"https://backend.zerynth.com/v1/user",
                    "github":"https://github.com/login/oauth/authorize?client_id=99fdc1e39d8ce3051ce6&scope=user,repo&state=",
                },
            ZConf.redirect = {
                    "google":"https://backend.zerynth.com/v1/user/google/auth",
                    "facebook":"https://backend.zerynth.com/v1/user/facebook/auth",
                    "zerynth":"https://backend.zerynth.com/v1/user",  
                    "github":"https://backend.zerynth.com/v1/user/github/auth",
            }
            ZConf.docurl = "http://docs.zerynth.com"
            ZConf.url = "http://backend.zerynth.com/v1"
            ZConf.adm_url = "https://api.zerynth.com/v1"
            ZConf.testmode = false
        }
        ZConf.settings_file = Z.path.join(ZConf.conf_file,"settings.json")
        ZConf.dist_dir = Z.zdir("dist")
        try {
            var cfgpath = Z.path.join(ZConf.conf_file,"config.json")
            var cc = Z.fs.readFileSync(cfgpath,{encoding:"utf8"})
            var vrs = JSON.parse(cc)
            ZConf.vrs = vrs["version"]
            ZConf.dist_dir=Z.path.join(ZConf.dist_dir,vrs["version"])
            var ppath = Z.path.join(ZConf.dist_dir,"patch.json")
            try {
                var pp = Z.fs.readFileSync(ppath,{encoding:"utf8"})
                var pth = JSON.parse(pp)
                ZConf.patch = pth[ZConf.vrs]
            } catch(err){
                ZConf.patch = "base"
            }
        } catch (err){
            ZConf.dist_dir=Z.path.join(ZConf.dist_dir,"r2.0.0")
        }
    },
    save: function (callback) {
        var filePath = ZConf.settings_file
        ZConf.conf["last_saved"]=Date.now()
        fs.writeFile(filePath, JSON.stringify(ZConf.conf,null,2), function (err) {
            if (err) {
                console.info("There was an error attempting to save your data.");
                console.warn(err.message);
                return;
            } else {
                console.log("Saved configuration...")
                if (callback)  callback();
            }
        });
    },
    load: function(callback){
        var filePath = ZConf.settings_file
        fs.readFile(filePath, function (err,data) {
            if (err) {
                console.info("There was an error attempting to load your data.");
                console.warn(err.message);
                if (callback) callback(err);
            } else  {
                var conf;
                try {
                    conf = JSON.parse(data);
                } catch(err){
                    conf = ZConf.conf
                }
                for(var attrname in ZConf.conf) if (!conf.hasOwnProperty(attrname)) conf[attrname] = ZConf.conf[attrname]
                ZConf.conf=conf
                console.log("Loading configuration...")
                console.log(ZConf.conf)
                if (callback) callback(data);
            }
        })
    },
    put: function(key,val){
        ZConf.conf[key]=val
        ZConf.save()
    },
    get: function(key){
        return ZConf.conf[key]
    },
    put_token: function(data){
        // var tpath = Z.path.join(ZConf.conf_file,"token.json")
        // try {
        //     Z.fs.writeFileSync(tpath,JSON.stringify(data))
        // } catch(err){
        //     Z.log("Error saving token! "+err)
        // }
        ZTC.command(["login","--token",data.token]).then(()=>{}).catch((err)=>{Z.log("Error while setting token! "+err)})
    },
    get_token: function(){
        var tpath = Z.path.join(ZConf.conf_file,"token.json")
        try {
            var fdata = Z.fs.readFileSync(tpath,{encoding:"utf8"})
            var data = JSON.parse(fdata)
            return data
        } catch (err){
            console.log("Error loading token.json "+err)
            return null
        }
    },
    github_flow: function(ok_cb, close_cb){
        var x0,y0,x1,y1,x,y;
        x0 = nw.Window.get().x;
        y0 = nw.Window.get().y;
        x1 = x0 + nw.Window.get().width;
        y1 = y0 + nw.Window.get().height;
        x = Math.round((x1+x0)/2 - 400)
        y = Math.round((y1+y0)/2 - 300)
        if(x<x0) x=x0
        if(y<y0) y=y0

        nw.Window.open(ZConf.oauth.github+Store.profile.github.challenge,{
            title:"Github Auth",
            frame:true,
            width:800,
            height:600,
            x:x,
            y:y},function(win){
            win.on("closed", function(){
                ZConf.pub_window=null
                ZConf.github_unchecker()
            })
            ZConf.pub_window = win
            //login_timeout_stop=false
            ZConf.github_checker(ok_cb)
        })
    },
    pub_timeout: null,
    pub_timeout_stop: null,
    pub_window: null,
    github_checker: function(callback){
        var pub_timeout = ZConf.pub_timeout
        var pub_timeout_stop = ZConf.pub_timeout_stop
        var pub_window = ZConf.pub_window
        if (!pub_timeout && !pub_timeout_stop){
            ZConf.pub_timeout = setInterval(function(){
                console.log("CHECK LOCATION!")
                if(pub_window && pub_window.window.document.location.href.startsWith(ZConf.redirect.github)){
                    //TODO: check content & save token
                    console.log("BEFORE CHECK!")
                    var cnt = pub_window.window.document.body.innerHTML.replace(/(<([^>]+)>)/ig,"") //<pre> tags can be there
                    console.log(cnt)
                    var ok = false
                    var emsg=""
                    try {
                        var res = JSON.parse(cnt)
                        console.log(res)
                        if (res.data && res.data.access_token) {
                            ok = res.data
                            emsg="ok"
                        } else {
                            emsg="failed authentication!"
                        }
                    } catch(err) {
                        emsg="unknown error"+err
                    }
                    ZConf.github_unchecker()
                    if (callback) callback(ok,emsg)
                }
            },100)
        }
    },
    github_unchecker: function(){
        if (ZConf.pub_timeout) {
            console.log("Clear timeout")
            clearInterval(ZConf.pub_timeout);
            ZConf.pub_timeout = null
            ZConf.timeout_stop=true
        }

        if (ZConf.pub_window) {
            console.log("Close window")
            ZConf.pub_window.window.close()
            ZConf.pub_window = null
        }
    },

};


//Global Utility functions
function timestamp(){
    return parseInt(Date.now()/1000)
}
