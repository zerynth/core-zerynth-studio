var fs = require('fs');
var path = require('path');


var ZConf = {
    //TODO: fix absolute path
    conf_file: Z.zdir("cfg"),
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
        editor_font_size:12
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
    }
};


//Global Utility functions
function timestamp(){
    return parseInt(Date.now()/1000)
}
