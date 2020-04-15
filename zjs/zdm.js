
var ZDM = {
    locale: null,
    python: null,
    toolchain: null,
    getlocale:null,
    command: function(args,options){
        return new Promise(function(resolve,reject){
            const spawn = require('child_process').spawn;
            const spawns = require('child_process').spawnSync;
            const rl = require('readline')
            var ZStore;
            if (typeof Store === "undefined") {
                ZStore = null
            } else {
                ZStore = Store
            }
            if (!ZDM.python){
                if (process.platform.startsWith("win")){
                    ZDM.python = Z.path.join(ZConf.sysdir,"python","python.exe")
                } else {
                    ZDM.python = Z.path.join(ZConf.sysdir,"python","bin","python")
                }
            }
            if(!ZDM.toolchain){
                ZDM.toolchain = Z.path.join(ZConf.dist_dir,"ztc","zdm.py")
            }
            if(!ZDM.getlocale){
                ZDM.getlocale = Z.path.join(ZConf.dist_dir,"ztc","loc.py")
            }
            if (!ZDM.locale){
                var loccmd = spawns(ZDM.python,[ZDM.getlocale],{encoding:"utf8"})
                console.log("loccmd",loccmd)
                loccmd.stdout = loccmd.stdout.replace(new RegExp(String.fromCharCode(10), "g"),'')
                try{
                    var locj = JSON.parse(loccmd.stdout)
                }
                catch(err){
                    console.log(err)
                    locj = "en_US.UTF-8"
                }
                ZDM.locale = locj
                console.log("Found locale:"+ZDM.locale)
            }

            var opt = options || {}
            var cmdline = ZDM.python
            if(!opt.raw){ //ignore if raw
                args.unshift(ZConf.user_agent)
                args.unshift("--user_agent")
                args.unshift("-J")
                args.unshift("--traceback")
            }
            args.unshift(ZDM.toolchain)

            var environ ={
                ZERYNTH_TESTMODE: process.env.ZERYNTH_TESTMODE || 0,
                LC_ALL: ZDM.locale,
                LANG: ZDM.locale,
                PATH: process.env.PATH || ""
            }
            console.log("[zdm]>"+cmdline+" "+(args.join(" ")))
            const cmd = spawn(cmdline,args,{detached:false,env:environ})

            var outline = rl.createInterface({input:cmd.stdout})
            var errline = rl.createInterface({input:cmd.stderr})
            if (opt.stdout) {
                outline.on("line",opt.stdout)
            } else {
                outline.on("line",(data)=>{
                    Z.log(data)
                })
            }
            if (opt.stderr) {
                errline.on("line",opt.stderr)
            } else {
                errline.on("line",(data)=>{
                    Z.log(data)
                })
            }
            //TODO: do this conditionally on opt.background
            cmd.on("close",(code)=>{
                if (opt.background && ZStore) ZStore.del_command(cmd)
                if (opt.closecb) opt.closecb(code)
                if(opt.always_resolve) resolve()
                else if(code==0) resolve();
                else reject(code)
            })
            cmd.on("error",(err)=>{
                Z.log("[zdm]> Not run!")
                reject(err)
            })
            if (opt.background) {
                if (ZStore) ZStore.add_command(cmd)
                resolve(cmd)
            }
        })
    },
    alldevlist: function(){
        return new Promise((resolve,reject)=>{
            var res
            ZDM.command(["device","all"],{
                stdout: (line)=>{
                    res = JSON.parse(line)
                }
            }).then(()=>{
                resolve(res)
            }).catch((err)=>{
                reject(err)
            })
        })
    },
    getdev: function(target){
        return new Promise((resolve,reject)=>{
            var res
            ZDM.command(["device","get",target],{
                stdout: (line)=>{
                    res = JSON.parse(line)
                }
            }).then(()=>{
                resolve(res)
            }).catch((err)=>{
                reject(err)
            })
        })
    },
}
