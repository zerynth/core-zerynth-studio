var Z = {
    fs: require("fs-extra"),
    os:require("os"),
    path: require("path"),
    async:require("async"),
    logger: null,
    logparent: null,
    osloc: require("os-locale"),
    glob: require("glob"),
    logrows:0,
    init_logger: function(logid,logpid){
        Z.logger = $(logid)
        Z.logparent=$(logpid)
    },
    homedir: function(){
        if (process.env.ZERYNTH_HOME) {
            return process.env.ZERYNTH_HOME
        } else {
            return Z.os.homedir()
        
        }
    },
    shift_until: function(path,matches){
        var pths = path.split(/\\|\//)
        var shifted = []
        while (pths.length){
            if (_.find(matches,(v)=>{return v==pths[0]})) return [pths,shifted]
            shifted.push(pths.shift())
        }
        return [pths,shifted]
    },
    zdir: function(path){
        var plt = (Z.os.platform().startsWith("win")) ? ("windows64"):(   (Z.os.platform().startsWith("linux")) ? ("linux64"):("mac"))
        var zz = (plt=="windows64") ? "zerynth2":".zerynth2"
        if (process.env.ZERYNTH_TESTMODE == 2){
            zz = (plt=="windows64") ? "zerynth2_test":".zerynth2_test"
        } else if (process.env.ZERYNTH_TESTMODE == 1){
            zz = (plt=="windows64") ? "zerynth2_local":".zerynth2_local"
        }
        if (path) return Z.path.join(Z.homedir(),zz,path);
        else return Z.path.join(Z.homedir(),zz);
    },
    log: function(msg){
        //console.log(msg)
        msg = msg.replace(/\s/g,"&nbsp;")
        var re = /\[(.*)\]>(.*)/
        var res = msg.match(re)
        var line = "<div>"
        //Z.logger.append("<div>")
        if (res){
            line+='<span class="log-'+res[1]+'">['+res[1]+']</span>'
            //check for special messages (compiler and uplinker)
            if (res[2].startsWith("*")) {
                //special, keep on
            } else line+=res[2].replace(/%link%(.*)%(.*)%/g,"<a href=\"javascript:nw.Shell.openExternal('$2')\">$1</a>") //append as is with link change
        } else {
            line+=msg
        }
        line+="</div>"
        Z.logger.append(line)
        //Z.logger.append("</div>")
        //scroll to bottom
        Z.logrows+=1;
        if (Z.logrows>1000){
            //console.log(Z.logger)
            $("#logger div").first().remove() //TODO: remove reference to #logger
        }
        Z.logparent.scrollTop(Z.logparent[0].scrollHeight)
        
        // var session = App.editors.logger.getSession()
        // session.insert({
        //     row:session.getLength(),
        //     column:0
        // },msg+"\n")
        // //TODO: increase limit
        
        // if (session.getLength()>100){
        //     session.remove(new Range(0,0,session.getLength()-100+1,0))
        // }
    },
    dirs: function (srcpath) {
        return Z.fs.readdirSync(srcpath).filter(function(file) {
            return Z.fs.statSync(Z.path.join(srcpath, file)).isDirectory();
        })
    },
    files: function (srcpath) {
        return Z.fs.readdirSync(srcpath).filter(function(file) {
            return Z.fs.statSync(Z.path.join(srcpath, file)).isFile();
        })
    },
    walk: function(srcpath,filter){
        var _walk = require('walk')
        var fs = Z.fs
        var pth = Z.path
        return new Promise(function(resolve,reject){
            var tree=[]
            var walker = _walk.walk(srcpath, options = {followLinks: false});
            walker.on("file",function(root,stats,next){
                if (filter) {
                    if(filter(stats)) tree.push(pth.join(root,stats.name))
                } else tree.push(pth.join(root,stats.name))
                next()
            })

            walker.on("directory",function(root,stats,next){
                if (filter) {
                    if(filter(stats)) tree.push(pth.join(root,stats.name))
                } else tree.push(pth.join(root,stats.name))
                next()
            })

            walker.on("end",function(){
                resolve(tree)
            })

            walker.on("errors",function(root,nodeStatsArray,next){
                reject(root)
            })
        })
    }

}
