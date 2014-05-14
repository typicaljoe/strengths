		function each(a, f) { for(var i=0, l=a.length; i<l; i++) f(a[i]) };
each('glink a label button fieldset label big blockquote br b center code div em form h1 h2 h3 h4 h5 h6 hr img iframe input i li ol option pre p script select small span strong style sub sup table tbody td textarea tr ul u'.split(' '),
    function(label){
        window[label]=function(){
            var tag=document.createElement(label);
            each(arguments, function(arg){ 
                if(arg.nodeType)                                         tag.appendChild(arg);
                else if(typeof arg=='string' || typeof arg=='number')    tag.innerHTML+=arg;
                else for(var attr in arg){
                        if(attr=='style') {for(var sty in arg[attr]) tag[attr][sty]=arg[attr][sty];}
						else if(attr=='events') {for(var sty in arg[attr]) if (arg[attr][sty] != null) tag[sty]=arg[attr][sty];}
                        else {tag[attr]=arg[attr];}
                };
            });
            return tag;
        };
    });
	
	var removeChildrenFromNode = function (el) {
				el = (TAFFY.isString(el) || TAFFY.isNumber(el)) ? document.getElementById(el) : el;
				if ( el.hasChildNodes() )
					{
    				while ( el.childNodes.length >= 1 )
    				{
        				el.removeChild( el.firstChild );       
    				} 
				}
	}

