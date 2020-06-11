/**
 * 
 * @param {jQuery} $
 * @requires ChatPanelComponent.js
 */

(function($) {

    var viewModel = function(data) {
        var self = this;
        /***************************************************************
         * begin 成员属性
         */
        this.me = {
            userId: data.userId,
            userName: data.userName,
            headImg: data.headImg || "Css/Images/PNG-0985.png"

        };
        this.localChatUsers = [];
        this.selectedTitleButton = ko.observable("");
        this.winTitileButtons = ko.observableArray([]);
        this.chatMessages = ko.observableArray([]);
        this.users = ko.observableArray([]);
        this.chatUsers = ko.observableArray([]);
        this.template = `
        <div class="easyui-layout" data-options="fit:true,border:false">
            <div style="height: 70px;" data-options="region:'north',border:false">
                <div class="chat-window-title">
                    <div class="chat-window-title-left"></div>
                    <div class="chat-window-title-buttons">
                    <div data-bind="foreach:winTitileButtons" class="chat-nav">
                        <span data-bind="class:className ,attr:{title:title,name:name} ,click:selected">
                            <a data-bind="class:icon"></a>
                            <span data-bind="text:badge ,style:{display:badgeDesplay}" class="webChat-nav-button-badge"></span>
                            <div></div>
                        </span>
                    </div>
                    </div>
                    <div class="chat-window-title-right">
                        <a class="btn icon-btn-max" name="max" title="最大化"></a>
                        <a class="btn icon-btn-min" name="min" title="最小化"></a>
                    </div>
                </div>
            </div>

            <div class="chat-window-body" data-bind="foreach:winTitileButtons" data-options="region:'center',border:false">
                <div data-bind="template: { name:$data.name, data: $data } ,attr:{name:name} ,class:panelClassName" >
                </div>
            </div>
        </div>`;

        this.totalBadge = ko.pureComputed(function() {
            var count = 0;
            self.chatMessages().forEach(function(item, index, array) {
                if (item.messageStatus === 1 || item.messageStatus === "Sended")
                    count++;
            });
            return count;
        }, this);

        /***************************************************************
         * end 成员属性
         */


        /***************************************************************
         * begin 成员方法
         */
        /**
         * 创建窗口title按钮
         */
        this.createTitleButtonViewModel = function(data) {
            var method = $.fn.webChat.plugin.winTitileButton[data.panelType];
            if (method) {
                var titleButtonView = method.createViewModel(self, data);
                titleButtonView = titleButtonView || {};
                titleButtonView = $.extend(new function() {
                    this.icon = data.icon;
                    this.name = data.name;
                    this.panelType = data.panelType;
                    this.title = data.title;
                    this.badge = ko.observable(data.badge);
                    this.template = method.template;

                    this.badgeDesplay = ko.pureComputed(function() {
                        return (!this.badge()) ? "none" : "block";
                    }, this);

                    this.className = ko.pureComputed(function() {
                        return "nav-button" +
                            ((this.name === self.selectedTitleButton()) ? " nav-button-selected" : " ");
                    }, this);

                    this.panelClassName = ko.pureComputed(function() {
                        return "chat-window-center-panel" +
                            ((this.name === self.selectedTitleButton()) ? " chat-window-center-panel-selected" : " ");
                    }, this);

                    this.selected = function() {
                        var oldName = self.selectedTitleButton();
                        self.selectedTitleButton(this.name);
                        this.badge(0);
                        if (oldName !== this.name) {
                            $.parser.parse(self.html);
                            self.onTitleButtonsSelectedChange(oldName, this.name);
                        }
                    };

                    this.isSelected = function() {
                        return self.selectedTitleButton() == this.name;
                    }
                }, titleButtonView);

                return titleButtonView;
            } else {
                throw "未知按钮面板类型";
            }
        }

        /**
         * 将js对象转成消息对象
         */
        this.parseMessage = function(data) {
            return new function() {
                this.sendBy = data.sendBy;
                this.sendUserName = data.sendUserName;
                this.messageType = data.messageType; // me or peer
                this.messageStatus = ko.observable(data.messageStatus || "Sending"); // 0 Sending 发送中   -1 SendFailed 发送失败   1 Sended 发送成功  2 Readed 已阅读
                this.messageDateTime = data.messageDateTime;
                this.message = data.message;
                this.receiverUuserId = data.receiverUuserId;
                this.receiverUuserName = data.receiverUuserName;
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
        };

        /**
         * 将js对象转成用户对象
         */
        this.parseUser = function(data) {
            data = data || {};
            return new function() {
                this.userId = data.userId;
                this.userName = data.userName;
                this.group = data.group;
                this.groupName = data.groupName;
                this.headImg = data.headImg;

                this.user = ko.pureComputed(function() {
                    return this.userName || this.userId;
                }, this);

                this.getGroup = ko.pureComputed(function() {
                    return (this.groupName || this.group) || "未分组";
                }, this);

                this.getHeadImg = ko.pureComputed(function() {
                    return this.headImg || 'Css/Images/PNG-0981.png';
                }, this);

                this.toChatUser = function() {
                    return self.parseChatUser({
                        userId: this.userId,
                        userName: this.userName,
                        group: this.group,
                        groupName: this.groupName,
                        headImg: this.headImg
                    });
                };
            };
        };

        /**
         * 将js对象转成聊天对象
         */
        this.parseChatUser = function(data) {
            data = data || {};
            return new function() {
                this.userId = data.userId;
                this.userName = data.userName;
                this.group = data.group;
                this.groupName = data.groupName;
                this.headImg = data.headImg;

                this.badge = ko.pureComputed(function() {
                    var count = 0;
                    self.chatMessages().forEach(function(item, index, array) {
                        if (item.messageStatus === 1 || item.messageStatus === "Sended")
                            count++;
                    });
                    return count;
                }, this);

                this.chatMessages = ko.pureComputed(function() {
                    var me = this;
                    var messages = [];
                    self.chatMessages().forEach(function(item, index, array) {
                        if ((item.sendBy === me.userId && item.messageType === "peer") || (item.receiverUuserId === me.userId && item.messageType === "me"))
                            messages.push(item);
                    });
                    return messages;
                }, this);

                this.displayBadge = ko.pureComputed(function() {
                    return this.badge() > 0 ? 'block' : 'none';
                }, this);
                this.user = ko.pureComputed(function() {
                    return this.userName || this.userId;
                }, this);

                this.messages = ko.pureComputed(function() {
                    var data = [];
                    self.chatMessages().forEach(function(item, index, array) {
                        if (item.sendBy === self.userId)
                            data.push(item);
                    });
                    return data;
                }, this);

                this.getHeadImg = ko.pureComputed(function() {
                    return this.headImg || 'Css/Images/PNG-0981.png';
                }, this);

                this.clearBadge = function() {
                    self.chatMessages().forEach(function(item, index, array) {
                        if (item.messageStatus === 1 || item.messageStatus === "Sended")
                            item.messageStatus = 2;
                    });
                };

                this.onRemoveChatUser = function(data, event) {
                    console.log("删除用户：", data, event);
                    self.chatUsers.remove(data);
                    self.removeLocalChatUser(data.userId);
                    event.preventDefault();
                    event.stopPropagation();
                };

                this.onSendMessage = function(data) {
                    self.addNewMessage(data);
                }
            };
        }

        /**
         * 加载历史聊天信息
         */
        this.loadHistoryChatMessage = function(data) {
            data.reverse();
            data.forEach(function(item) {
                item.messageStatus = item.messageStatus || "Readed";
                self.chatMessages.unshift(me.parseMessage(item));
            });
        }

        /**
         * 添加聊天用户
         * 如果用户存在，则删除聊天用户，然后将聊天用户添加在数组头部
         * 否则创建聊天用户，并将用户添加在数组头部
         */
        this.addChatUser = function(userId) {
            if (!userId) return;
            var chatUser = self.chatUsers().findItem(function(item) {
                return item.userId === userId
            });

            if (chatUser) {
                // 删除原来聊天用户
                self.localChatUsers.splice(self.localChatUsers.indexOf(userId), 1);
                self.chatUsers.remove(chatUser);
            } else {
                //创建聊天用户
                var user = self.users().findItem(function(item) { return item.userId === userId });
                chatUser = self.parseChatUser(user);
            }
            // 将聊天用户放在最上面
            self.localChatUsers.unshift(userId);
            self.chatUsers.unshift(chatUser);
            self.saveLocalChatUsers();
            return chatUser;
        }

        /**
         * 添加一条新消息
         */
        this.addNewMessage = function(data) {
            if (data.messageType === "peer")
                self.addChatUser(data.sendBy);
            else
                self.addChatUser(data.receiverUuserId);
            self.chatMessages.push(self.parseMessage(data));
        };

        /***
         * 删除本地聊天用户
         */
        this.removeLocalChatUser = function(userId) {
            self.localChatUsers.splice(self.localChatUsers.indexOf(userId), 1);
            self.saveLocalChatUsers();
        };
        /**
         * 保存本地聊天用户
         */
        this.saveLocalChatUsers = function() {
            var strUsers = JSON.stringify(self.localChatUsers);
            window.localStorage.setItem("chatUsers", strUsers);
        }

        /***************************************************************
         * end 成员方法
         */


        /***************************************************************
         * begin Event
         */
        /**
         * title 按钮选中更改时触发事件
         *  */
        this.onTitleButtonsSelectedChange = function(oldName, newName) {

        }

        /***************************************************************
         * end Event
         */


        /**
         * 加载本地聊天用户
         */
        function loadLocalChatUsers() {
            var strUsers = window.localStorage.getItem("chatUsers");

            self.localChatUsers = strUsers ? JSON.parse(strUsers) : [];
        }

        /**
         * 初始化
         */
        function init(data) {

            /**
             * observableArray 延时通知
             * 定义更新通知评率不小于200毫秒
             */
            self.chatMessages.extend({ rateLimit: 200 });
            self.users.extend({ rateLimit: 200 });
            self.chatUsers.extend({ rateLimit: 80 });

            /**
             * 加载本地消息用户
             */
            loadLocalChatUsers();
            /**
             * 初始化titleButtons
             */

            data.titleButtons.forEach(function(item, index, array) {
                var titlebutonViewModel = self.createTitleButtonViewModel(item);
                if (!self.selectedTitleButton())
                    titlebutonViewModel.selected();
                self.winTitileButtons.push(titlebutonViewModel);
            });
            /**
             * 初始化消息
             */
            data.chatMessages.forEach(function(item, index, array) {
                self.chatMessages.push(self.parseMessage(item));
            });
            /**
             * 初始化用户
             */
            data.users.forEach(function(item, index, array) {
                self.users.push(self.parseUser(item));
            });
            /**
             * 初始化消息用户
             */
            self.localChatUsers.forEach(function(item, index, array) {
                var user = data.users.findItem(function(user) { return user.userId === item });
                if (user) self.chatUsers.push(self.parseChatUser(user));
            });
        }

        init(data);
    };

    function create(target) {
        var state = $(target).data("webChat");
        var options = state.options;
        $(target).addClass("chat-window-icon-button");
        var div = $("<div>")
            .css("width", "100%")
            .css("height", "100%")
            .css("display", "grid")
            .addClass(options.icon)
            .appendTo($(target));

        var badge = $("<span>")
            .attr("data-bind", "totalBadge")
            .addClass("chat-window-icon-button-badge")
            .appendTo(div);

        state.window = options.viewModel.html = $("<div>").appendTo($("body"));

        $(options.viewModel.template).appendTo(state.window);

        state.window.window(options);

        var winPanel = state.window.window("panel");
        // options.renderWindTitlButtons(winPanel);
        // options.renderWindwoBody($(".chat-window-body", winPanel));

        /**
         * 事件绑定
         */
        $(target).on("click", function(event) {
            state.window.window("open");
            options.badge = 0;
            badge.text(options.badge || "");
        });

        $(".btn[name='max']", ".chat-window-title", winPanel).on("click",
            function() {
                if ($(this).hasClass("icon-btn-max")) {
                    state.window.window("maximize");
                    $(this).removeClass("icon-btn-max");
                    $(this).addClass("icon-btn-reset");
                    $(this).attr("title", "还原");
                } else {
                    state.window.window("restore");
                    $(this).removeClass("icon-btn-reset");
                    $(this).addClass("icon-btn-max");
                    $(this).attr("title", "最大化");
                }
            });

        $(".btn[name='min']", ".chat-window-title", winPanel).on("click", function() {
            state.window.window("close");
        });


        options.viewModel.winTitileButtons().forEach(function(item, index, array) {
            var script = $('<script type="text/html" id="' + item.name + '"></script>');

            $(".chat-window-body", winPanel).before(script);
            script.text(item.template);
            // item.html = $(item.template)
            //     .appendTo(script);
        });

        console.log(winPanel);
        ko.applyBindings(options.viewModel, winPanel[0]);
        $.parser.parse(winPanel);
    }

    $.fn.webChat = function(options, params) {
        if (typeof options === "string") {
            var method = $.fn.webChat.methods[options];
            if (method) {
                return method(this, params);
            } else {
                return $.fn.window.methods[options](this, params);
            }
        }

        options = options || {};
        return this.each(function() {
            var state = $.data(this, "webChat");
            if (state) {
                $.extend(state.options, options);
            } else {
                $(this).data("webChat", {
                    options: $.extend({}, $.fn.webChat.defaults, options, {
                        title: '',
                        border: false,
                        closed: true
                    })
                });

                $(this).addClass("webChat");
                create(this);
            }
        });
    };

    $.fn.webChat.CreateViewModel = function(data) {
        return new viewModel(data);
    };

    $.fn.webChat.plugin = {
        winTitileButton: {
            chatMessage: {
                createViewModel: function(viewModel, data) {
                    return new function() {
                        var self = this;
                        this.chatUsers = viewModel.chatUsers;
                        this.currentUser = ko.observable(undefined);
                        this.showWellComePanel = ko.pureComputed(function() {
                            return self.currentUser() ? false : true;
                        }, this);
                        this.selectedUser = function(userId) {
                            $("#" + userId, ".chat-window-menu[data-bind='foreach:chatUsers']").click();
                        };
                        this.onChatUserSelectChange = function(data, event) {
                            console.log("onChatUserSelectChange", data, event);

                            $(".webChat-menuItem-item-selected", $(event.currentTarget).parent()).removeClass("webChat-menuItem-item-selected");

                            $(event.currentTarget).addClass("webChat-menuItem-item-selected");

                            if (self.currentUser() && self.currentUser().userId === data.userId) return;
                            else
                                self.currentUser({
                                    peer: {
                                        userId: data.userId,
                                        userName: data.userName,
                                        headImg: data.getHeadImg()
                                    },
                                    me: viewModel.me,
                                    chatMessages: data.chatMessages,
                                    onSendMessage: data.onSendMessage,
                                    onClickLoadHistoryChatMessages: data.onClickLoadHistoryChatMessages
                                });
                        };
                    }
                },
                template: `
                <div class="easyui-layout" data-options="fit:true,border:false">
                    <div style="width: 200px;" data-options="region:'west',border:false">
                        <div data-bind="foreach:chatUsers" class="chat-window-menu">
                            <div class="webChat-menuItem-item" data-bind="click:$parent.onChatUserSelectChange,attr:{id:userId}">
                                <div style="display:grid;grid-template-columns:40px auto;grid-template-rows:30px 15px;grid-auto-flow:row;align-items:center">
                                    <div style='grid-row: 1 / 3;grid-column:1;' class='item'>
                                        <img style='width:35px;height:35px'  data-bind="attr:{src:getHeadImg}" />
                                    </div>
                                    <div data-bind="text:user" class='item' style='font-size: initial;'>
                                    </div>
                                    <div data-bind="click:onRemoveChatUser" style='grid-row: 1 / 3;grid-column: 3' title='点击删除' class='item webChat-menuItem-item-remove'>X</div>
                                    <span data-bind="text:badge,style:{display:displayBadge}" style="grid-row:1 / 3;grid-column:1" class="webChat-menuItem-item-badge"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div data-options="region:'center',border:false">
                        <div data-bind="visible:showWellComePanel" style="height:100%;width:100%;float: right;">
                            <div style="display:flex;height:100%;width:100%;align-items: center;justify-content: center;">
                                <div style="font-size: xx-large;font-family: cursive;letter-spacing: 5px;">高效的沟通使工作更简单</div>
                            </div>
                        </div>
                        <div data-bind="with:currentUser" style="height:100%;width:100%">
                            <webchat-chatpanel style="display: block; width: 100%; height: 100%;" params="value: $data"></webchat-chatpanel>
                        </div>
                    </div>
                </div>`
            },
            users: {
                createViewModel: function(viewModel, data) {
                    return new function() {
                        var self = this;
                        this.users = viewModel.users;
                        this.currentUser = ko.observable(undefined);
                        this.showWellComePanel = ko.pureComputed(function() {
                            return this.currentUser() ? false : true;
                        }, this);
                        this.sortUsers = ko.pureComputed(function() {
                            return this.users.sorted(function(left, right) {
                                if (!left.group) return -1;
                                return left.group === right.group ? 0 :
                                    left.group < right.group ? -1 :
                                    1;
                            });
                        }, this);

                        this.getGroups = ko.pureComputed(function() {
                            var lastGroup = undefined;
                            var groups = [];

                            ko.utils.arrayForEach(this.sortUsers(), function(item, index, array) {
                                if (index === 0) {
                                    lastGroup = item.group;
                                    groups.push(self.createGroup(item));
                                }
                                if ((!lastGroup && !item.group) || lastGroup == item.group)
                                    return;

                                lastGroup = item.group;
                                groups.push(self.createGroup(item));
                            });
                            // this.sortUsers().forEach(function(item, index, array) {
                            //     if (index === 0) {
                            //         lastGroup = item.group;
                            //         groups.push(self.createGroup(item));
                            //     }
                            //     if ((!lastGroup && !item.group) || lastGroup == item.group)
                            //         return;

                            //     lastGroup = item.group;
                            //     groups.push(self.createGroup(item));
                            // });
                            return groups;
                        }, this);


                        this.onUserSelectChange = function(data, event) {
                            $(".webChat-menuItem-item-selected", $(event.currentTarget).parent()).removeClass("webChat-menuItem-item-selected");
                            $(event.currentTarget).addClass("webChat-menuItem-item-selected");

                            if (self.currentUser() && self.currentUser().userId === data.userId) return;
                            else
                                self.currentUser({
                                    peer: {
                                        userId: data.userId,
                                        userName: data.userName,
                                        headImg: data.getHeadImg()
                                    },
                                    me: viewModel.me,
                                    onToChatPanel: data.onToChatPanel || function() {}
                                });
                        };

                        this.onClickSendMessage = function(data, event) {
                            viewModel.addChatUser(data.userId);
                            setTimeout(() => {
                                var buttonViewModel = viewModel.winTitileButtons().findItem(function(item) {
                                    return item.panelType === "chatMessage";
                                });

                                buttonViewModel.selected();
                                buttonViewModel.selectedUser(data.userId);

                                $(".webChat-menuItem-item-selected", $(event.currentTarget).parents(".layout-panel-center").prev(".layout-panel-west"))
                                    .removeClass("webChat-menuItem-item-selected");

                                self.currentUser(undefined);
                            }, 80);
                        };

                        this.createGroup = function(data) {
                            return new function() {
                                var me = this;
                                this.group = data.group;
                                this.groupName = data.groupName || (data.group || "未分组");
                                this.isExpansion = ko.observable(false);
                                this.className = ko.pureComputed(function() {
                                    return this.isExpansion() ? "icon-webChat-menu-group-up" : "icon-webChat-menu-group-down";
                                }, this);
                                this.onClickGroup = function(data, event) {
                                    data.isExpansion(!data.isExpansion());
                                    $(event.currentTarget).next().css("display", data.isExpansion() ? '' : 'none');
                                    if (data.isExpansion())
                                        $(event.currentTarget).addClass("chat-window-menu-group-selected");
                                    else
                                        $(event.currentTarget).removeClass("chat-window-menu-group-selected");
                                };
                                this.onSelectedkUserChange = function(data, event) {
                                    console.log(data);
                                    $(".webChat-menuItem-item-selected", $(event.currentTarget).parents(".chat-window-menu")).removeClass("webChat-menuItem-item-selected");

                                    $(event.currentTarget).addClass("webChat-menuItem-item-selected");

                                    if (self.currentUser() && self.currentUser().userId === data.userId) return;
                                    else
                                        self.currentUser(data);
                                    if (self.showWellComePanel())
                                        self.showWellComePanel(false);
                                };

                                this.getGroupUsers = ko.pureComputed(function() {
                                    var users = [];

                                    ko.utils.arrayForEach(self.users(), function(item, index, array) {
                                        if (item.group === me.group || (!item.group && !me.group))
                                            users.push(item);
                                    });
                                    console.log(users);
                                    return users;
                                }, this);
                            };
                        };
                    }
                },
                template: `
                <div class="easyui-layout" data-options="fit:true,border:false">
                    <div style="width: 200px;" data-options="region:'west',border:false">
                        <div data-bind="foreach:getGroups" class="chat-window-menu">
                            <ul>
                                <li>
                                    <div data-bind="click:onClickGroup" class="chat-window-menu-group">
                                        <div style="width:100%; display: flex;padding: 6px 10px;">
                                            <div style="flex-grow:9" data-bind="text:groupName "></div>
                                            <div style="width:15px;height:15px;display:block;" data-bind="class: className"></div>
                                        </div>
                                    </div>
                                    <ul style="display:none" data-bind="foreach:getGroupUsers">
                                        <li >
                                            <div class="webChat-menuItem-item" data-bind="click:$parent.onSelectedkUserChange">
                                                <div style="display:grid;grid-template-columns:40px auto;grid-template-rows:30px 15px;grid-auto-flow:row;align-items:center">
                                                    <div style='grid-row: 1 / 3;grid-column:1;' class='item'>
                                                        <img style='width:35px;height:35px'  data-bind="attr:{src:getHeadImg}" />
                                                    </div>
                                                    <div data-bind="text:user" class='item' style='font-size: initial;'>
                                                    </div>
                                                    <div></div>
                                                    <span></span>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div data-options="region:'center',border:false">
                        <div data-bind="visible:showWellComePanel" style="height:100%;width:100%;float: right;">
                            <div style="display:flex;height:100%;width:100%;align-items: center;justify-content: center;">
                                <div style="font-size: xx-large;font-family: cursive;letter-spacing: 5px;">高效的沟通使工作更简单</div>
                            </div>
                        </div>
                        <div data-bind="with:currentUser" style="height:100%;width:100%;">
                            <div style="display:flex;height:100%;width:100%;align-items: center;justify-content: center;">
                                <div style="display: grid;align-items: center;justify-items: center;">
                                    <img style='width:55px;height:55px' data-bind="attr:{src:getHeadImg}" />
                                    <div data-bind="text:user" style='font-size: large;text-align: center;padding:10px;'></div>
                                    <div data-bind="click:$parent.onClickSendMessage" class="webChat-userPanel-senmessage-button">发送消息</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
            },
            cloudFile: {
                createViewModel: function(viewModel, data) {
                    return new function() {
                        this.FileMenus = ko.observableArray([new function() {
                            this.img = "/Css/Images/clouFile.png";
                            this.id = "clouFile";
                            this.name = "云文件";
                            this.badge = ko.observable(0);
                            this.displayBadge = ko.pureComputed(function() {
                                return this.badge() > 0 ? 'block' : 'none';
                            }, this);
                        }, new function() {
                            this.img = "/Css/Images/historyFile.png";
                            this.id = "history";
                            this.name = "最近浏览";
                            this.badge = ko.observable(0);
                            this.displayBadge = ko.pureComputed(function() {
                                return this.badge() > 0 ? 'block' : 'none';
                            }, this);
                        }]);
                    }
                },
                template: `
                <div class="easyui-layout" data-options="fit:true,border:false">
                    <div style="width: 200px;" data-options="region:'west',border:false">
                    <div data-bind="foreach:FileMenus" class="chat-window-menu">
                        <div class="webChat-menuItem-item" >
                            <div style="display:grid;grid-template-columns:50px auto;grid-template-rows:30px 15px;grid-auto-flow:row;align-items:center">
                                <div style='grid-row: 1 / 3;grid-column:1;' class='item'>
                                    <img style='width:35px;height:35px' data-bind="attr:{src:img}" />
                                </div>
                                <div data-bind="text:name" class='item' style='font-size: large;'>
                                </div>
                                <div></div>
                                <span data-bind="text:badge,style:{display:displayBadge}" style="grid-row:1 / 3;grid-column:1" class="webChat-menuItem-item-badge"></span>
                            </div>
                        </div>
                    </div>
                    </div>
                    <div data-options="region:'center',border:false">
                        待开发
                    </div>
                </div>`
            }
        }
    };

    $.fn.webChat.methods = {
        options: function(jq) {
            return $(jq).data("wetChat").options;
        },
        maxOrRestore: function(jq) {
            $(".btn[name='max']", $(".chat-window-title"), $(jq).data("wetChat").window).click();
        },
        min: function(jq) {
            $(".btn[name='min']", $(".chat-window-title"), $(jq).data("wetChat").window).click();
        },
        window: function(jq) {
            return $(jq).data(wetChat).window;
        },
        winPanel: function(jq) {
            return $(jq).wetChat("window").window("panel");
        },
    };

    $.fn.webChat.defaults = {
        badge: 10,
        icon: 'icon-webchat',
        title: '',
        border: false,
        width: 800,
        height: 600,
        closed: true,
        titleButtons: [],
        viewModel: new viewModel({
            chatMessages: [],
            users: [],
            titleButtons: [{
                icon: "icon-chat",
                panelType: "chatMessage",
                name: "message",
                title: "信息",
                badge: 10
            }, {
                icon: "icon-user",
                name: "users",
                panelType: "users",
                title: "联系人",
                badge: 20
            }, {
                icon: "icon-cloudFile",
                panelType: "cloudFile",
                name: "cloudFile",
                title: "云文件",
                badge: 31
            }]
        })
    };

})(jQuery);