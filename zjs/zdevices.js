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
    init: function(){
        if (ZDevices.first_time){
            ZDevices.first_time=false
            Bus.addEventListener("package_installed",ZDevices.get_targets,ZDevices)
        }
        ZDevices.get_targets()
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
                        ZDevices.redraw(true)
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
    disambiguate: function(dev){
        ZDevices.done()
        ZDevices.init()
    },
    set_alias: function(dev,no_restart){
        ZTC.command(["device","alias","put",dev.uid,"zs:"+dev.hash,dev.target,"--classname",dev.classname,"--name",dev.name])
            .then(()=>{
                if (!no_restart){
                    ZDevices.done()
                    ZDevices.init()
                }
                
            })
            .catch((err)=>{console.log("Alias not OK:"+err)})
    },
    unset_alias: function(dev){
        ZTC.command(["device","alias","del",dev.alias])
            .then(()=>{
                ZDevices.done()
                ZDevices.init()
            })
            .catch((err)=>{console.log("Alias removal not OK:"+err)})
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
        ZDevices.redraw()
    },
    redraw: function(highlight){
        var picker = $("#device_picker")
        picker.empty()
        picker.prop("disabled",false)
        var hlist = $.templates('<option data-icon="fa fa-usb" value="{{:optkey}}">{{: name || custom_name}}</option>').render(ZDevices.device_list)
        var hambiguous = $.templates('<option data-icon="fa fa-question-circle" value="{{:optkey}}">{{: name || custom_name}}</option>').render(ZDevices.ambiguous_info)
        var hvirtual = $.templates('<option data-icon="fa fa-bullseye" value="{{:optkey}}">{{: name || custom_name}}</option>').render(ZDevices.virtual_list)
        
        if(hlist.length>0) hlist='<optgroup label="Physical Devices">'+hlist+'</optgroup>';
        if(hambiguous.length>0) hambiguous='<optgroup label="Ambiguous Devices">'+hambiguous+'</optgroup>';
        if(hvirtual.length>0) hvirtual='<optgroup label="Virtual Devices">'+hvirtual+'</optgroup>';
        picker.html('<option value="">No device...</option>'+hlist+hambiguous+hvirtual+'<option value="+++">Choose virtual devices...</option>')
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
            } else {
                //selected nothing
                ZDevices.selected = null
            }
            ZDevices.redraw()
        })
        if(highlight) $('[data-id="device_picker"]').effect('highlight', {
            color: '#f4bf75'
        }, 500);
    }
}