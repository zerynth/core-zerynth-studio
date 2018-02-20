var ZNotify = {
    wait: function(msg){
        msg = msg || ""
        $("#spinner").show()
        $("#spinner_text").html(msg)
    },
    done: function(msg){
        msg = msg || "Ok"
        $("#spinner").hide()
        $("#spinner_text").html(msg)
    },
    modal_error: function(target,msg){
        $("#"+target+"_error").html(msg)
        $("#"+target+"_alert").show()
    },
    alert: function(msg,title,type,sticky){
        var mtype = type || "info"
        $("#modal_alert .modal-title").html(title || mtype)
        $("#modal_alert .alert").hide()
        $("#modal_alert .alert-"+mtype).show()
        $("#modal_alert .alert-"+mtype+" p").html(msg)
        if(sticky) $("#modal_alert_footer").hide();
        else $("#modal_alert_footer").show();
        $("#modal_alert").modal({backdrop:sticky ?("static"):false,keyboard:!sticky})
    },
    unalert: function(){
        $("#modal_alert").modal("hide")
    },
    alert_timeout:function(msg,title,type,timeout){
        ZNotify.alert(msg,title,type)
        setTimeout(()=>{
            $("#modal_alert").modal("hide")
        },timeout)
    }
}