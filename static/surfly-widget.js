(function() {

    //var CONTINUATION_POINT = "http://pinacot.com/con.php";
    //var PROXY_POINT = "http://purged.info/start/?url="

    var iframe;

    window.surfly_session_start = function () {
        //var widget = document.getElementById('surflywidget');
        //widget.innerHTML = "Please wait...<img src='http://pinacot.com/ajax-loader.gif' style='float:right'></img>"
        _get_continuation_url(window.location.href, function(continuation_url) {
            iframe = _create_iframe();
            iframe.src = PROXY_POINT+encodeURIComponent(CONTINUATION_POINT+continuation_url);
        });
    };

    function show_iframe() {
        _synchronize_iframe(iframe);
        _display_iframe(iframe);
    }

    function receiveMessage(event) {
        try {
            var obj = JSON.parse(event.data);
            if (! obj.surfly) return;
            var data = obj['surfly'];
            if (data.type == "widget") {
                iframe = document.getElementById('surfly_frame')
                _display_iframe(iframe);
                _synchronize_iframe(iframe);
            } else if (data.type == "formfill") {
                _set_form_elements(data.sourcelist);
            } else if (data.type == "scroll") {
                window.scrollTo(data.xpos, data.ypos)
            }
        } catch (err) {
        };
    }

    function show_widget() {
        window.addEventListener("message", receiveMessage, false);
        if (window.__surfly) {
            window.setTimeout( function() {
                window.__surfly_CF.parent.parent.postMessage(JSON.stringify({'surfly':{ type:'widget'}}), "*");
            }, 3000);
            return;
        }
        var div = document.createElement('div');
        div.innerHTML = "<a id='continuator' href='' style='color: white; text-decoration: none'>start session</a>";
        div.id = "surflywidget";
        div.style.cssText = "padding: 8px; text-align: center; color: white; background: red; position: fixed; bottom: 0px; right: 0px; width: 150px; height: 30px";
        document.body.appendChild(div);
        document.getElementById('continuator').onclick = function() { session_start(); return false;};
    };


    // internal
    function _get_continuation_url(url, cb) {
        var data = {};
        data.client = document.cookie;
        data.url = url;
        (function() {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    var result = JSON.parse(xhr.responseText);
                    cb(result);
                }
            };
            xhr.open("POST", CONTINUATION_POINT, true);
            xhr.send(JSON.stringify(data));
        })();
    };

    function _create_iframe() {
        var iframe = document.createElement('iframe');
        iframe.id = "surfly_frame";
        iframe.setAttribute('width', '100%')
        iframe.setAttribute('height', '100%')
        iframe.setAttribute('marginheight', '0')
        iframe.setAttribute('marginwidth', '0')
        iframe.setAttribute('frameborder', '0')
        iframe.setAttribute('hspace', '0')
        iframe.setAttribute('vspace', '0')
        iframe.style.cssText = "position: fixed; top: 0px; left: 0px; background: pink; display: none; overflow: auto; z-index: 6000";
        document.body.appendChild(iframe);
        return iframe;
    };

    function _display_iframe() {
        iframe.style.display = "block";
    };

    function _synchronize_iframe() {
        var source_list = _get_form_elements();
        var obj = { 'surfly' : { 'type': 'formfill', 'sourcelist': source_list }};
        iframe.contentWindow.frames[0].frames[0].postMessage(JSON.stringify(obj), "*");
        obj = { 'surfly' : { type: 'scroll', 'ypos': window.pageYOffset, 'xpos': window.pageXoffset }};
        iframe.contentWindow.frames[0].frames[0].postMessage(JSON.stringify(obj), "*");
    };

    function _get_form_elements() {
        var target_list = [];
        var forms = document.getElementsByTagName('form');
        for (var i=0, n = forms.length; i<n; i++) {
            var children = forms[i].getElementsByTagName('*');
            for (var j=0, m = children.length; j<m; j++) {
                var child = children[j];
                if ((child.tagName == "OPTION") ||
                   ((child.tagName == "INPUT") && child.type == "radio") ||
                   ((child.tagName == "INPUT") && child.type == "checkbox") ||
                   ((child.tagName == "INPUT") && child.type == "text")) {
                    target_list.push([ child.checked, child.selected, child.disabled, child.value])
                }
            }
        }
        return target_list;
    }


    function _set_form_elements(sourcelist) {
        var target_list = [];
        var c=0;
        var source;
        var forms = document.getElementsByTagName('form');
        for (var i=0, n = forms.length; i<n; i++) {
            var children = forms[i].getElementsByTagName('*');
            for (var j=0, m = children.length; j<m; j++) {
                var child = children[j];
                if ((child.tagName == "OPTION") ||
                   ((child.tagName == "INPUT") && child.type == "radio") ||
                   ((child.tagName == "INPUT") && child.type == "checkbox") ||
                   ((child.tagName == "INPUT") && child.type == "text")) {
                    source = sourcelist[c];
                    child.checked = source[0];
                    child.selected = source[1];
                    child.disabled = source[2];
                    child.value = source[3];
                }
            }
        }
        return target_list;
    }

    //window.addEventListener('load', show_widget);

})();
