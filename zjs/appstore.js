

var Bus = require('eventbusjs');
                
var Store = {
    projects: {
        current: null,
        items: [],
        decorations: {}
    },
    allprojects: {
        items:[],
        refreshed: false,
        selected: -1
    },
    docs: {
        items:[],
        current: null,
        exts: {
            ".py":"python",
            ".htm": "html",
            ".html": "html",
            ".css": "css",
            ".js":"javascript",
            ".json":"json",
            ".c":"c_cpp",
            ".h":"c_cpp",
            ".txt":"text",
            ".md":"markdown",
            ".rst":"rst",
            ".yml":"yaml"
        }
    },
    consoles: {
    },
    windows: {

    },
    action_flags:{
        compiling:false,
        uplinking:false,
        virtualizing:false,
        installing:false
    },
    vms:{

    },
    commands: {

    },
    add_command: function(cmd){
        console.log("Adding: "+cmd.pid)
        Store.commands[cmd.pid]=cmd
    },
    del_command: function(cmd){
        delete Store.commands[cmd.cid]
    },
    actions: function(){
        console.log("ACTIONS"+_.some(Store.action_flags))
        console.log(Store.action_flags)
        return _.some(Store.action_flags)
    },
    action: function(act,what){
        Store.action_flags[act]=what
    },
    select_document: function(doc){
        console.log("new selection")
        console.log(doc)
        Store.docs.current = doc
        Bus.dispatch("document_ready",App,doc)
    },
    add_document: function(prj,file,make_current,toline){
        var path=require("path")
        var ilen = Store.docs.items.length
        var doc = _.find(Store.docs.items,function(d){return d.file==file})
        if (!doc){
            doc = {
                file: file,
                name: path.basename(file),
                ext: path.extname(file).toLowerCase(),
                project: prj,
                modified: false,
                esession: new ace.EditSession(""),
                edoc: null,
                emode: "text",
                pmode: ""
            }
            doc.edoc = doc.esession.getDocument()
            doc.esession.setUseWorker(false); //disable syntax checker
            Store.docs.items.push(doc)
            ZNotify.wait("Loading "+doc.file)
            Store.read_document(doc)
                .then(()=>{
                    ZNotify.done()
                    Bus.dispatch("document_ready",App,doc)
                })
                .catch((err)=>{
                    ZNotify.done("Error")
                    Bus.dispatch("document_ready",App,doc)
                })
        } else {
            //if(make_current) Bus.dispatch("document_ready",App,doc)
        }
        doc.toline=toline
        if(make_current){
            Store.docs.current = doc
        }        
        //if(ilen<Store.docs.items.length) Bus.dispatch("document_new")
        //else if(make_current) Bus.dispatch("document_changed")
        Bus.dispatch("document_ready",App,Store.docs.current)
    },
    set_profile: function(prof){
        Store.profile = prof
        Bus.dispatch("profile_changed")
    },
    read_document: function(doc){
        return new Promise(function(resolve,reject){
            var fs=require("fs")
            if (_.find(_.keys(Store.docs.exts),function(e){return e==doc.ext})){
                doc.emode = "text"
                doc.esession.setMode("ace/mode/"+Store.docs.exts[doc.ext])
                doc.pmode = Store.docs.exts[doc.ext]
            } else {
                doc.emode = "binary"
                doc.esession.setMode("ace/mode/text")
            }
            console.log("reading "+doc.file)
            fs.readFile(doc.file,{encoding:(doc.emode=="text")?"utf-8":null},function(err,data){
                if(err){
                    doc.edoc.setValue("Can't load file: "+err)
                    reject(err)
                } else {
                    if (doc.emode=="text"){
                        doc.edoc.setValue(data)
                    } else {
                        var line = ""
                        _.each(data,function(v,k,l){
                            if (k && k%80==0){
                                line+="\n"
                            } 
                            line+=v.toString(16)+" "
                        })
                        doc.edoc.setValue(line)
                    }
                    doc.edoc.on("change",function(){
                        console.log("Change doc:"+doc.modified)
                        var was_modified = doc.modified
                        doc.modified=true
                        if (!was_modified) Bus.dispatch("document_changed")
                    })
                    doc.esession.getSelection().on("changeCursor",function(){
                        Bus.dispatch("cursor_changed",null,doc.esession.getSelection().getCursor())
                    })
                    doc.esession.setUndoManager(new ace.UndoManager())
                    resolve(doc)
                }
            })
        })
    },
    remove_document: function(doc,cur_doc){
        Store.docs.items = _.without(Store.docs.items,doc)
        if (doc==Store.docs.current) Store.docs.current=null;
        if(cur_doc) {
            Store.docs.current=cur_doc
            Bus.dispatch("document_ready",null,cur_doc)
        }
        Bus.dispatch("document_changed")

    },  
    watch_project: function(prj){
        if (prj) prj.set_watcher((p,f)=>{Bus.dispatch("project_change")})
    },
    unwatch_project: function(prj){
        if (prj) prj.unset_watcher()
    },
    add_project: function(prj,make_current){
        var x = _.find(Store.projects.items,(p)=>{return p.path==prj.path})
        var wks = null
        if(!x) {
            Store.projects.items.push(prj);
            Store.allprojects.refreshed = false
        }
        else prj=x;
        if(make_current) {
            if (Store.projects.current) Store.projects.current.unset_watcher()
            Store.projects.current = prj
            Store.watch_project(prj)
            wks = Z.path.dirname(prj.path)
            if (!_.find(ZConf.conf.env.workspaces,(p)=>{return p==wks})) {
                ZConf.conf.env.workspaces.push(wks)
            } else wks=null
            ZConf.conf.env.recent_projects = _.without(ZConf.conf.env.recent_projects,prj.path)
            ZConf.conf.env.recent_projects.unshift(prj.path)
            ZConf.conf.env.recent_projects =_.first(ZConf.conf.env.recent_projects,10)
            ZConf.save(()=>{
                if (wks){
                    Store.allprojects.refreshed=false
                    Bus.dispatch("projects_changed")
                }
            })
        }
        //Store.projects.items =_.uniq(Store.projects.items,false,function(value,key,list){return value.path})
        Bus.dispatch("project_new")
    },
    remove_project: function(path){
        console.log("REMOVE!"+path)
        var prj = Store.find_project(path)
        console.log(prj)
        if (!prj) return
        var prjs = []
        _.each(Store.projects.items,(p,k,l)=>{
            if (p.path!=prj.path) prjs.push(p)
        })
        Store.projects.items = prjs
        if (Store.projects.current && Store.projects.current.path==prj.path){
            if (Store.projects.items.length>0){
                Store.add_project(Store.projects.items[0],true)
            } else {
                Store.projects.current.unset_watcher()
                Store.projects.current=null
            }
        }
        Bus.dispatch("projects_changed")
        Bus.dispatch("project_change")
    },
    find_project: function(path){
        return _.find(Store.projects.items,(prj)=>{ return prj.path==path})
    },
    fill_allprojects: function(){
        return new Promise(function(resolve,reject){
            var fs = require('fs'), path = require('path');
            var items = []
            var toremove = []
            console.log("Checking for projects in the following folders "+ZConf.conf.env.workspaces)
            _.each(ZConf.conf.env.workspaces,function(wks,index,lst){
                var prjdirs;
                try{
                    prjdirs=Z.dirs(wks)
                } catch(err){
                    //error, remove wks from workspaces
                    toremove.push(wks)
                    return
                }
                var prjfound=0
                _.each(prjdirs,(prjdir,index,list)=>{
                    var prjfile = path.join(wks,prjdir,ZConf.projfilename)
                    try{
                        if (fs.statSync(prjfile).isFile()) {
                            var p = JSON.parse(fs.readFileSync(prjfile,{encoding:"utf-8"}))
                            p.path = path.join(wks,prjdir)
                            p.wks = wks
                            items.push(p)
                            prjfound++
                        }
                    } catch (err){
                        //not existing
                    }
                })
                //remove wks if no project is found
                if (prjfound<=0) toremove.push(wks)
            })
            Store.allprojects.items = items
            Store.allprojects.refreshed = true
            console.log("Workspaces to be removed "+toremove)
            ZConf.conf.env.workspaces = _.without(ZConf.conf.env.workspaces,toremove)
            ZConf.save()
            resolve(items)
        })
    },
    save_docs: function(){
        return new Promise((resolve,reject)=>{
            Z.async.eachSeries(Store.docs.items,(doc,cb)=>{
                if(doc.modified){
                    var content = doc.edoc.getValue()
                    doc.modified=false //set to false
                    Store.unwatch_project(doc.project)
                    //TODO: differentiate between binary and text modes
                    Z.fs.writeFile(doc.file,content,{encondig:"utf8"},(err)=>{
                        if(err) {
                            Z.log("Error while saving: "+doc.file)
                        } else {
                            Bus.dispatch("document_changed")
                        }
                        Store.watch_project(doc.project)
                        cb()
                    })
                } else cb()
            },()=>{
                resolve()
            })
        })
    },
    auto_save: function(){
        setTimeout(()=>{
            //TODO: add catch handling
            Store.save_docs().then(Store.auto_save)
        },15000)
    },
    set_decorations: function(tdecs,prj){
        var curr=false
        var decs = _.union(_.map(tdecs.warnings,(v,k,l)=>{v.type="warning"; return v}),_.map(tdecs.errors,(v,k,l)=>{v.type="error"; return v}))
        _.each(decs,(dec,k,l)=>{
            if (Store.docs.current && dec.file==Store.docs.current.file) curr=true;
            Store.projects.decorations[dec.file]=[]
        })
        _.each(decs,(dec,k,l)=>{
            Store.projects.decorations[dec.file].push(dec)
        })
        if (curr){
            //trigger for current document
            Bus.dispatch("document_ready",App,Store.docs.current)
        } else if (Store.docs.current && Store.docs.current.project.path==prj.path){
            Bus.dispatch("document_ready",App,Store.docs.current)
        }
    },
    get_decorations: function(doc){
        return Store.projects.decorations[doc.file]
    },
    clear_decorations: function(prj){
        _.each(Store.docs.items,(doc,k,l)=>{
            if (doc.project.path==prj.path){
                Store.projects.decorations[doc.file]=[]
            }
        })
    },
    open_window: function(url,options){
        var cw = Store.windows[url]
        if (!cw) {
            console.log("Opening",url)
            var gg = nw.Window.open(url,{
                new_instance:false
            },(cwin)=>{
                console.log(gg)
                console.log(cwin)
                cwin.on("loaded",()=>{
                    Store.windows[cid]={
                        win:cwin,
                        cid:cid
                    }
                })
                cwin.on("closed",()=>{
                    console.log("CLOSED!")
                    var cbk = (options) ? options.close_callback:null
                    if (cbk) {
                        cbk()
                    }
                    delete Store.windows[cid]
                })
            })
        } else {
            console.log("Focusing",url)
            cw.win.focus()
        }
    }
}



