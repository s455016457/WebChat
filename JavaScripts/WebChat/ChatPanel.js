(function($) {

    var dateFormat = function(date, fmt) {
        var o = {
            "M+": date.getMonth() + 1, //月份
            "d+": date.getDate(), //日
            "h+": date.getHours() % 12 == 0 ? 12 : date.getHours() % 12, //小时
            "H+": date.getHours(), //小时
            "m+": date.getMinutes(), //分
            "s+": date.getSeconds(), //秒
            "q+": Math.floor((date.getMonth() + 3) / 3), //季度
            "S": date.getMilliseconds(), //毫秒
        };
        var week = {
            "1": "一",
            "2": "二",
            "3": "三",
            "4": "四",
            "5": "五",
            "6": "六",
            "7": "天"
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear().toString()).substr(4 - RegExp.$1.length));
        }
        if (/(E+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "星期" : "周") : "") + week[date.getDay().toString()]);
        }

        if (/(sszzz)/.test(fmt)) {
            var seconds = ("00" + date.getSeconds()).substr(date.getSeconds().toString().length);
            var timezone = date.getTimezoneOffset() / 60;
            var strTimezone = ("00" + Math.abs(timezone)).substr(Math.abs(timezone).toString().length) + ":00";
            strTimezone = (timezone < 0 ? "+" : "-") + strTimezone;
            fmt = fmt.replace(RegExp.$1, seconds + strTimezone);
        }

        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                var value = o[k].toString();
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? value : (("00" + value).substr(value.length)));
            }
        }
        return fmt;
    }

    var viewModel = new function() {
        var me = this;

        me.peer = {
            guid: ko.observable(""),
            name: ko.observable("对话对象"),
            headImg: ko.observable("Css/Images/PNG-0981.png")
        };

        me.me = {
            guid: ko.observable(""),
            name: ko.observable(""),
            headImg: ko.observable("Css/Images/PNG-0985.png")
        };

        me.newMessage = ko.observable("");

        me.chatMessage = ko.observableArray([]);

        me.createMessageData = function(data) {
            return new function() {
                this.messageType = data.messageType; // me or peer
                this.messageStatus = ko.observable(data.messageStatus || "Sending"); // 0 Sending 发送中   -1 SendFailed 发送失败   1 Sended 发送成功  2 Readed 已阅读
                this.messageDateTime = data.messageDateTime;
                this.message = data.message;
                this.messageStatusDescr = ko.computed(function() {
                    switch (this.messageStatus()) {
                        case "Sending":
                        case 0:
                            return "发送中";
                        case "SendFailed":
                        case -1:
                            return "发送失败";
                        case "Sended":
                        case 1:
                            return "发送成功";
                        case "Readed":
                        case 2:
                            return "已阅读";
                    }
                }, this);

                this.sended = function() { this.messageStatus("Sended"); };
                this.sendFailed = function() { this.messageStatus("SendFailed"); };
                this.readed = function() { this.messageStatus("Readed"); };

                this.toJson = function() {
                    return {
                        messageType: this.messageType,
                        messageStatus: this.messageStatus(),
                        messageDateTime: this.messageDateTime,
                        message: this.message
                    };
                };
            };
        }

        me.addNewMessage = function(data) {
            data.messageStatus = data.messageStatus || "Sending";
            var value = me.createMessageData(data);
            me.chatMessage.push(value);
            return value;
        }

        me.initChatMessage = function(data) {
            me.chatMessage.removeAll();
            data.forEach(function(item) {
                item.messageStatus = item.messageStatus || "Readed";
                me.chatMessage.push(me.createMessageData(item));
            });
        };

        me.loadHistoryChatMessage = function(data) {
            data.reverse();
            data.forEach(function(item) {
                item.messageStatus = item.messageStatus || "Readed";
                me.chatMessage.unshift(me.createMessageData(item));
            });
        }

        me.sendMessage = function(target, event) {
            var data = {
                messageType: "me",
                messageStatus: 'Sending', // sending 发送中   SendFailed 发送失败 sended 发送成功  readed 已阅读
                messageDateTime: dateFormat(new Date(), "yyyy-MM-dd HH:mm:ss"),
                message: me.newMessage(),
                sendBy: me.me.guid,
                receiveGuid: me.peer.guid
            };

            data = me.addNewMessage(data);
            me.newMessage("");
            $(event.delegateTarget).parents(".easyui-fluid").prev(".textbox-f").textbox('setText', '');

            var chatPanel = $(event.delegateTarget).parents(".webChatChatPanel");
            chatPanel.webChatChatPanel("centerPanelToBottom");
            var options = chatPanel.webChatChatPanel("options");
            options.onSendMessage(data);
        };
    };

    function create(target) {
        var options = $(target).webChatChatPanel("options");
        $(target).addClass("webChatChatPanel");
        $(target).panel(options);

        var panelBody = $(target).panel("body");

        var layout = options.layout = $("<div>")
            .attr("data-options", "border:false,fit:true")
            .addClass("easyui-layout")
            .appendTo(panelBody);

        var north = $("<div>")
            .css("font-size", "large")
            .css("font-family", "cursive")
            .css("padding", "10px")
            .css("height", "65px")
            .attr("data-options", "region:'north',border:false,split:false")
            .appendTo(layout);

        var center = $('<div>')
            .attr("data-options", "region:'center',border:false")
            .appendTo(layout);
        var south = $('<div>')
            .attr("data-options", "region:'south',border:false,split:true")
            .css("height", "80px")
            .appendTo(layout);

        $("<span>").attr("data-bind", "text:peer.name()").appendTo(north);
        $("<hr>").appendTo(north);
        var sendMessageBox = $("<input>")
            .addClass("easyui-textbox")
            .css("padding", "8px")
            .attr("data-options", "multiline:true,buttonText:'发送',buttonIcon:'',fit:true")
            .appendTo(south);

        $.parser.parse(panelBody);

        var centerPanel = layout.layout("panel", "center");

        centerPanel.attr("data-bind", "foreach: chatMessage");

        options.renderMessageBox(centerPanel);

        sendMessageBox.textbox("textbox")
            .css("font-size", "smaller")
            .attr("data-bind", "value:newMessage");
        sendMessageBox.textbox("textbox").next(".textbox-value")
            .attr("data-bind", "value:newMessage");

        sendMessageBox.textbox("button")
            .attr("data-bind", "click: sendMessage");
        ko.applyBindings(viewModel, panelBody[0]);
    }

    $.fn.webChatChatPanel = function(options, param) {
        if (typeof options === "string") {
            if ($.fn.webChatChatPanel.methods[options])
                return $.fn.webChatChatPanel.methods[options](this, param);

            return $.fn.datalist.methods[options](this, param);
        }

        options = options || {};
        return this.each(function() {
            var state = $.data(this, "webChatChatPanel");
            if (state) {
                $.extend(state.options, options);
            } else {
                $.data(this, "webChatChatPanel", {
                    options: $.extend({}, $.fn.webChatChatPanel.defaults, options)
                });

                $(this).addClass("webChatChatPanel");
                create(this);
            }
        });
    };

    $.fn.webChatChatPanel.methods = {
        options: function(jq) {
            return $.data(jq[0], "webChatChatPanel").options;
        },
        initChatMessage: function(jq, data) {
            viewModel.initChatMessage(data);
            return jq;
        },
        centerPanelToTop: function(jq) {
            var options = $(jq).webChatChatPanel("options");
            var centerPanel = options.layout.layout("panel", "center");
            centerPanel[0].scrollTop = 0;
        },
        centerPanelToBottom: function(jq) {
            var options = $(jq).webChatChatPanel("options");
            var centerPanel = options.layout.layout("panel", "center");
            centerPanel[0].scrollTop = centerPanel[0].scrollHeight;
        },
        addNewMessage: function(jq, data) {
            data.messageType = "peer";
            var value = viewModel.addNewMessage(data);
            jq.webChatChatPanel("centerPanelToBottom");
        },
        initChatMessage: function(jq, data) {
            viewModel.initChatMessage(data);
        },
        loadHistoryChatMessage: function(jq, data) {
            viewModel.loadHistoryChatMessage(data);
        },
        getData: function(jq) {
            return JSON.parse(ko.toJson(viewModel.chatMessage()));
        }
    };

    $.fn.webChatChatPanel.defaults = {
        height: 500,
        width: 600,
        renderMessageBox: function(target) {
            var row = $("<div>")
                .css("display", "grid")
                .css("grid-template-columns", "40px auto 40px")
                .css("align-items", " center")
                .attr("data-bind", "style:{ 'justify-items': messageType==='me'?'end':'start','grid-template-columns': messageType==='me'?'auto 40px':'40px auto'}")
                .appendTo(target);

            var headImg = $("<img>")
                .css("width", "40px")
                .css("height", "40px")
                .css("border", "node")
                .attr("data-bind", "style:{ 'display':messageType==='me'?'none':''} ,attr:{ 'src': messageType==='me'?$parent.me.headImg():$parent.peer.headImg()}")
                .appendTo(row);

            var messageBox = $("<div>")
                .css("margin", "5px")
                .css("padding", "4px")
                .css("border", "solid 1px #3498db")
                .css("background-color", "#3498db")
                .css("border-radius", "8px")
                .css("width", "fit-content")
                .appendTo(row);

            var headImg = $("<img>")
                .css("width", "40px")
                .css("height", "40px")
                .css("border", "node")
                .attr("data-bind", "style:{'display':messageType==='me'?'':'none'} ,attr:{ 'src': messageType==='me'?$parent.me.headImg():$parent.peer.headImg()}")
                .appendTo(row);

            $("<span>")
                .attr("data-bind", "text:messageDateTime")
                .css("font-size", "smaller")
                .appendTo(messageBox);
            // $("<span>")
            //     .attr("data-bind", "text:messageType==='me'?'  我：':'  '+($parent.peer.name+':')")
            //     .css("font-size", "smaller")
            //     .appendTo(messageBox);
            $("<pre>")
                .attr("data-bind", "text:message")
                .css("font-size", "smaller")
                .css("margin", "5px 0px")
                .appendTo(messageBox);

            $("<span>")
                .attr("data-bind", "text:messageStatusDescr(),style:{'display':messageType==='me'?'':'none'} ")
                .css("font-size", "smaller")
                .appendTo(messageBox);
        },
        onSendMessage: function(data) {
            // setTimeout(() => {
            //     data.sended();
            // }, 2000);
            // setTimeout(() => {
            //     data.readed();
            // }, 4000);

            // console.log(data.toJson());
        }
    };

})(jQuery);