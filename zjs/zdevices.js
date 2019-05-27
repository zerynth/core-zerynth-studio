var ZDevices = {

    _cmd: null,
    items: [],
    reading:false,
    devices: [],
    device_list: [],
    ambiguous_list: [],
    ambiguous_info: [],
    virtual_list: [],
    util_list: [],
    selected: null,
    previously_selected:null,
    first_time: true,
    targets: [],
    mode: "auto",
    init: function(){
        if (ZDevices.first_time){
            ZDevices.first_time=false
            Bus.addEventListener("package_installed",ZDevices.get_targets,ZDevices)
        }
        ZDevices.mode = ZConf.get("device_mode") || "auto"
        ZDevices.get_targets()
        ZDevices.switch_mode(ZDevices.mode) 
    },
    start: function(){
        ZTC.command(
            ["device","discover","--matchdb","--loop"],
            {
                stdout: (data)=>{
                    if(!ZDevices.reading){
                        //start reading
                        ZDevices.items = []
                        ZDevices.reading=true
                    }
                    if (data.length<=1){
                        //end of batch
                        ZDevices.reading=false
                        var devs = ZDevices.items
                        ZDevices.devices=devs
                        ZDevices.fuse()
                        if (ZDevices.mode=="auto") {
                            ZDevices.selected = null
                            var prdev = ZDevices.previously_selected
                            console.log("AFTER FUSE")
                            console.log(prdev)
                            if(prdev) {
                                _.each(ZDevices.device_list,(v,k,l)=>{
                                    if (v.alias==prdev.alias){
                                        ZDevices.selected = v
                                    }
                                })
                            }
                            ZDevices.redraw_auto(true)
                        }
                    } else {
                        ZDevices.items.push(JSON.parse(data))
                    }
                },
                stderr: (data)=>{
                },
                background: true
            }
        ).then((cmd)=>{
            ZDevices._cmd = cmd
        }).catch((err)=>{
            console.log("ERROR"+err)
        })
         
    },
    done: function(){
        try{

            console.log("Killing Device scanner")
            //console.log(ZDevices._cmd)
            if (ZDevices._cmd){
                Store.del_command(ZDevices._cmd)
                ZDevices._cmd.kill()
                ZDevices._cmd=null
            }
        } catch(err){
            console.log("Can't kill device scanner: "+err)
        }
    },
    fuse: function(){
        var f = {}
        var uids = {}
        var list = []
        var ambiguous_list = []
        _.each(ZDevices.devices,function(dev,k,l){
            if (dev.alias){
                //has an alias, add it to unambiguous list
                f[dev.alias] = [dev]
            } else if (!f.hasOwnProperty(dev.uid)){
                f[dev.uid]=[dev]
            } else {
                f[dev.uid].push(dev)
            }
        })
        _.each(f,function(dev,hash,l){
            if (dev.length==1) {
                if (!dev[0].alias){
                    //set zs alias
                    dev[0].alias = "zs:"+dev[0].hash
                    ZDevices.set_alias(dev[0],true)
                }
                var ll = list.length
                list.push(dev[0])
                dev[0].optkey="dev:"+ll
            } else {
                ambiguous_list.push(dev)
            }
        })
        ZDevices.device_list = list
        ZDevices.ambiguous_list = ambiguous_list
        ZDevices.ambiguous_info = _.map(ambiguous_list,(v,k,l)=>{
            var nm = _.reduce(v,(m,val,i)=>{
                return m+val.name+"/"
            },"")
            nm=nm.substring(0,Math.min(nm.length-1,37))+"..."
            return {name:nm, optkey:"amb:"+k}
        })
    },
    get_targets: function(){
        ZDevices.targets={}
        ZTC.command(["info","--devices"],{
            stdout:(line)=>{
                var res = JSON.parse(line)
                ZDevices.targets[res.target]=res
            }
        })
        .catch((err)=>{Z.log("Error loading targets: "+err)})
    },
    get_manual_targets: function(){
        ZDevices.manual_device_list={}
        return ZTC.command(["device","db","list"],{
            stdout:(line)=>{
                var res = JSON.parse(line)
                ZDevices.manual_targets = res
                ZDevices.manual_device_list = _.map(res,(k,v,l)=>{return k})
            }
        })


    },
    disambiguate: function(dev){
        ZDevices.done()
        ZDevices.start()
    },
    set_alias: function(dev,no_restart){
        ZTC.command(["device","alias","put",dev.uid,"zs:"+dev.hash,dev.target,"--classname",dev.classname,"--name",dev.name])
            .then(()=>{
                if (!no_restart){
                    ZDevices.disambiguate()
                }
                
            })
            .catch((err)=>{console.log("Alias not OK:"+err)})
    },
    unset_alias: function(dev){
        ZTC.command(["device","alias","del",dev.alias])
            .then(()=>{
                ZDevices.disambiguate()
            })
            .catch((err)=>{console.log("Alias removal not OK:"+err)})
    },
    erase_flash: function(dev){
        ZTC.command(["device","erase_flash",dev.alias])
            .then(()=>{
                ZDevices.disambiguate()
            })
            .catch((err)=>{console.log("erase flash not OK:"+err)})
    },
    put_mode: function(dev, mode){
        ZTC.command(["device","put_mode",dev.alias,mode])
            .then(()=>{
            })
            .catch((err)=>{console.log("error putting in selected mode:"+err)})
    },
    add_virtual: function(targets){
        ZDevices.virtual_list=[]
        // var toadd= _.filter(targets,(item)=>{
        //     return !_.find(ZDevices.virtual_list,(ii)=>{
        //         return ii.target==item
        //     })
        // })
        _.each(targets,(v,k,l)=>{
            var dev = ZDevices.targets[v]
            dev.optkey = "virt:"+ZDevices.virtual_list.length
            ZDevices.virtual_list.push(dev)
        })
        if (ZDevices.virtual_list.length>0){
            ZDevices.selected = ZDevices.virtual_list[0]
        }
        ZDevices.redraw_auto()
    },
    redraw: function(highlight){
        if (ZDevices.mode=="auto") ZDevices.redraw_auto(highlight)
        else ZDevices.redraw_manual(highlight)
    },
    redraw_auto: function(highlight){
        var picker = $("#device_picker")
        picker.empty()
        picker.prop("disabled",false)
        var hlist = $.templates('<option data-icon="fa fa-usb" value="{{:optkey}}">{{: name || custom_name}}</option>').render(ZDevices.device_list)
        var hambiguous = $.templates('<option data-icon="fa fa-question-circle" value="{{:optkey}}">{{: name || custom_name}}</option>').render(ZDevices.ambiguous_info)
        var hvirtual = $.templates('<option data-icon="fa fa-bullseye" value="{{:optkey}}">{{: name || custom_name}}</option>').render(ZDevices.virtual_list)
        
        if(hlist.length>0) hlist='<optgroup label="Physical Devices">'+hlist+'</optgroup>';
        if(hambiguous.length>0) hambiguous='<optgroup label="Ambiguous Devices">'+hambiguous+'</optgroup>';
        if(hvirtual.length>0) hvirtual='<optgroup label="Virtual Devices">'+hvirtual+'</optgroup>';
        picker.html(
            '<option value="">No device...</option>'
            +hlist
            +hambiguous
            +hvirtual
            +'<option value="+++">Choose virtual devices...</option>'
            +'<option data-divider="true"></option>'
            +'<option data-icon="fa fa-exchange" value="***">Switch to Advanced Mode...</option>')
        picker.unbind("change")
        if (ZDevices.selected){
            picker.selectpicker("val",ZDevices.selected.optkey);
        } else {
            picker.val("");
        }
        Bus.dispatch("device_change",null,ZDevices.selected)
        picker.selectpicker("refresh")
        //picker.selectpicker("render")

        picker.on("change",function(){
            var selected = $('#device_picker option:selected').val();
            if (selected.startsWith("amb:")){
                //selected ambiguous
                var dev = ZDevices.ambiguous_list[parseInt(selected.substring(4))]
                Dialogs.disambiguate(dev)
                picker.val("");
                picker.selectpicker("refresh")
            } else if(selected.startsWith("virt:")){
                //selected virtual
                var dev = ZDevices.virtual_list[parseInt(selected.substring(5))]
                ZDevices.selected = dev
                ZDevices.previously_selected = ZDevices.selected
            } else if(selected.startsWith("dev:")){
                //selected normal
                var dev = ZDevices.device_list[parseInt(selected.substring(4))]
                console.log("NORMAL")
                console.log(dev)
                ZDevices.selected = dev
                ZDevices.previously_selected = ZDevices.selected
            } else if(selected=="+++"){
                //add unconnected device
                Dialogs.modal("DeviceAddModal",{devs:ZDevices.targets,vrt:ZDevices.virtual_list})
            } else if(selected=="***"){
                ZDevices.switch_mode("manual")
            } else {
                //selected nothing
                ZDevices.selected = null
            }
            ZDevices.redraw_auto()
        })
        if(highlight) $('[data-id="device_picker"]').effect('highlight', {
            color: '#f4bf75'
        }, 500);
    },
    redraw_manual: function(highlight){
        var picker = $("#device_manual_picker")
        picker.empty()
        picker.prop("disabled",false)
        console.log("LIST2")
        console.log(ZDevices.manual_device_list)
        var hlist = $.templates('<option data-icon="fa fa-gear" data-subtext="{{:target}}" value="{{:name}}">{{:name}}</option>').render(ZDevices.manual_device_list)
        picker.html(
            '<option value="">No selected device...</option>'
            +hlist
            +'<option data-divider="true"></option>'
            +'<option value="+++">Add/Modify devices...</option>'
            +'<option data-divider="true"></option>'
            +'<option data-icon="fa fa-exchange" value="***">Switch back to Auto Mode...</option>')
        picker.unbind("change")
        if (ZDevices.selected){
            picker.selectpicker("val",ZDevices.selected.name);
        } else {
            picker.val("");
        }
        Bus.dispatch("device_change",null,ZDevices.selected)
        picker.selectpicker("refresh")
        picker.on("change",function(){
            var selected = $('#device_manual_picker option:selected').val();
            if (selected == "***"){
                ZDevices.switch_mode("auto")
            } else if(selected==""){
                //selected nothing
                ZDevices.selected = null
            } else if(selected=="+++"){
                //add devices
                Dialogs.modal("DeviceManageModal",ZDevices.targets)
            } else {
                //selected manual
                var mdev = ZDevices.manual_targets[selected] 
                var dev = _.extend({}, _.find(ZDevices.targets,(item)=>{
                    return item.target==mdev.target
                  })
                )
                dev.manual = true
                dev.chipid = mdev.chipid
                dev.name = mdev.name
                dev.port = mdev.port
                dev.disk = mdev.disk
                dev.probe = mdev.probe
                dev.optkey = mdev.name
                dev.alias = mdev.name
                if (dev.probe || dev.disk || dev.port) dev.virtualizable = dev.classes[0]
                dev.classname = dev.classes[0]
                dev.remote_id = mdev.remote_id

                console.log("MANUAL")
                console.log(dev)
                ZDevices.selected = dev
                ZDevices.previously_selected = ZDevices.selected
            }
            ZDevices.redraw_manual()
        })
        if(highlight) $('[data-id="device_manual_picker"]').effect('highlight', {
            color: '#f4bf75'
        }, 500);
    
    
    },
    invalidate: function(){
        ZDevices.get_manual_targets()
        .then(()=>{
            //ZDevices.selected = null
            ZDevices.redraw_manual(true)
        })
        .catch((err)=>{Z.log("Error loading manual targets: "+err)})
    },
    switch_mode: function(mode) {
        if (mode=="manual") {
                //switch mode
                ZDevices.get_manual_targets()
                    .then(()=>{
                        $("#device_picker").selectpicker('hide')
                        $("#device_manual_picker").selectpicker('show')
                        ZDevices.mode="manual"
                        ZConf.put("device_mode",mode)
                        ZDevices.selected = null
                        ZDevices.redraw_manual(true)
                        Z.log("Switched to advanced mode")
                    })
                    .catch((err)=>{Z.log("Error loading manual targets: "+err)})

        
        } else {
                //switch mode
                Z.log("Switched to auto mode")
                $("#device_manual_picker").selectpicker('hide')
                $("#device_picker").selectpicker('show')
                ZDevices.mode="auto"
                ZConf.put("device_mode",mode)
                ZDevices.selected=null
                ZDevices.disambiguate()
                ZDevices.redraw_auto(true)
        }
    }
}
