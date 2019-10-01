

var Dialogs = {

    open_file: function(filter){
        return new Promise(function(resolve,reject){
            var chooser = $("#open_file_hidden_input");
            if (filter) chooser.attr("accept",filter)
            else chooser.removeAttr("accept")
            chooser.unbind('change');
            chooser.change(function(evt) {
                console.log($(this).val());
                // Reset the selected value to empty ('')
                var val = $(this).val()
                $(this).val('');
                resolve(val)
            });
            chooser.trigger('click');  
        })
    },
    open_dir: function(default_dir){
        return new Promise(function(resolve,reject){
            var chooser = $("#open_dir_hidden_input");
            if (default_dir) chooser.attr("nwworkingdir",default_dir);
            chooser.unbind('change');
            chooser.change(function(evt) {
                console.log($(this).val());
                // Reset the selected value to empty ('')
                var val = $(this).val()
                $(this).val('');
                resolve(val)
            });
            chooser.trigger('click');  
        })
    },
    save_dir: function(){
        return new Promise(function(resolve,reject){
            var chooser = $("#save_dir_hidden_input");
            chooser.unbind('change');
            chooser.change(function(evt) {
                console.log($(this).val());
                // Reset the selected value to empty ('')
                var val = $(this).val()
                $(this).val('');
                resolve(val)
            });
            chooser.trigger('click');  
        })
    },
    modal: function(modal_name,data){
        return new Promise(function(resolve,reject){
            data = data || {}
            var mdl = window[modal_name]
            mdl.__fill(data)
            mdl.__show(data)
        })
    },
    unmodal:function(modal_name){
        var mdl = window[modal_name]
        mdl.__hide()
    },
    modal_error: function(modal_name,err){
        var mdl = window[modal_name]
        mdl.__err(err)
    },
    project_new: function(data){
        Dialogs.modal("ProjectNewModal",data)
    },
    project_clone: function(data){
        Dialogs.modal("ProjectCloneModal",data)
    },
    library_publish: function(data){
        Dialogs.modal("LibraryPubModal",data)
    },
    project_publish: function(data){
        Dialogs.modal("ProjectPubModal",data)
    },
    project_open: function(){
        Dialogs.open_dir().then((dir)=>{
            var prj = new Project(dir)
            prj.open().then(()=>{
                Store.add_project(prj,true)
            }).catch((err)=>{
                //ZNotify.done(err)
                ZNotify.alert(err,"Open Project","warning")
            })
        })
    },
    disambiguate: function(devs){
        Dialogs.modal("DeviceDisambiguator",devs)
    }

}
