(function($) {

    var componetuserName = 'webchat-chatpanel'; //不能包含大写
    if (ko.components.isRegistered(componetuserName))
        return;

    ko.components.register(componetuserName, {
        viewModel: {
            createViewModel: function(params, componentInfo) {
                var vm = new viewModel(params);
                var sub = ko.bindingEvent.subscribe(componentInfo.element, "descendantsComplete", function(node) {
                    //在这里添加自定义的后处理逻辑
                    console.log("descendantsComplete", node);

                    $.parser.parse($(node));

                    vm.html = node;
                });

                vm.dispose = function() {
                    sub.dispose();
                }
                return vm;
            }
        },
        template: `
            <div class="easyui-layout" data-options="border:false,fit:true">
                <div data-options="region:'north',border:false,split:false" class="webChat-chatPanel-title">
                    <span data-bind="text:peer.userName"></span>
                    <hr />
                </div>
                <div data-options="region:'center',border:false">
                    <div class="webChat-chatpanel-message-body">
                        <div style="display: inline-flex;justify-content: center;width: 100%;">
                            <a href="javascript:;" data-bind="click:onClickLoadHistoryChatMessages">加载历史消息</a>
                        </div>
                        <div data-bind="foreach:chatMessages">
                            <div class="webChat-chatPanel-messagebox" data-bind="style:{'justify-items': messageType==='me'?'end':'start','grid-template-columns': messageType==='me'?'auto 40px':'40px auto'}">
                                <img class="webChat-chatPanel-messagebox-headimg" data-bind="style:{'display':messageType==='me'?'none':''} ,attr:{'src': messageType==='me'?$parent.me.headImg:$parent.peer.headImg}" />
                                <div class="webChat-chatPanel-messagebox-text">
                                    <span style="font-size:smaller" data-bind="text:messageDateTime"></span>
                                    <pre style="font-size:smaller;margin: 5px 0px;" data-bind="text:message"></pre>
                                    <span style="font-size:smaller" data-bind="text:messageStatusDescr(),style:{'display':messageType==='me'?'':'none'} "></span>
                                </div>
                                <img class="webChat-chatPanel-messagebox-headimg" data-bind="style:{'display':messageType==='peer'?'none':''} ,attr:{'src': messageType==='me'?$parent.me.headImg:$parent.peer.headImg}" />
                            </div>
                        </div>
                    </div>
                </div>
            <div data-options="region:'south',border:false,split:true" style="height:80px;">
                <div class="webchat-chatPanel-sendmessage-textbox" >
                    <textarea data-bind="value:newMessage"></textarea>
                    <a href="javascript:;" data-bind="click: sendMessage">
                        <span>
                            <span>发送</span>
                        </span>
                    </a>
                </div>
            </div>
        </div>
        `
    });
    var viewModel = function(params) {
        var me = this;
        me.peer = {
            userId: params.value.peer.userId,
            userName: params.value.peer.userName,
            headImg: params.value.peer.headImg
        };

        me.me = {
            userId: params.value.me.userId,
            userName: params.value.me.userName,
            headImg: params.value.me.headImg
        };

        me.chatMessages = params.value.chatMessages;

        me.onSendMessage = params.value.onSendMessage;
        me.onClickLoadHistoryChatMessages = params.value.onClickLoadHistoryChatMessages || function() {};

        me.newMessage = ko.observable("");

        me.centerPanelToTop = function() {
            var chatPanelBody = $(".webChat-chatpanel-message-body", $(me.html));
            var center = chatPanelBody.parent();
            center[0].scrollTop = 0;
        };
        me.centerPanelToBottom = function() {
            var chatPanelBody = $(".webChat-chatpanel-message-body", $(me.html));
            var center = chatPanelBody.parent();
            center[0].scrollTop = center[0].scrollHeight;
        };

        me.sendMessage = function(target, event) {
            var data = {
                messageType: "me",
                messageStatus: 'Sending', // sending 发送中   SendFailed 发送失败 sended 发送成功  readed 已阅读
                messageDateTime: Date.now(),
                message: me.newMessage(),
                sendBy: me.me.userId,
                receiverUuserId: me.peer.userId,
                receiverUuserName: me.peer.userName
            };

            me.newMessage("");
            if (me.onSendMessage) {
                me.onSendMessage(data);
            }
        };
    };
})(jQuery);