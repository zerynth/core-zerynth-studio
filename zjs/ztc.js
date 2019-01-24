
var ZTC = {
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
            if (!ZTC.python){
                if (process.platform.startsWith("win")){
                    ZTC.python = Z.path.join(ZConf.sysdir,"python","python.exe")
                } else {
                    ZTC.python = Z.path.join(ZConf.sysdir,"python","bin","python")
                }
            }
            if(!ZTC.toolchain){
                ZTC.toolchain = Z.path.join(ZConf.dist_dir,"ztc","ztc.py")
            }
            if(!ZTC.getlocale){
                ZTC.getlocale = Z.path.join(ZConf.dist_dir,"ztc","loc.py")
            }
            if (!ZTC.locale){
                var loccmd = spawns(ZTC.python,[ZTC.getlocale],{encoding:"utf8"})
                console.log("loccmd",loccmd)
                loccmd.stdout = loccmd.stdout.replace(new RegExp(String.fromCharCode(10), "g"),'')
                try{
                    var locj = JSON.parse(loccmd.stdout)
                }
                catch(err){
                    console.log(err)
                    locj = "en_US.UTF-8"
                }
                ZTC.locale = locj
                console.log("Found locale:"+ZTC.locale)
            }

            var opt = options || {}
            var cmdline = ZTC.python
            if(!opt.raw){ //ignore if raw
                args.unshift(ZConf.user_agent)
                args.unshift("--user_agent")
                args.unshift("-J")
                args.unshift("--traceback")
            }
            args.unshift(ZTC.toolchain)

            var environ ={
                ZERYNTH_TESTMODE: process.env.ZERYNTH_TESTMODE || 0,
                LC_ALL: ZTC.locale,
                LANG: ZTC.locale,
                PATH: process.env.PATH || ""
            }
            console.log("[ztc]>"+cmdline+" "+(args.join(" ")))
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
                Z.log("[ztc]> Not run!")
                reject(err)
            })
            if (opt.background) {
                if (ZStore) ZStore.add_command(cmd)
                resolve(cmd)
            }
        })
    },
    compile_project:function(prj,target){
        return new Promise((resolve,reject)=>{
            var warnings = []
            var errors = []
            ZTC.command(["compile",prj.path,target,"-o",Z.path.join(ZConf.tempdir,"zstudio")],{
                always_resolve: true,
                stderr: (line)=>{
                    if (line.startsWith("[error]")){
                        var res
                        var re = /\[error\](.*)\[(.*)\].*\[(.*)\].*at line ([0-9]+).*/
                        res = line.match(re)
                        if (res) {
                            line = line.replace("["+res[3]+"]",'[<a href="javascript:App.open_marker(\''+prj.path+'\',\''+res[3]+'\','+res[4]+')">'+res[3]+'</a>]')
                            errors.push({
                            line:res[4],
                            file:res[3],
                            prj:prj,
                            msg: res[1]+res[2]
                            })
                        }
                    } else if (line.startsWith("[warning]")){

                    }
                    Z.log(line)
                },
                stdout: (line)=>{
                    Z.log(line)
                }
            })
            .then(()=>{
                resolve({warnings:warnings,errors:errors})
            })
            .catch((err)=>{
                reject(err)
            })
        })
    },
    find_imports: function(prjfile){
        return new Promise((resolve,reject)=>{
            var res=[]
            ZTC.command(["compile",prjfile,"no_device","--imports"],{
                always_resolve: true,
                stdout: (line)=>{
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
            .then(()=>{
                resolve(res)
            })
            .catch((err)=>{
                reject(err)
            })
        })

    },
    parse_configuration: function(prj,target){
        return new Promise((resolve,reject)=>{
            var res=[]
            ZTC.command(["compile",prj,target,"--config"],{
                always_resolve: true,
                stdout: (line)=>{
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                        Z.log(line)
                    }
                }
            })
            .then(()=>{
                resolve(res)
            })
            .catch((err)=>{
                reject(err)
            })
        })

    },
    update_configuration: function(prj,def,value){
        return new Promise((resolve,reject)=>{
            var res=[]
            var args = ["project","config",prj]
            if (value===null) {
                args.push("-X")
                args.push(def)
            } else {
                args.push("-D")
                args.push(def)
                args.push(value)
            }

            ZTC.command(args)
            .then(()=>{
                resolve(res)
            })
            .catch((err)=>{
                reject(err)
            })
        })

    },
    inspect: function(target,probe){
        return new Promise((resolve,reject)=>{
            var inspection=null
            ZTC.command(["probe","inspect",target,probe],{
                stdout: (line) => {
                    try {
                        inspection=JSON.parse(line)
                    } catch(err) {
                        console.log(err)
                    }
                }
            })
            .then(()=>{
                if(!inspection) reject("Can't inspect!")
                else resolve(inspection)
            })
            .catch((err)=>{
                reject(err)
            })
        })
    },
    own_vm:function(dev){
        return new Promise((resolve,reject)=>{
            if (!dev.manual) {
                ZTC.command(["vm","own_alias",dev.alias],{
                    stdout: (line)=>{
                        Z.log(line)
                        if (line.includes("reset the device")){
                            ZNotify.alert_timeout("Please Reset the Device!","Device Reset needed","info",5000)
                        }
                    }
                }).then(()=>{
                    resolve()
                }).catch((err)=>{
                    reject(err)
                })
            } else {
                //manual devices
                if (dev.probe) {
                    ZTC.command(["vm","own_by_probe",dev.target,dev.probe])
                    .then(()=>{
                        resolve()
                    }).catch((err)=>{
                        reject(err)
                    })
                } else {
                    ZTC.command(["vm","own_target",dev.target,"--spec","port:"+dev.port],{
                        stdout: (line)=>{
                            Z.log(line)
                            if (line.includes("reset the device")){
                                ZNotify.alert_timeout("Please Reset the Device!","Device Reset needed","info",5000)
                            }
                        }
                    })
                    .then(()=>{
                        resolve()
                    }).catch((err)=>{
                        reject(err)
                    })
                }

            }
        })
    },
    uplink_project:function(prj,dev){
        return new Promise((resolve,reject)=>{
            var infile = Z.path.join(ZConf.tempdir,"zstudio.vbo")
            if (!dev.manual) {
                ZTC.command(["uplink",dev.alias,infile],{
                    stdout: (line)=>{
                        Z.log(line)
                        if (line.includes("reset the device")){
                            ZNotify.alert_timeout("Please Reset the Device!","Device Reset needed","info",5000)
                        }
                    }
                }).then(()=>{
                    resolve()
                }).catch((err)=>{
                    reject(err)
                })
            } else {
                //manual devices
                if (dev.probe) {
                    ZTC.inspect(dev.target,dev.probe)
                        .then((inspection)=>{
                            var outfile = Z.path.join(ZConf.tempdir,"zstudio.bin")
                            ZTC.link(inspection.vmuid,infile,0,0,outfile,true)
                                .then(()=>{
                                    //now uplink by probe!
                                    ZTC.command(["uplink_by_probe",dev.target,dev.probe,outfile])
                                    .then(()=>{
                                        resolve()
                                    }).catch((err)=>{
                                        reject(err)
                                    })
                                })
                                .catch((err)=>{
                                    reject(err)
                                })

                        })
                        .catch((err)=>{
                            reject(err)
                        })
                } else {
                    //uplink raw
                    ZTC.command(["uplink_raw",dev.target,infile,"--spec","port:"+dev.port])
                    .then(()=>{
                        resolve()
                    }).catch((err)=>{
                        reject(err)
                    })
                }

            }
        })
    },
    link:function(vmuid,bytecode,vmslot,bcslot,output,binary){
        return new Promise((resolve,reject)=>{
            args =["link",vmuid,bytecode,"--vm",vmslot,"--bc",bcslot,"--file",output,"--debug_bytecode"]
            if (binary) args.push("--bin")
            ZTC.command(args,{
                stdout: (line)=>{
                    Z.log(line)
                }
            }).then(()=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
        })
    },
    set_token:function(token){
        return new Promise((resolve,reject)=>{
            ZTC.command(["login","--token",token],{
                stdout: (line)=>{
                    Z.log(line)
                }
            }).then(()=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
        })
    },
    zpm_query:function(query,types,local){
        types = types || "lib"
        return new Promise((resolve,reject)=>{
            var res = []
            if (!local){
                ZTC.command(["package","search","--types",types,query],{
                    stdout: (line)=>{
                        res = JSON.parse(line)
                    }
                }).then(()=>{
                    resolve(res)
                }).catch((err)=>{
                    reject(err)
                })
            } else {
                ZTC.command(["package","installed"],{
                    stdout: (line)=>{
                        res = JSON.parse(line)
                    }
                }).then(()=>{
                    resolve(res)
                }).catch((err)=>{
                    reject(err)
                })

            }
        })
    },
    zpm_info: function(fullname){
        return new Promise((resolve,reject)=>{
            var res
            ZTC.command(["package","info",fullname],{
                stdout: (line)=>{
                    res = JSON.parse(line)
                }})
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    zpm_sync: function(){
        return new Promise((resolve,reject)=>{
            var res
            ZTC.command(["package","sync"])
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    zpm_install: function(fullname,version){
        return new Promise((resolve,reject)=>{
            ZTC.command(["package","install",fullname,version])
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    zpm_install_list: function(packs){
        return new Promise((resolve,reject)=>{
            var cmd = ["package","install"]
            _.each(packs,(v,k,l)=>{
                cmd.push("-p")
                cmd.push(k+":"+v)
            })
            cmd.push("--last")
            cmd.push("--justnew")
            cmd.push("--db")
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    zpm_update_all: function(){
        return new Promise((resolve,reject)=>{
            var res
            ZTC.command(["package","update_all","--simulate"],{
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
    vmlist: function(target){
        return new Promise((resolve,reject)=>{
            var res
            ZTC.command(["vm","available",target],{
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
    vmlistcreated: function(remoteid){
        return new Promise((resolve,reject)=>{
            var res
            ZTC.command(["vm","list","--dev_uid",remoteid],{
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
    vmcreate: function(vm,dev){
        return new Promise((resolve,reject)=>{
            var cmd = ["vm","create",dev.alias,vm.version,vm.thevm.rtos,vm.patch]
            _.each(vm.thevm.features,(v,k,l)=>{cmd.push("--feat");cmd.push(v)})
            if (dev.customized) {
                cmd.push("--custom_target")
                cmd.push(dev.target)
            }
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    vmcreate_by_uid: function(vm,dev){
        return new Promise((resolve,reject)=>{
            var cmd = ["vm","create_by_uid",dev.remote_id,vm.version,vm.thevm.rtos,vm.patch]
            _.each(vm.thevm.features,(v,k,l)=>{cmd.push("--feat");cmd.push(v)})
            if (dev.customized) {
                cmd.push("--custom_target")
                cmd.push(dev.target)
            }
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    get_profile: function(stderr){
        return new Promise((resolve,reject)=>{
            var cmd = ["profile"]
            var res
            ZTC.command(cmd,{
                stdout: (line)=>{
                    res = JSON.parse(line)
                },
                stderr: stderr
                })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    set_profile: function(profile){
        return new Promise((resolve,reject)=>{
            var cmd = ["profile","--set"]
            if (profile.name) {cmd.push("--name"); cmd.push(profile.name)}
            if (profile.surname) {cmd.push("--surname"); cmd.push(profile.surname)}
            if (profile.job) {cmd.push("--job"); cmd.push(profile.job)}
            if (profile.company) {cmd.push("--company"); cmd.push(profile.company)}
            if (profile.age) {cmd.push("--age"); cmd.push(profile.age)}
            if (profile.country) {cmd.push("--country"); cmd.push(profile.country)}
            if (profile.website) {cmd.push("--website"); cmd.push(profile.website)}
            var res
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)

                })
        })
    },
    reset_pwd: function(email){
        return new Promise((resolve,reject)=>{
            var cmd = ["reset",email]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })

    },
    prj_git_init: function(prjpath){
        return new Promise((resolve,reject)=>{
            var cmd = ["project","git_init",prjpath]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    prj_git_status: function(prjpath){
        return new Promise((resolve,reject)=>{
            var cmd = ["project","git_status",prjpath]
            var status
            ZTC.command(cmd,{
                    stdout: (line)=>{
                        try{
                            status = JSON.parse(line)
                        } catch(err){
                            console.log("bad json in ztc:"+line)
                        }
                    }
                })
                .then(()=>{
                    resolve(status)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    prj_git_fetch: function(prjpath){
        return new Promise((resolve,reject)=>{
            var cmd = ["project","git_fetch",prjpath]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    prj_git_commit: function(prjpath,message){
        return new Promise((resolve,reject)=>{
            if (!message) message="Commit"
            var cmd = ["project","git_commit",prjpath,"-m",message]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    prj_git_push: function(prjpath){
        return new Promise((resolve,reject)=>{
            var cmd = ["project","git_push",prjpath]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    prj_git_pull: function(prjpath){
        return new Promise((resolve,reject)=>{
            var cmd = ["project","git_pull",prjpath]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    prj_git_clone: function(prjpath,projuid){
        return new Promise((resolve,reject)=>{
            var cmd = ["project","git_clone",projuid,prjpath]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    prj_git_clone_external: function(title,url,prjpath){
        return new Promise((resolve,reject)=>{
            var cmd = ["project","git_clone_external",url,prjpath,"--title",title]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    prj_git_branch: function(prjpath,branch){
        return new Promise((resolve,reject)=>{
            var cmd = ["project","git_branch",prjpath,branch]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    get_projects: function(){
        var prjs = []
        var tot=100
        var cnt=0
        var _from=0;

        return new Promise((resolve,reject)=>{
            Z.async.whilst(
                ()=>{return cnt<tot},
                (callback)=>{
                    var cmd = ["project","list","--from",_from]
                    ZTC.command(cmd,{stdout: (line)=>{
                        try {
                            var dt = JSON.parse(line)
                            console.log(dt)
                            tot = dt.total
                            _from=cnt
                            _.each(dt.list,(v,k,l)=>{
                                v.index=cnt++
                                prjs.push(v)
                            })
                        }catch(err){ console.log("bad json")}
                    }})
                        .then(()=>{
                            callback(null)
                        })
                        .catch((err)=>{
                            callback(err)
                        })
                },
                (err)=>{
                    if (err==null) resolve(prjs)
                    else reject(err)
                }
            )
        })
    },
    get_namespaces: function(){
        var nss = []
        return new Promise((resolve,reject)=>{
            var cmd = ["namespace","list"]
            ZTC.command(cmd,{stdout:(line)=>{nss=JSON.parse(line)}})
                .then(()=>{
                    resolve(nss)
                })
                .catch((err)=>{
                    reject(err)
                })
        })

    },
    create_namespace: function(ns){
        return new Promise((resolve,reject)=>{
            var cmd = ["namespace","create",ns]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    publish: function(prj,version){
        return new Promise((resolve,reject)=>{
            var cmd = ["package","publish",prj.path,version]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    kill: function(pid){
        var psTree = require("ps-tree")
        const cp = require('child_process')
        return new Promise((resolve,reject)=>{
            var pids = psTree(pid,(err,children)=>{
                children.push({PID:pid,COMM:"parent"})
                _.each(children,(p,k,l)=>{
                    if (process.platform.startsWith("win")){
                        cp.exec('taskkill /PID '+pid+' /T /F',(error,stdout,stderr)=>{
                            console.log(stdout)
                            console.log(stderr)
                        })
                    }else {
                        try { process.kill(p.PID,'SIGKILL')} catch(err){console.log("Error killing "+p.PID+"-"+p.COMM+": "+err)}
                    }
                })
                resolve()
            })
        })
    },
    things_list: function(){
        return new Promise((resolve,reject)=>{
            var cmd = ["thing","list"]
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    things_config: function(uid,args){
        return new Promise((resolve,reject)=>{
            var cmd = ["thing","config",uid]
            cmd = cmd.concat(args)
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    things_info: function(uid){
        return new Promise((resolve,reject)=>{
            var cmd = ["thing","info",uid]
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    things_create: function(name){
        return new Promise((resolve,reject)=>{
            var cmd = ["thing","add",name]
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    things_template_list: function(){
        return new Promise((resolve,reject)=>{
            var cmd = ["thing","template","list"]
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })

    },
    things_template_upload: function(uid,dir){
        return new Promise((resolve,reject)=>{
            var cmd = ["thing","template","upload",uid,dir]
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    things_template_create: function(name){
        return new Promise((resolve,reject)=>{
            var cmd = ["thing","template","add",name]
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    things_group_list: function(){
        return new Promise((resolve,reject)=>{
            var cmd = ["thing","group","list"]
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })

    },
    things_group_config: function(uid,args){
        return new Promise((resolve,reject)=>{
            var cmd = ["thing","group","config",uid]
            cmd = cmd.concat(args)
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })

    },
    things_group_create: function(name){
        return new Promise((resolve,reject)=>{
            var cmd = ["thing","group","add",name]
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })

    },
    ota_monitor: function(cb){
        return new Promise((resolve,reject)=>{
            ZTC.command(
                ["ota","monitor"],
                {
                    stdout: (data)=>{
                        try{
                            res = JSON.parse(data)
                            cb(res)
                        } catch(err){
                            console.log(err) //ignore [info]
                            cb()
                        }
                    },
                    stderr: (data)=>{
                        console.log(data) //ignore [info]
                        cb()
                    },
                    background: true
                }
            ).then((cmd)=>{
                resolve()
            }).catch((err)=>{
                console.log("ERROR"+err)
                reject(err)
            })
        })

    },
    ota_prepare:function(uid,outfile){
        return new Promise((resolve,reject)=>{
            var cmd = ["ota","prepare",uid,outfile]
            ZTC.command(cmd)
            .then(()=>{
                resolve()
            })
            .catch((err)=>{
                reject(err)
            })
        })
    },
    ota_start:function(uid){
        return new Promise((resolve,reject)=>{
            var cmd = ["ota","start",uid]
            ZTC.command(cmd)
            .then(()=>{
                resolve()
            })
            .catch((err)=>{
                reject(err)
            })
        })
    },
    ota_stop:function(uid){
        return new Promise((resolve,reject)=>{
            var cmd = ["ota","stop",uid]
            ZTC.command(cmd)
            .then(()=>{
                resolve()
            })
            .catch((err)=>{
                reject(err)
            })
        })
    },
    cvm_list: function(){
        return new Promise((resolve,reject)=>{
            var cmd = ["vm","custom","list"]
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    cvm_original: function(){
        return new Promise((resolve,reject)=>{
            var cmd = ["vm","custom","original"]
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    cvm_create: function(target,short_name,name) {
        return new Promise((resolve,reject)=>{
            var cmd = ["vm","custom","create",target,short_name,"--name",name]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    cvm_compile: function(short_name) {
        return new Promise((resolve,reject)=>{
            var cmd = ["vm","custom","compile",short_name]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    cvm_remove: function(short_name) {
        return new Promise((resolve,reject)=>{
            var cmd = ["vm","custom","remove",short_name]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    cvm_export: function(short_name,destination) {
        return new Promise((resolve,reject)=>{
            var cmd = ["vm","custom","export",short_name,destination]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    cvm_import: function(source) {
        return new Promise((resolve,reject)=>{
            var cmd = ["vm","custom","import",source]
            ZTC.command(cmd)
                .then(()=>{
                    resolve()
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    },
    redeem_code: function(code){
        return new Promise((resolve,reject)=>{
            var cmd = ["redeem",code]
            var res;
            ZTC.command(cmd,{
                stdout: (line)=>{
                    console.log(line)
                    try{
                        res = JSON.parse(line)
                    } catch(err){
                        console.log(err) //ignore [info]
                    }
                }
            })
                .then(()=>{
                    resolve(res)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    }
}
