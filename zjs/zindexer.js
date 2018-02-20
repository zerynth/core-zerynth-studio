var _zindex;
var ZIndex = {
    _index: [],
    _docs:{},
    init: function(){
        console.log("zindex")
        _zindex = new Fuse([],{
                  shouldSort: true,
                  threshold: 0.6,
                  location: 0,
                  distance: 100,
                  maxPatternLength: 32,
                  include: ["matches","score"],
                  keys: [
                    "type",
                    "name",
                    "body"
                    ]
                })
        Bus.addEventListener("project_new",ZIndex.populate)
        var data = Z.fs.readFile(ZConf.index_file,{encoding:"utf-8"},(err,data)=>{
            if (!err){
                try {
                    _zindex.set(JSON.parse(data))
                } catch(e){
                    console.log("Bad index!")
                }
            } else {
                console.log("Can't load index!")
            }
            ZIndex.populate()
        })
    },
    __get_projects: function(idx,cb){
        Store.fill_allprojects().then(()=>{
            _.each(Store.allprojects.items,(v,k,l)=>{
                idx.push({
                    name:v.path,
                    body:v.title,
                    type:"proj",
                    obj:v,
                    ref:idx.length
                })
            })
            cb()
        })
    },
    __get_packages: function(idx,cb){
        ZTC.zpm_query(null,null,true)
            .then((installed)=>{
                _.each(installed,(v,k,l)=>{
                    idx.push({
                        name:v.repo,
                        body:v.fullname,
                        obj: v,
                        type:"doc",
                        ref:idx.length
                    })
                })
                cb()
            })
            .catch((err)=>{
                cb()
            })
    },
    __get_examples: function(idx,cb){
        var examples
        ZTC.command(["info","--examples"],{
          stdout: (line)=>{
            examples=JSON.parse(line)
          }
        }).then(()=>{
            _.each(examples,(v,k,l)=>{
                idx.push({
                    name:"Example \""+v.name+"\" for "+v.lib,
                    body: v.name,
                    obj:v,
                    type:"ex",
                    ref:idx.length
                })
            })
            cb()
        }).catch((err)=>{
            cb()
        })
    },
    get_ref:function(idx){
        return ZIndex._index[idx]
    },
    populate: function(){
        console.log("populating index...")
        console.log(ZConf.conf.env.workspaces)
        var cbs = [
            ZIndex.__get_projects,
            ZIndex.__get_packages,
            ZIndex.__get_examples,
        ]  
        var index = []

        Z.async.eachSeries(cbs,function(v,cb){
            v(index,cb)
        },()=>{
            ZIndex._index = index
            _zindex.set(ZIndex._index)
        })

        
    },
    save: function(){
        Z.fs.writeFileSync(Zconf.get("index_file"),JSON.stringify(zindex.DocumentStore.toJSON()))
    },
    _last_search: {
        query:null,
        result:null
    },
    suggest: function(src,options){
        var colon = src.indexOf(":")
        var prefix;
        var query;
        if(colon>=0) {
            //split
            prefix = src.substr(0,colon)
            query = src.substr(colon+1)
        } 
        if (!(prefix=="proj" || prefix=="doc" || prefix=="ex")) query=src;

        if (ZIndex._last_search.query==src) return ZIndex._last_search.result;

        ZIndex._last_search.result = _.map(_zindex.search(query),(item)=>{
            if (options && options.pre && options.post){
                var hh = ""
                var hn = ""
                var body = item.item.body
                var name = item.item.name
                var posb = 0
                var posn = 0
                _.each(item.matches,(v,k,l)=>{
                    if(v.key=="body"){
                        _.each(v.indices,(vv,kk,ll)=>{
                            hh += body.slice(posb,vv[0])+options.pre+body.slice(vv[0],vv[1]+1)+options.post
                            posb=vv[1]+1
                        })
                    } else if(v.key=="name"){
                        _.each(v.indices,(vv,kk,ll)=>{
                            hn += name.slice(posn,vv[0])+options.pre+name.slice(vv[0],vv[1]+1)+options.post
                            posn=vv[1]+1
                        })
                    }


                })
                if (posb<body.length){
                    hh+=body.slice(posb)
                }
                if (posn<name.length){
                    hn+=name.slice(posn)
                }

                item.item.highlight = hh
                item.item.highlight_ = hn
            } else {
                item.item.highlight = item.item.body
                item.item.highlight_ = item.item.name
            }
            item.item.score=item.score
            return item.item
        })
        if (prefix=="proj" || prefix=="doc" || prefix=="ex") {
            ZIndex._last_search.result = _.filter(ZIndex._last_search.result,(item)=>{
                return item.type==prefix
            })
        }

        ZIndex._last_search.query = src
        return ZIndex._last_search.result
    }
}
