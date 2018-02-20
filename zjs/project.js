
var Projects ={
    opened_projects: [],
    open: function(){

    }
}

function Project(path){

    var walk = require('walk')
    , fs = require('fs')
    , pth = require('path');

    console.log("OPEN PROJECT "+path)
    var me = this
    this.path = pth.normalize(path)
    this.projfile = pth.join(path,ZConf.projfilename)
    this.read_tree = function(options){
        console.log("READ TREE")
        return new Promise(function(resolve,reject){
            var tree={}
            var opt = options || {file:()=>{return{}},dir:()=>{return {}}}
            var walker = walk.walk(path, options = {followLinks: false});
            walker.on("file",function(root,stats,next){
                if (stats.name.startsWith(".")){
                    //ignore .files
                    next()
                    return
                }
                if (!tree.hasOwnProperty(root)) {
                    var n = {text:root,nodes:[]}
                    tree[root]=n
                }
                var n = {
                    text:stats.name,
                    name:stats.name, 
                    type:"f",
                    fullname:pth.join(root,stats.name)
                }
                n = _.extend(n,opt.file(n.fullname))

                tree[root].nodes.push(n)
                next()
            })

            walker.on("directory",function(root,stats,next){
                if (stats.name.startsWith(".")){
                    //ignore .directories
                    next()
                    return
                }
                if (!tree.hasOwnProperty(root)) {
                    var n = {text:root,nodes:[]}
                    tree[root]=n
                }
                var n = {
                    text:stats.name,
                    name:stats.name, 
                    type:"d",
                    fullname:pth.join(root,stats.name),
                    nodes:[]
                }
                n = _.extend(n,opt.dir(n.fullname))
                tree[root].nodes.push(n)
                tree[pth.join(root,stats.name)]=n
                next()
            })

            walker.on("end",function(){
                console.log("RESOLVE")
                resolve(tree[path])
            })

            walker.on("errors",function(root,nodeStatsArray,next){
                reject(root)
            })
        })
    }
    this.info = {}
    this.create = function(title,description,_from){
        console.log("Create")
        return new Promise(function(resolve,reject){
            try {
                var stats = fs.statSync(me.projfile)
                console.log("Stats")
                console.log(stats)
                if (stats.isFile() || stats.isDirectory()) {
                    reject("A project already exists at "+me.path)
                    return
                }
            } catch (err){
                // not accessible, go on!
            }
            
            var escaped_title = title.replace('"',"\\\"")
            if (escaped_title.indexOf(" ")>=0)
                escaped_title='"'+escaped_title+'"'
            var cmd = ["project","create",title,me.path]
            if (_from && _from!="") {
                cmd.push("--from")
                cmd.push(_from)
            }
            ZTC.command(cmd)
                .then(()=>{
                    resolve(me)
                })
                .catch((err)=>{
                    reject(err)
                })
        })
    }
    this.open = function(){
        console.log("OPEN PROJECT")
        return new Promise(function(resolve,reject){
            try {
                var stats = fs.statSync(me.projfile)
                if (!stats.isFile()) {
                    reject("No project at "+me.projfile)
                    return
                }  
            } catch(err){
                reject("No project at "+me.projfile)
                return
            }

            try {
                me.info = JSON.parse(fs.readFileSync(me.projfile,{encoding:"utf-8"}))
                if (me.info.git_url){
                    //retrieve git info
                    ZTC.prj_git_status(me.path)
                        .then((st)=>{
                            var chg = {}
                            _.each(st.changes,(v,k,l)=>{ 
                                chg[Z.path.join(me.path,k)]=v
                            })
                            st.changes=chg
                            st.nchanges =_.keys(chg).length
                            me.info.git=st
                            resolve(me)
                        })
                        .catch((err)=>{console.log("GIT Err:"+err); resolve(me)})
                } else resolve(me)
            } catch(err){
                reject("Can't open project file")
            }
        })
    }
    this.close = function(save){
        if (save) {
            me.save()
                .then(()=>{})
                .catch((err)=>{})
        }
        me.unset_watcher()
    },
    this.watcher_status = true
    this.toggle_watcher = function(status){
        me.watcher_status=status
    }
    this.set_watcher = function(cb){
        try {
            me.watcher = fs.watch(me.path,{recursive:true},(event,filename)=>{
                if (me.watcher_status) cb(me,filename)
            })
        } catch(e){
            Z.log("Can't watch project folder! Use refresh to update external changes..."+e)
        }
    },
    this.unset_watcher = function(){
        try{
            me.watcher.close()
        } catch(e){
            console.log("Error while unwatching: "+e)
        }
    },
    this.save = function(){
        return new Promise(function(resolve,reject){
            //me.info.last_updated = (new Date()).toISOString()
            //me.info.
        })
    }
}


