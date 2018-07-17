/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var App = {
    init: function(){
        Z.init_logger("#logger",".ui-layout-south")
        ZConf.init()
        //disable right click context menu for release mode
        if (!ZConf.testmode) document.addEventListener('contextmenu', event => event.preventDefault());
        //disable enter submit for forms
        $('form input').keydown(function(event){
            if(event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
        });
        ZConf.load(()=>{
            Z.log("Loading settings...")
            console.log("Using configuration:")
            console.log(ZConf.conf)
            var gui = nw
            var mwin = gui.Window.get()
            nw.Screen.Init()
            //TODO: restore previous values

            mwin.show();
            mwin.focus();
            mwin.on('maximize', function () {
                App.is_maximized = true
            });

            mwin.on('unmaximize', function () {
                App.is_maximized = false
            });

            mwin.on('minimize', function () {
                App.is_maximized = false
            });

            mwin.on('restore', function () {
                App.is_maximized = false
            });

            mwin.on("close",function(){
                //TODO: warning before closing
                ZConf.save() //TODO: treat as a promise!
                _.each(Store.consoles,(c,k,l)=>{
                    c.win.close()
                })
                _.each(Store.windows,(c,k,l)=>{
                    c.win.close()
                })
                Z.async.eachSeries(Store.commands,(c,cb)=>{
                    ZTC.kill(c.pid).then(()=>{cb()}).catch(()=>{cb()})
                },()=>{
                    //after killin everything, save and close
                    localStorage.setItem("z_win",JSON.stringify({
                        width: mwin.width,
                        height: mwin.height,
                        x: mwin.x,
                        y: mwin.y,
                        maximized: App.is_maximized
                    }))
                    mwin.close(true)
                })

            })
            mwin.on("closed",function(){
                //TODO: warning before closing
            })

            //configure system menu
            var menu = new nw.Menu({type: 'menubar'});

            //mac copy & paste patch
            if (process.platform === "darwin") {
                menu.createMacBuiltin('Zerynth Studio', {hideEdit: false,});
            }

            var submenu = new nw.Menu()
            var subsubmenu = new nw.Menu()

            subsubmenu.append(new nw.MenuItem({label:"Create Repository...",click:()=>{ProjectView.git_init()}}))
            subsubmenu.append(new nw.MenuItem({label:"Commit Changes...",click:()=>{ProjectView.git_op("commit")}}))
            subsubmenu.append(new nw.MenuItem({label:"Push...",click:()=>{ProjectView.git_op("push")}}))
            subsubmenu.append(new nw.MenuItem({label:"Pull...",click:()=>{ProjectView.git_op("pull")}}))
            subsubmenu.append(new nw.MenuItem({label:"Fetch...",click:()=>{ProjectView.git_op("fetch")}}))

            var recent_submenu = new nw.Menu()
            App.empty_label = new nw.MenuItem({label:"empty",is_empty:true})
            App.empty_label_uninst = new nw.MenuItem({label:"empty",is_empty:true})
            recent_submenu.append(App.empty_label)
            var recent_menu = new nw.MenuItem({label:"Recent...",submenu:recent_submenu})
            App.recent_menu=recent_menu
            App.recent_submenu=recent_submenu
            submenu.append(new nw.MenuItem({label:"New",click:Dialogs.project_new}))
            submenu.append(new nw.MenuItem({label:"Open...",click:Dialogs.project_open}))
            submenu.append(new nw.MenuItem({label:"Clone...",click:Dialogs.project_clone}))
            submenu.append(recent_menu)
            submenu.append(new nw.MenuItem({label:"Close",click:function(){ProjectView.close()}}))
            submenu.append(new nw.MenuItem({type:"separator"}))
            submenu.append(new nw.MenuItem({label:"Add File...",click:()=>{ProjectView.ask_add_file()}}))
            submenu.append(new nw.MenuItem({label:"Add Folder...",click:()=>{ProjectView.ask_add_folder()}}))
            submenu.append(new nw.MenuItem({type:"separator"}))
            submenu.append(new nw.MenuItem({label:"Git",submenu:subsubmenu}))
            submenu.append(new nw.MenuItem({type:"separator"}))
            submenu.append(new nw.MenuItem({label:"Build Docs",click:App.make_current_project_docs}))
            submenu.append(new nw.MenuItem({label:"View Docs",click:App.view_current_project_docs}))
            submenu.append(new nw.MenuItem({type:"separator"}))
            submenu.append(new nw.MenuItem({label:"Publish...",click:Dialogs.library_publish}))
            //submenu.append(new nw.MenuItem({type:"separator"}))
            //submenu.append(new nw.MenuItem({label:"Share..."}))
            menu.append(new nw.MenuItem({label:"Project",submenu:submenu}))

            submenu = new nw.Menu()
            submenu.append(new nw.MenuItem({label:"Virtualize",click:App.virtualize}))
            submenu.append(new nw.MenuItem({label:"Info",click:App.device_info}))
            submenu.append(new nw.MenuItem({label:"Pinmap",click:App.device_pinmap}))
            submenu.append(new nw.MenuItem({label:"Console",click:App.open_console}))
            // submenu.append(new nw.MenuItem({label:"Debug",click:App.start_debug}))
            menu.append(new nw.MenuItem({label:"Device",submenu:submenu}))

            submenu = new nw.Menu()
            submenu.append(new nw.MenuItem({label:"Verify",click:App.compile_current_project}))
            //CHECK HANDLE_SUBMENU WHEN RE-ENABLE CLEAN & DEBUG
            //submenu.append(new nw.MenuItem({label:"Clean",click:()=>{App.clean()}}))
            //submenu.append(new nw.MenuItem({label:"Debug"}))
            submenu.append(new nw.MenuItem({label:"Uplink",click:App.uplink_current_project}))
            menu.append(new nw.MenuItem({label:"Build",submenu:submenu}))

            submenu = new nw.Menu()
            //submenu.append(new nw.MenuItem({label:"Themes"}))
            submenu.append(new nw.MenuItem({label:"Profile",click:()=>{App.show_profile()}}))
            var subsubmenu = new nw.Menu()
            App.uninst_submenu = subsubmenu
            submenu.append(new nw.MenuItem({label:"Remove installation",submenu:subsubmenu}))
            submenu.append(new nw.MenuItem({label:"Clean temp folder",click:()=>{App.clean()}}))
            submenu.append(new nw.MenuItem({type:"separator"}))
            submenu.append(new nw.MenuItem({label:"Forget all devices",click:()=>{App.clean_db()}}))
            submenu.append(new nw.MenuItem({label:"Show messages",click:()=>{Dialogs.modal("MessagesModal",Footer.messages)}}))
            submenu.append(new nw.MenuItem({label:"Check Updates",click:()=>{App._update_checker()}}))
            submenu.append(new nw.MenuItem({type:"separator"}))
            submenu.append(new nw.MenuItem({label:"Redeem Licenses",click:()=>{Dialogs.modal("RedeemModal")}}))
            menu.append(new nw.MenuItem({label:"Preferences",submenu:submenu}))
            App.update_uninst_menu()


            submenu = new nw.Menu()
            submenu.append(new nw.MenuItem({label:"Getting Started",click:()=>{nw.Shell.openExternal("https://docs.zerynth.com/latest/official/core.zerynth.docs/gettingstarted/docs/index.html");}}))
            submenu.append(new nw.MenuItem({label:"Supported Devices",click:()=>{nw.Shell.openExternal("https://docs.zerynth.com/latest/supported_boards.html");}}))
            //submenu.append(new nw.MenuItem({label:"How to install packages",click:()=>{nw.Shell.openExternal("http://docs.zerynth.com");}}))
            submenu.append(new nw.MenuItem({type:"separator"}))
            submenu.append(new nw.MenuItem({label:"Online Docs",click:()=>{nw.Shell.openExternal("https://docs.zerynth.com");}}))
            //submenu.append(new nw.MenuItem({label:"Offline Doc"}))
            //submenu.append(new nw.MenuItem({label:"Tutorial",click:()=>{nw.Shell.openExternal("http://docs.zerynth.com");}}))
            submenu.append(new nw.MenuItem({label:"FAQ",click:()=>{nw.Shell.openExternal("https://www.zerynth.com/faq");}}))
            submenu.append(new nw.MenuItem({label:"Community",click:()=>{nw.Shell.openExternal("https://community.zerynth.com");}}))
            submenu.append(new nw.MenuItem({type:"separator"}))
            App.mail_support_menu = new nw.MenuItem({label:"Mail support",click:App.mail_support,enabled:false});
            submenu.append(App.mail_support_menu)
            submenu.append(new nw.MenuItem({type:"separator"}))
            submenu.append(new nw.MenuItem({label:"Show JS Console",click:()=>{mwin.showDevTools();}}))
            submenu.append(new nw.MenuItem({type:"separator"}))
            submenu.append(new nw.MenuItem({label:"About",click:()=>{Dialogs.modal("AboutModal")}}))
            menu.append(new nw.MenuItem({label:"Help",submenu:submenu}))

            mwin.menu = menu;
            App.menu = menu
            App.win = mwin

            App.universal_search=false

            App.initWidgets().then(()=>{
                App.initLayout()
                App.initEditor()
                App.initUniversalSearch()
                App.update_recent_menu()
                LeftBar.select("project")
                Bus.addEventListener("document_changed",App.show_document)
                //Bus.addEventListener("project_new",App.update_recent_menu)
                Bus.addEventListener("project_new",App.handle_submenus)
                Bus.addEventListener("project_change",App.handle_submenus)
                Bus.addEventListener("device_change",App.handle_submenus)
                Bus.addEventListener("login_ok",App.on_login)
                Bus.addEventListener("profile_changed",App.on_profile)

                //disable autocomplete
                $( document ).on( 'focus', ':input', function(){
                        $( this ).attr( 'autocomplete', 'off' );
                });
                $('.selectpicker').selectpicker(); //move in project_view
                $("#device_picker").selectpicker('show')
                $("#device_manual_picker").selectpicker('hide')
                $('[data-toggle="tooltip"]').tooltip()
                ZApi.init(ZConf,null,null,null)
                if (ZConf.testmode) mwin.showDevTools();
                Store.auto_save()
                ZDevices.init()
                window.ondragover = function(e) { e.preventDefault(); return false };
                window.ondrop = function(e) { e.preventDefault(); return false };

                var holder = document.getElementById('project_holder');
                holder.ondragover = function () { if (Store.projects.current) $(this).addClass('hover'); return false; };
                holder.ondragleave = function () { if (Store.projects.current) $(this).removeClass('hover'); return false; };
                holder.ondrop = function (e) {
                    e.preventDefault();
                    $(this).removeClass('hover');
                    for (var i = 0; i < e.dataTransfer.files.length; ++i) {
                      ProjectView.add_file(e.dataTransfer.files[i].path);
                    }
                    return false;
                };
                Z.log("Ready!")
                ZApi.init(ZConf,null,null,null)
                App.handle_submenus()
                ZApi.check_token()
                    .then((token)=>{
                        App.startupwin()
                        //there is a timing issue with put_token since it calls a ZTC command 
                        //and the promise can return later than the get_profile reading the token.json
                        ZTC.get_profile(()=>{})  //don't show error messages here
                            .then((profile)=>{
                                if (profile=="Unauthorized"){
                                    $('#LoginModal').modal()
                                } else {
                                    Store.set_profile(profile)
                                    Z.log("Ok")
                                    Bus.dispatch("login_ok")
                                }
                            })
                            .catch((err)=>{
                                Store.set_profile(null)
                                Z.log("Retrying authorization...")
                            })
                    })
                    .catch((err)=>{
                        App.startupwin()
                        if(err==ZApi.RENEW_ERROR || err==ZApi.NOT_LOGGED){
                            $('#LoginModal').modal()
                        } else {
                            Z.log("WARNING!! Network error, can't renew authorization token. Many features will be unavailable!")
                        }
                    })
            })
        })
    },
    on_profile: function(){
        $(".zerynthLogo").attr("src","img/zerynthlogo.png")
        $(".zerynthLogo").attr("title","")
        //$("#buyvms_label").hide()
        App.mail_support_menu.enabled=true
        // if(Store.profile && Store.profile.subscription!="free"){
        //     $(".zerynthLogo").attr("src","img/zerynthlogopro.png")
        //     $(".zerynthLogo").attr("title","Subscription ends: "+Store.profile.pro.slice(0,-9))
        //     App.mail_support_menu.enabled=true
        // }
    },
    on_login: function(){
        //on successful login
        console.log("LOGIN OK!!!!")
        App.initUpdateChecker()
        if (!Store.profile) {
            ZTC.get_profile(()=>{})
                .then((profile)=>{
                    Store.set_profile(profile)
                    Z.log("Ok")
                })
                .catch((err)=>{
                    Store.set_profile(null)
                    Z.log("Retrying authorization...")
                })
        }
    },
    startupwin: function(){
        $('#splashscreen').hide();
        if (ZConf.cimode) $("#ci_label").show()
        else if (ZConf.testmode) $("#test_label").show()
        if (localStorage.getItem("z_win")){
            var lp =JSON.parse(localStorage.getItem("z_win"))
            App.win.moveTo(lp.x,lp.y)
            App.win.resizeTo(lp.width,lp.height)
            //if(lp.maximized) App.win.maximize()
        } else {
            App.win.maximize();
        }


    },
    initWidgets: function(){
        //initialize all zwidgets
        return new Promise(function(resolve,reject){
            var zw = $(".zwidget")
            var cnt = zw.length;
            zw.each( function(){
                var me = $(this)
                var target = me.attr("target")
                $.get(target,function(data){
                    me.replaceWith(data)
                    cnt--
                    if (cnt<=0) resolve()
                })
            })
        })
    },
    initEditor: function(){
        var ed = ace.edit("code_editor")
        // var ld = ace.edit("logger")
        ace.require("ace/ext/language_tools");
        App.editors = {
            code: ed,
            // logger: ld
        }
        // ld.setReadOnly(true)
        // ld.setShowPrintMargin(false)
        // ld.setHighlightActiveLine(false);
        // ld.renderer.setShowGutter(false)
        // ld.setTheme("ace/theme/chaos")

        ed.setShowPrintMargin(false)
        // TODO: this remove warnings in console...check ace docs
        ed.$blockScrolling = Infinity
        ed.commands.removeCommand('jumptomatching');
        ed.commands.addCommand({
            name:"doc_save",
            bindKey:{win:"Ctrl-S",mac:"Command-S"},
            exec: (editor)=>{
                console.log("Saving documents...")
                Store.save_docs()
            }
        })
        ed.commands.addCommand({
            name:"doc_comment",
            bindKey:{win:"Ctrl-\\",mac:"Command-\\"},
            exec: (editor)=>{
                App.ed_toggle_comment()
            }
        })
        App.change_editor_theme(ZConf.get("editor_theme"))
        ed.setOptions({
            showInvisibles:true,
            highlightActiveLine:true,
            highlightSelectedWord:true,
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true
        })
        App.set_editor_zoom(ZConf.get("editor_font_size"))

        /*
        //TODO: add Zerynth completers
        var staticCompleter = {
            getCompletions: function(editor,session,pos,prefix,callback){
                var doc = Store.docs.current
                console.log(session.getMode())
                if (doc.pmode=="python"){
                    callback(null,[
                        {
                            caption:"zerynth",
                            value: "zerynth2",
                            meta: "module"
                    }
                    ])
                } else callback(null,[])
            }
        }
        ed.completers.push(staticCompleter)
        */
        Bus.addEventListener("document_ready",App.show_document,App)
        ZTC.command(["info","--modules"],{
            stdout: (line)=>{
                Store.modules = JSON.parse(line)
            }
        }).then(()=>{
            var mmap = []
            _.each(Store.modules,(v,k,l)=>{
                _.each(v,(vv,kk,ll)=>{
                    mmap.push({
                        caption: "import "+k+"."+vv,
                        value: "from "+k+" import "+vv,
                        meta:"module"
                    })
                })
            })
            var staticCompleter = {
                getCompletions: function(editor,session,pos,prefix,callback){
                    var doc = Store.docs.current
                    if (doc && doc.pmode=="python"){
                        callback(null,mmap)
                    } else callback(null,[])
                }
            }
            ed.completers.push(staticCompleter)
        }).catch((err)=>{
            Z.log("Error: Zerynth autocompletion disabled "+err)
        })
    },
    initLayout: function(){
        var appLayout = $('#layouter').layout({
            enableCursorHotkey: false,
            east: {
                initClosed: true,
                size: 300,
                resizable: true
            },
            west: {
                size: 340,
                minSize: 48,
                resizable: true
            },
            footer: {
                resizable:false,
                spacing_open: 0,
                minSize: 24,
                size: 24
            },
            onresize_end: function(name, el, state, opts, lname) {
                App.editors.code.resize()
                App.editors.logger.resize()
            },
            onshow_end: function(name, el, state, opts, lname) {
                App.editors.code.resize()
                App.editors.logger.resize()
            },
            onopen_end: function(name, el, state, opts, lname) {
                App.editors.code.resize()
                App.editors.logger.resize()
            }

        });
        appLayout.allowOverflow("west")
        var appLayout2 = $('#centerDiv').layout({
            enableCursorHotkey: false,
            south: {
                initClosed: false,
                resizable: true,
                size: 120,
                minSize: 80,
                maxSize: 240
            },
            onresize_end: function(name, el, state, opts, lname) {
                App.editors.code.resize()
                App.editors.logger.resize()
            },
            onshow_end: function(name, el, state, opts, lname) {
                App.editors.code.resize()
                App.editors.logger.resize()
            },
            onopen_end: function(name, el, state, opts, lname) {
                App.editors.code.resize()
                App.editors.logger.resize()
            }
        });
    },
    initUniversalSearch: function(){
        ZIndex.init()
        var panel = $("#universal_search")
        var input = $("#universal_input")
        var combo = $("#universal_combo")[0]
        var sel= $("#universal_select")
        var optsel = -1
        var optval = null;
        var current = []

        App.universal_hide = function(){
            panel.hide()
            input.blur()
            input.val("")
            sel.html("")
            App.universal_search=false
        }

        var makeVisible = function(elm,dir) {
          var rect = elm.getBoundingClientRect();
          var rect2 = combo.getBoundingClientRect();
          if(!(rect.top>(rect2.top+40) && rect.bottom<rect2.bottom)){
            if(dir==-1) elm.scrollIntoView(true)
            else elm.scrollIntoView(false)
          }
        }
        input.on("keydown",function(e){
            if(e.which==38){
                //up
                if(optsel>0) {
                    var opt = $(".universal_result")[optsel]
                    $(opt).removeClass("current")
                    optsel--;
                    opt = $(".universal_result")[optsel]
                    $(opt).addClass("current")
                    makeVisible(opt,-1)
                    //if (!checkVisible(opt,combo)) opt.scrollIntoView({behaviour:"smooth",block:"end"})
                }
                e.preventDefault()
                e.stopPropagation()
            } else if (e.which==40) {
                //down
                if(optsel<current.length-1) {
                    var opt = $(".universal_result")[optsel]
                    $(opt).removeClass("current");
                    optsel++;
                    opt = $(".universal_result")[optsel]
                    $(opt).addClass("current")
                    //if (!checkVisible(opt,combo)) opt.scrollIntoView({behaviour:"smooth",block:"start"})
                    makeVisible(opt,1)
                }
                e.preventDefault()
                e.stopPropagation()
            }
        })
        input.on("keyup",function(e){
            if (e.which==13){
                var query = input.val()
                if(!query.startsWith(":")){
                    if (current.length){
                        var doc = current[optsel]
                        App.universal_do(doc)
                    }
                } else {
                    App.universal_cmd(query.substr(1))
                }
            } else {
                var query = input.val()
                if(!query.startsWith(":")){
                    current=ZIndex.suggest(query,{pre:"<b>",post:"</b>"})
                    sel.html(
                        $.templates('<div class="universal_result" onclick="App.universal_do({{:ref}})"><div>{{:highlight}}<span class="label label-default" style="float:right">{{:type}}</span></div><div class="universal_result_">{{:highlight_}}</div></div>').render(current)
                    )
                    if(optsel<current.length) $($(".universal_result")[optsel]).addClass("current")
                    else optsel=-1
                } else {
                    //ignore, it's a command
                }
            }
        })

        $(document).keyup(function(e){
            e = e || window.event;
            if (e.ctrlKey && e.keyCode == 80) {
                //TODO: goto search
                if(App.universal_search){
                    App.universal_hide()
                } else {
                    panel.show()
                    input.focus()
                    App.universal_search=true
                }
            } else if(e.keyCode==27){
                App.universal_hide()
            }
        });
    },
    _update_checker: () => {
        var versions=false
        var patches=false
        var messages=false
        var updated={}
        ZNotify.wait("Checking updates...")
        Z.log("Checking for updates...")
        //check versions
        ZTC.command(["package","versions"],{
            stdout:(line)=>{
                try {
                    versions = JSON.parse(line)
                } catch (err){
                    console.log("err reading json:"+err)
                }
            }
        }).then(()=>{
            ZTC.command(["info","--messages"],{
            stdout:(line)=>{
                try {
                    messages = JSON.parse(line)
                } catch (err){
                    console.log("err reading json:"+err)
                }
            }}).then(()=>{

                if (versions.minor_update){
                    ZTC.command(["package","describe",versions.last_patch],{
                    stdout:(line)=>{
                        try {
                            patches = JSON.parse(line)
                        } catch (err){
                            console.log("err reading json:"+err)
                        }
                    }}) .then(()=>{

                        updated = {
                            versions: versions,
                            patches: patches,
                            messages: messages
                        }
                        console.log(updated)
                        ZNotify.done()
                        Bus.dispatch("updates_checked",null,updated)

                    }).catch((err)=>{
                        Z.log("Error while checking for updates 2:"+err)
                        ZNotify.done()
                    })

                } else {
                    updated = {
                        versions: versions,
                        patches: null,
                        messages: messages
                    }
                    ZNotify.done()
                    Bus.dispatch("updates_checked",null,updated)
                }

            }).catch((err)=>{
                Z.log("Error while checking for updates 1:"+err)
                ZNotify.done()
            })

        }).catch((err)=>{
            Z.log("Error while checking for updates 3:"+err)
            ZNotify.done()
        })
        //check messages

    },
    initUpdateChecker: function(){
        App._update_checker()
        setInterval(()=>{
            App._update_checker()
        }, 30*60*1000)
    },
    show_document: function(ev,doc){
        if(!doc) return
        var ed = App.editors.code
        var ss = doc.esession
        ed.setSession(doc.esession)
        ed.resize()
        ed.focus()
        if (doc.toline){
            ed.gotoLine(doc.toline,0)
        }
        ss.clearAnnotations()
        var decs = Store.get_decorations(doc)
        if(!decs) return;
        //clear decorations
        ss.setAnnotations(_.map(decs,(dec,k,l)=>{
            return  {
                row:dec.line-1,
                column:0,
                text:dec.msg,
                type:dec.type
            }
        }))

    },
    change_editor_theme: function(theme){
        ZConf.put("editor_theme",theme)
        App.editors.code.setTheme("ace/theme/"+theme)
        Bus.dispatch("editor_theme_changed")
    },
    set_editor_zoom: function(px){
        ZConf.put("editor_font_size",px)
        App.editors.code.setFontSize(px)
        Bus.dispatch("editor_font_changed",null,px)
    },
    universal_cmd: function(cmd){
        if(cmd=="ztc" || cmd.startsWith("ztc ")){
            Z.log("[info]> "+cmd)
            var args = cmd.split(/\s+/)
            args.shift() //remove ztc
            ZTC.command(args,{raw:true}).then(()=>{Z.log("[info]> command finished")}).catch((err)=>{Z.log("[error]> error executing command")})
        } else {
            Z.log("[info]> unknown command!")
        }
        App.universal_hide()
    },
    universal_do: function(idx){
        var res = isNaN(idx) ? idx:ZIndex.get_ref(idx)
        if (res.type=="proj"){
            ZNotify.wait("Loading project...")
            var prj = new Project(res.obj.path)
            prj.open().then(()=>{
                Store.add_project(prj,true)
                Leftbar.project()
                ZNotify.done()
            }).catch((err)=>{
                ZNotify.done()
            })
        } else if (res.type=="doc"){
            if (res.obj.repo=="community"){
                App.pack_community_doc(res.obj.url)
            } else App.pack_doc(res.obj.fullname,res.obj.repo)
        } else if (res.type=="ex"){
            Dialogs.modal("ExampleModal",res.obj)
        }
        App.universal_hide()
    },
    _open_recent_prj: function(prjpath){
        var p = new Project(prjpath)
        p.open().then(()=>{
            Store.add_project(p,true)
        }).catch((err)=>{
            ZNotify.done(err)
        })
    },
    update_recent_menu: function(){
        var ml = App.recent_submenu.items.length
        var i
        for(i=0;i<ml;i++){
            App.recent_submenu.removeAt(0)
        }
        _.each(ZConf.conf.env.recent_projects,(prj,k,l)=>{
            App.recent_submenu.insert(new nw.MenuItem({label:prj,click:()=>{App._open_recent_prj(prj)}}),k)
        })
        if (App.recent_submenu.items.length==0){
            App.recent_submenu.append(App.empty_label)
        } else if(ZConf.conf.env.recent_projects.length<ml) {
            for(i=ml-1;i>=0;i--) App.recent_submenu.removeAt(i)
        }
    },
    _compile: function(prj,target){
        Store.action("compiling",true)
        return new Promise((resolve,reject)=>{
            Store.save_docs().then(
                ()=>{
                    Store.clear_decorations(prj)
                    ZTC.compile_project(prj,target)
                    .then((data)=>{
                        Store.action("compiling",false)
                        Store.set_decorations(data,prj)
                        if (data.errors.length>0) reject("Errors during compilation")
                        else resolve(data)
                    })
                    .catch((err)=>{
                        Store.action("compiling",false)
                        reject(err)
                    })
                }
            )
        })
    },
    check_actions: ()=>{
        if (Store.actions()){
            ZNotify.alert("Still working on a task, try again when finished","Already doing something","error")
            return false
        }
        return true
    },
    compile_current_project:function(target,endcb,errcb){
        if (!App.check_actions()) return
        var prj = Store.projects.current
        if (!prj) return
        var tgt = target || ZDevices.selected
        if (!tgt || !tgt.target) {
            ZNotify.alert("Select a target device first!","No device selected","error")
            return
        }
        ZNotify.wait("Compiling...")
        App._compile(prj,tgt.target)
            .then((data)=>{
                ZNotify.done()
                if (endcb) endcb()
            })
            .catch((err)=>{
                ZNotify.done(err)
                if (errcb) errcb(err)
            })
    },
    uplink_current_project:function(cb){
        if (!App.check_actions()) return
        var prj = Store.projects.current
        if (!prj) return
        var tgt = ZDevices.selected
        if (!tgt || !tgt.target) {
            ZNotify.alert("Select a target device first!","No device selected","error")
            return
        }
        var console_was_opened = false
        if (tgt.alias in Store.consoles){
            console_was_opened = true
            Store.consoles[tgt.alias].win.close()
        }
        ZNotify.wait("Compiling...")
        App._compile(prj,tgt.target)
            .then((data)=>{
                ZNotify.wait("Uplinking")
                Store.action("uplinking",true)
                ZTC.uplink_project(prj,tgt)
                    .then(()=>{
                        Store.action("uplinking",false)
                        ZNotify.done()
                        if (console_was_opened){
                            App.open_console()
                        }
                        if (cb) cb(true)
                    })
                    .catch((err)=>{
                        Store.action("uplinking",false)
                        ZNotify.done(err)
                        if (cb) cb()
                    })
            })
            .catch((err)=>{
                ZNotify.done(err)
                if (cb) cb()
            })
    },
    open_console: function(){
        var dev = ZDevices.selected
        if (!dev || dev.optkey.startsWith("virt:") || !dev.port){
            ZNotify.alert("Please select a valid device first!","Error","error")
            return
        }
        var consolejs = Z.path.join(ZConf.tempdir,"console.js")
        var cid = dev.alias || dev.uid
        var cw = Store.consoles[cid]
        if(cw){
            cw.win.focus()
        } else {
            //new window!
            if (dev.manual) {
                Z.fs.writeFileSync(consolejs,'var console_alias=false;var console_title="'+dev.name+'@'+dev.port+'";var console_baud=115200;var console_parity=0;var console_stop=0;var console_port="'+dev.port+'";')

            } else {
                Z.fs.writeFileSync(consolejs,'var console_alias="'+(cid)+'";var console_title="'+dev.name+'@'+dev.port+'";var console_baud=115200;var console_parity=0;var console_stop=0;')
            }
            nw.Window.open("console.html",{
                inject_js_start:consolejs,
                new_instance:false
            },(cwin)=>{
                cwin.on("loaded",()=>{
                    cwin.window.except = App.show_exception
                    Store.consoles[cid]={
                        win:cwin,
                        cid:cid,
                        title: dev.name+"@"+dev.port
                    }
                    Bus.dispatch("consoles_change")
                })
                cwin.on("closed",()=>{
                    delete Store.consoles[cid]
                    Bus.dispatch("consoles_change")
                })
            })
        }
    },
    create_custom_vm: function(){
        var dev = ZDevices.selected
        if (!dev){
            ZNotify.alert("Please select a device first!","Error","error")
            return
        }
        if(dev.optkey.startsWith("virt:")){
            ZNotify.alert("Not connected devices cannot be virtualized!","Error","error")
            return
        }
        Dialogs.unmodal("VirtualizeModal")
        ZTC.vmlist(ZDevices.selected.target)
            .then((vms)=>{
                Dialogs.modal("CreateVMModal",{dev:ZDevices.selected,vms:vms})
            })
            .catch((err)=>{
                Z.log("Error retrieving vm list")
            })
    },
    virtualize: function(){

        var dev = ZDevices.selected
        if (!dev){
            ZNotify.alert("Please select a device first!","Error","error")
            return
        }
        if(dev.optkey.startsWith("virt:")){
            ZNotify.alert("Not connected devices cannot be virtualized!","Error","error")
            return
        }
        if(dev.classname!=dev.virtualizable){
            ZNotify.alert("This device is not in virtualizable mode!","Error","error")
            return
        }
        if (!App.check_actions()) return;
        Dialogs.modal("ZButtonModal",{dev:dev})
    },
    device_info: function(){
        Dialogs.modal("DeviceInfoModal",ZDevices.selected)
    },
    device_pinmap: function(){
        Dialogs.modal("DevicePinmapModal",ZDevices.selected)
    },
    open_marker: function(prjpath,file,line){
        var prj = Store.find_project(prjpath)
        if (!prj) {
            ZNotify.alert("Can't find project at "+prjpath,"Error","error")
            return
        }
        if (!Z.fs.existsSync(file)){
            ZNotify.alert("Can't find file at "+file,"Error","error")
            return
        }
        Store.add_document(prj,file,true,line)
    },
    //install community package
    install: function(fullname){
        ZTC.zpm_info(fullname)
            .then((pack)=>{
                Dialogs.modal("InstallModal",pack)
            })
            .catch((err)=>{
                Z.log("No such package:"+err)
            })
    },
    uninstall: function(fullname){
        //TODO
    },
    rating: function(fullname){
        //TODO
    },
    update_all: function(){
        ZTC.zpm_update_all()
            .then((packs)=>{
                var packlist = []
                _.each(packs,(v,k,l)=>{
                    packlist.push({"fullname":k,"version":v})
                })
                Dialogs.modal("UpdateModal",packlist)
            })
            .catch((err)=>{
                Z.log("Can't update all:"+err)
            })
    },
    pack_doc: function(fullname,repo){
        var url = ZConf.docurl+"/latest/"+repo+"/"+fullname+"/docs"
        Store.open_window(url)
    },
    pack_community_doc: function(url){
        url = url.replace("github://","https://github.com/")
        nw.Shell.openExternal(url)
    },
    ed_toggle_comment: function(){
        var doc = Store.docs.current
        if (!doc) return;
        App.editors.code.toggleCommentLines()
    },
    ed_indent_right: function(){
        var doc = Store.docs.current
        if (!doc) return;
        App.editors.code.indent()
    },
    ed_indent_left: function(){
        var doc = Store.docs.current
        if (!doc) return;
        App.editors.code.blockOutdent()
    },
    ed_toggle_invisibles: function(){
        var doc = Store.docs.current
        if (!doc) return;
        App.editors.code.setShowInvisibles(!App.editors.code.getShowInvisibles())
    },
    ed_autopep8: function(){
        var doc = Store.docs.current
        if (!doc || doc.pmode!="python") return;
        var data = JSON.stringify(doc.edoc.getValue())
        var res;
        ZNotify.wait("autopep8...")
        ZTC.command(["linter","pep8",data,"--json"],{
                    stdout: (line)=>{
                        res = JSON.parse(line)
                    }
                }).then(()=>{
                    doc.edoc.setValue(res)
                    ZNotify.done()
                }).catch((err)=>{
                    ZNotify.done()
                })
    },
    ed_toggle_wordwrap: function(){
        var doc = Store.docs.current
        if (!doc) return;
        doc.esession.setUseWrapMode(!doc.esession.getUseWrapMode())
    },
    make_current_project_docs: function(){
        var prj = Store.projects.current
        if(!prj) return;
        ZNotify.wait("Building docs..")
        ZTC.command(["project","make_doc",prj.path],{
                stdout: (line)=>{
                    Z.log("[docs]> "+line)
                },
                stderr: (line)=>{
                    Z.log("[docs]> "+line)
                }

            })
            .then(()=>{
                ZNotify.done()
            })
            .catch((err)=>{
                ZNotify.done("Error")
            })
    },
    view_current_project_docs: function(){
        var prj = Store.projects.current
        if(!prj) return;
        var cr = require("crypto")
        var prjdir = cr.createHash("md5").update("docs"+prj.path).digest("hex")
        var htmldir = Z.path.join(ZConf.tempdir,prjdir,"html")
        var index = Z.path.join(htmldir,"index.html")
        if (Z.fs.existsSync(index)){
            Store.open_window("file://"+index)
        } else {
            Z.log("Can't find docs for project "+prj.path+". Build it and try again!")
        }
    },
    show_profile: function(){
            ZTC.get_profile()
                .then((profile)=>{
                    Store.set_profile(profile)
                    Dialogs.modal("ProfileModal",Store.profile)
                })
                .catch((err)=>{
                    Z.log("Error while loading profile! "+err)
                })
    },
    upd_profile: function(){
            ZTC.get_profile()
                .then((profile)=>{
                    Store.set_profile(profile)
                })
                .catch((err)=>{
                    Z.log("Error while loading profile! "+err)
                })
    },
    handle_submenus: function(){
        App.update_recent_menu()

        //Mac Os menu has native menu before zerynth menu...
        var offset = (process.platform.startsWith("darwin")) ? 3:0
        var pmenu = App.menu.items[offset].submenu.items
        var dmenu = App.menu.items[offset+1].submenu.items
        var bmenu = App.menu.items[offset+2].submenu.items
        if(!Store.projects.current){
            $(".zbtn-project").prop("disabled",true);
            _.each(pmenu,(v,k,l)=>{
                if(v) {
                    if (k<4) v.enabled=true;
                    else v.enabled=false
                }
            })
        } else {
            $(".zbtn-project").prop("disabled",false);
            _.each(pmenu,(v,k,l)=>{
                v.enabled=true;
            })
            var gmenu = pmenu[9].submenu.items //git menu
            if(Store.projects.current.info.git_url){
                _.each(gmenu,(v,k,l)=>{
                    v.enabled=true;
                })
                gmenu[0].enabled=false //disable create repository
            } else {
                _.each(gmenu,(v,k,l)=>{
                    v.enabled=false;
                })
                gmenu[0].enabled=true //enable create repository

            }
        }

        //Device
        var dev = ZDevices.selected
        if(dev) {
            if(Store.projects.current) $(".zbtn-project").prop("disabled",false);
            _.each(dmenu,(v,k,l)=>{v.enabled=true})
            _.each(bmenu,(v,k,l)=>{v.enabled=true})
            $(".zbtn-device").prop("disabled",false)
            if (dev.classname!=dev.virtualizable){
                $("#virtualizeButton").prop("disabled",true)
                dmenu[0].enabled=false
            }
            if (!dev.port){
                $("#consoleButton").prop("disabled",true)
                dmenu[3].enabled=false
            }
            // if (!dev.probe){
            //     $("#debugButton").prop("disabled",true)
            //     dmenu[4].enabled=false
            // }
            if(dev.optkey.startsWith("virt:")){
                $("#virtualizeButton").prop("disabled",true)
                $("#consoleButton").prop("disabled",true)
                if(Store.projects.current) $("#uploadButton").prop("disabled",true)
                dmenu[0].enabled=false
                dmenu[3].enabled=false
                bmenu[1].enabled=false
            }
        }
        else {
            $(".zbtn-project").prop("disabled",true);
            $(".zbtn-device").prop("disabled",true)
            _.each(dmenu,(v,k,l)=>{v.enabled=false})
            _.each(bmenu,(v,k,l)=>{v.enabled=false})
        }
    },
    get_exception: function(traceback) {
        traceback = traceback.replace("@", "").replace("[", "").replace("]", "")
        pcoords = traceback.split(":")
        coords = []
        for (var i = 0; i < pcoords.length; i++) {
            var xx = parseInt(pcoords[i], 16)
            if (isNaN(xx)) {
                return null
            }
            coords.push(xx)
        }
        var project = Store.projects.current
        if(!project){
            Z.log("Exceptions can be shown for the currently opened project only!")
            return
        }
        vbo = Z.path.join(ZConf.tempdir,"zstudio.vbo")
        if(!Z.fs.existsSync(vbo)){
            Z.log("Please compile the current project before checking for exceptions!")
            return
        }
        var dinfo = JSON.parse(Z.fs.readFileSync(vbo,{encoding:"utf8"}))
        if (dinfo.project!=project.path){
            Z.log("Please compile the current project before checking for exceptions!")
            return
        }
        var res = []
        for (var j = 0; j < coords.length; j += 2) {
            var xx = coords[j]
            var yy = coords[j + 1]
            if (xx <= 0 && yy <= 0) break
            var cobj = dinfo.repr[xx]
            var bcode = cobj.items
            var pos = 0
            for (var i = 0; i < bcode.length; i++) {
                if (yy <= bcode[i].bpos) {
                    //found! actually it's the previous opcode :P
                    pos = i - 1
                    break
                }
            }
            var line = bcode[pos].pline - 1;
            res.push([cobj.src, cobj.name, line])
        }
        return [dinfo.project,res];
    },
    go_to_exception: function(proj,file,line){
        var prj = Store.find_project(proj)
        if(prj){
            Store.add_document(prj,file,true,line)
        }
    },
    show_exception: function(traceback,excname){
        var res = App.get_exception(traceback)
        if (!res){
            return
        }
        var prj = res[0]
        var trace = res[1]
        App.win.focus()
        if (trace.length>0){
            for(var i=trace.length-1;i>=0;i--){
                if (i==trace.length-1){
                    Z.log('<a class="exception" href="javascript:App.go_to_exception(\''+prj+'\',\''+trace[i][0]+'\','+trace[i][2]+')">'+excname+' at line '+trace[i][2]+" of "+trace[i][1]+"</a>")
                } else {
                    Z.log('<a class="exception2" href="javascript:App.go_to_exception(\''+prj+'\',\''+trace[i][0]+'\','+trace[i][2]+')">raised at line '+trace[i][2]+" of "+trace[i][1]+"</a>")
                }
            }
            Store.add_document(Store.projects.current,trace[trace.length-1][0],true,trace[trace.length-1][2])
        } else {
            Z.log("Error: can't find exception point")
        }
    },
    clean: function(inst){
        if(inst){
            ZTC.command(["clean","--inst",inst]).then(()=>{
                App.update_uninst_menu()
            })

        } else {
            ZTC.command(["clean","--tmp"])
        }

    },
    clean_db: function(){
        var confirm = bootbox.confirm({
            title: "Forget all devices",
            message: "Do you want to forget all your devices?<br>Note: This is related only to devices not virtual machines.",
            buttons: {
                cancel: {
                    label: '<i class="fa fa-times"></i> Cancel'
                },
                confirm: {
                    label: '<i class="fa fa-check"></i> Confirm'
                }
            },
            callback: function (result) {
                if (result==false){
                    confirm.modal("hide")
                } else {
                    ZTC.command(["clean","--db"]).then(()=>{
                        ZDevices.disambiguate()
                    })
                    .catch((err)=>{console.log("Error on forgetting devices:"+err)})
                        }
                }
        });
    },
    update_uninst_menu: function(){
        var ml = App.uninst_submenu.items.length
        var i
        for(i=0;i<ml;i++){
            App.uninst_submenu.removeAt(0)
        }

        var vdirs = Z.dirs(Z.zdir("dist"))
        _.each(vdirs,(v,k,l)=>{
            if (v!=ZConf.vrs) App.uninst_submenu.append(new nw.MenuItem({label:v,click:()=>{App.clean(v)}}))
        })

        if (App.uninst_submenu.items.length==0){
            App.uninst_submenu.append(App.empty_label_uninst)
        }
    },
    mail_support: function(){
        if (!Store.profile) return
        var subject = "Help Request"
        var x = new Date();
        var offset= -x.getTimezoneOffset();
        var timezone = (offset>=0?"+":"-")+parseInt(offset/60)+":"+offset%60;
        var body="%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A"
        +"-----------DEBUG INFORMATION: DO NOT MODIFY-----------%0D%0A%0D%0A"
        +"Account: "+Store.profile.email+"%0D%0A"
        +"Version: "+ZConf.vrs+"%0D%0A"
        +"System:  "+encodeURIComponent(Z.os.platform()+" "+Z.os.release())+"%0D%0A"
        +"Timezone:"+encodeURIComponent(timezone)+"%0D%0A"

        nw.Shell.openExternal("mailto:support@zerynth.com?subject="+subject+"&body="+body);
    },
    toggle_vimode: function(){
        var edit = App.editors.code.getKeyboardHandler();
        // console.log(edit.platform)
        if (edit.platform == "win"){
            App.editors.code.setKeyboardHandler("ace/keyboard/vim");
        }
        else{
            App.editors.code.setKeyboardHandler("ace/keyboard/textinput");
        }
    },
    start_debug: function(){
        if (!ZDevices.selected) return
        if (!ZDevices.selected.probe) {
            Z.log("Only devices supporting JTAG probes can be debugged!")
            return
        }
        if (!Store.projects.current) return

        if (Store.debugging) {
            Store.open_window("http://127.0.0.1:5000/")
            return
        }

        App.uplink_current_project((res)=>{
            if(!res) {
                Z.log("There are project errors, can't start debugging!")
                return
            }
            var infile = Z.path.join(ZConf.tempdir,"zstudio.vbo")
            var started = false
            ZTC.command(["debugger","start",ZDevices.selected.target,ZDevices.selected.probe,"--bytecode",infile],{
                background:true,
                stderr: (line)=>{
                    if (line.includes("Running on http://")){
                        Store.debugging=true
                        started=true
                        Store.open_window("http://127.0.0.1:5000/",{close_callback: ()=>{
                            console.log("CLOSING!")
                            ZTC.command(["debugger","stop"])
                            Store.debugging=false
                        }})
                    } else if(!started) Z.log(line)
                },
                closecb: (ok)=>{
                    if (ok==0) {
                        Z.log("Debugging session closed")
                    } else {
                        Z.log("Debugging session error!")
                    }
                }
            })
            .then(()=>{
                console.log("Debugger started")
            })
            .catch((err)=>{
                console.log(err)
            })
        })

    },
    stop_debug: function(){

    }


}

//start App when ready
$(document).ready(function() {
    App.init()
});

