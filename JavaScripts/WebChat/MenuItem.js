(function($) {
    var timer = null;

    function create(target) {
        var options = $(target).webChatMenuItem("options");
        $(target).addClass("webChatMenuItem");
        $(target).panel(options);
        // 渲染菜单项
        RenderItem(target);

        var body = $(target).panel("body");
        // 绑定事件
        $(body).delegate(".webChat-menuItem-item", "click.webChat.menuItem", function(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            } else {
                //否则，我们需要使用IE的方式来取消事件冒泡 
                window.event.cancelBubble = true;
            }

            var me = this;
            clearTimeout(timer);

            timer = setTimeout(function() { //初始化一个延时
                var oldNode = $(".webChat-menuItem-item-selected", $(body)).data("menutItem_item");
                var node = $(me).data("menutItem_item");

                $(".webChat-menuItem-item-selected", $(body)).removeClass("webChat-menuItem-item-selected")
                $(me).addClass("webChat-menuItem-item-selected");
                options.onClickItem.call(me, node);

                if (!oldNode || oldNode[options.valueField] !== node[options.valueField]) {
                    options.onSelected.call(me, node);
                }
            }, 250);

        });

        // 绑定事件
        $(body).delegate(".webChat-menuItem-item", "dblclick.webChat.menuItem", function(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            } else {
                //否则，我们需要使用IE的方式来取消事件冒泡 
                window.event.cancelBubble = true;
            }
            clearTimeout(timer);
            var node = $.data(this, "menutItem_item");
            options.onDblClickItem.call(this, node);
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                window.event.returnValue == false;
            }
        });

        $(body).delegate(".webChat-menuItem-item-remove", "click.webChat.menuItem", function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                window.event.returnValue == false;
            }

            if (e.stopPropagation) {
                e.stopPropagation();
            } else {
                //否则，我们需要使用IE的方式来取消事件冒泡 
                window.event.cancelBubble = true;
            }
            var item = $(this).parents(".webChat-menuItem-item");
            var node = item.data("menutItem_item");
            if (options.onRemoveItem.call(item, node)) {
                options.data.splice(options.data.indexOf(node), 1);
                item.remove();
            }
        });

        //取消事件绑定
        // $(body).undelegate(".webChat.menuItem");
        // $(target).panel(options);
        // $.parser.parse($(target));
    }

    function RenderItem(target) {
        var options = $(target).webChatMenuItem("options");
        var body = $(target).panel("body");
        body.children().remove();

        if (options.groupField) {
            var accdiv = $("<div>").appendTo(body);
            accdiv.accordion({
                animate: true,
                fit: true
            });

            var data = options.data;
            if (data) {
                var index = 0;
                accdiv.accordion('add', {
                    title: "未分组",
                    content: '',
                    selected: false
                });
                $.each(data, function() {
                    var groupName = this[options.groupField];
                    groupName = groupName || "未分组";

                    index++;
                    var panel = accdiv.accordion('getPanel', groupName);
                    if (!panel) {
                        accdiv.accordion('add', {
                            title: groupName,
                            content: '',
                            selected: false
                        });

                        panel = accdiv.accordion('getPanel', groupName);
                    }
                    var panelBody = panel.panel("body");

                    var menutItem_item = $("<div>").addClass("webChat-menuItem-item").appendTo(panelBody);
                    menutItem_item.data("menutItem_item", this);
                    options.menuView(menutItem_item, index, this);
                });
            }
        } else {
            var data = options.data;
            if (data) {
                var index = 0;
                $.each(data, function() {
                    index++;
                    var menutItem_item = $("<div>").addClass("webChat-menuItem-item").appendTo(body);
                    menutItem_item.data("menutItem_item", this);
                    options.menuView(menutItem_item, index, this);
                });
            }
        }
    }

    $.fn.webChatMenuItem = function(options, param) {
        if (typeof options === "string") {
            if ($.fn.webChatMenuItem.methods[options])
                return $.fn.webChatMenuItem.methods[options](this, param);

            return $.fn.datalist.methods[options](this, param);
        }

        options = options || {};
        return this.each(function() {
            var state = $.data(this, "webChatMenuItem");
            if (state) {
                $.extend(state.options, options);
                RenderItem(this);
            } else {
                $.data(this, "webChatMenuItem", {
                    options: $.extend({}, $.fn.webChatMenuItem.defaults, $.fn.webChatMenuItem.parseOptions(this), options)
                });

                create(this);
            }
        });
    }

    $.fn.webChatMenuItem.parseOptions = function(target) {
        return $.extend({}, $.fn.datalist.parseOptions(target), $.parser.parseOptions(target, ["valueField", "textField", "groupField", "headImage", "historyMessage", { lines: "boolean" }]));
    };

    $.fn.webChatMenuItem.methods = {
        options: function(jq) {
            return $.data(jq[0], "webChatMenuItem").options;
        },
        getSelected: function(jq) {
            return $(".webChat-menuItem-item-selected", jq).data("menutItem_item");
        },
        getSelectedIndex: function(jq) {
            var items = $(".webChat-menuItem-item", jq);
            for (var i = 0; i < items.length; i++) {
                if ($(items[i]).hasClass("webChat-menuItem-item-selected"))
                    return i;
            }
            return -1;
        },
        selectedItem: function(jq, index) {
            var options = jq.webChatMenuItem("options");
            $(".webChat-menuItem-item-selected", jq).removeClass("webChat-menuItem-item-selected");
            $($(".webChat-menuItem-item", jq)[index]).addClass("webChat-menuItem-item-selected");
            var node = $($(".webChat-menuItem-item", jq)[index]).data("menutItem_item");
            options.onSelected.call(jq, node);
        },
        getData: function(jq) {
            return jq.webChatMenuItem("options").data;
        },
        loadData: function(jq, data) {
            jq.webChatMenuItem("options").data = data;
            RenderItem(jq);
        },
        load: function(jq, url, param) {
            var options = jq.webChatMenuItem("options");
            if (options.onBeforLoad && $.isFunction(options.onBeforLoad)) {
                if (!options.onBeforLoad.call(jq))
                    return;
            }

            $.ajax({
                url: url,
                type: "POST",
                data: param,
                success: function(data) {
                    jq.webChatMenuItem("loadData", data);

                    if (options.onAfterLoad && $.isFunction(options.onAfterLoad))
                        options.onAfterLoad.call(jq, data);
                }
            });
        },
        getItem: function(jq, id) {
            var item = undefined;
            $(".webChat-menuItem-item", jq).each(function() {
                var data = $(this).data("menutItem_item");
                if (data && data.id === id) {
                    item = this;
                    return;
                }
            });
            return item;
        },
        getItemData: function(jq, node) {
            return $(node).data("menutItem_item");
        },
        disableBadge: function(jq, id) {
            var item = $(jq).webChatMenuItem("getItem", id);
            $(".webChat-menuItem-item-badge", item).css("display", "none")
        },
        enableBadge: function(jq, id) {
            var item = $(jq).webChatMenuItem("getItem", id);
            $(".webChat-menuItem-item-badge", item).css("display", "block")
        },
        setBadgeValue: function(jq, id, value) {
            var item = $(jq).webChatMenuItem("getItem", id);
            var data = $(jq).webChatMenuItem("getItemData", item);
            data.badgeValue = value;
            $(item).text(value);
        }
    };

    $.fn.webChatMenuItem.defaults = {
        width: 260,
        height: 600,
        removeItemButton: true,
        valueField: "id",
        textField: "text",
        groupField: "group",
        headImage: "image",
        badgeValue: "badgeValue",
        historyMessage: "history",
        menuView: function(target, rowIndex, rowData) {
            var removeButton = (this.removeItemButton ?
                "<div style='grid-row: 1 / 3;grid-column: 3' title='点击删除' class='item webChat-menuItem-item-remove'>X</div>" :
                "");

            var badge = $("<span>")
                .css("grid-row", "1 / 3")
                .css("grid-column", "1")
                .addClass("webChat-menuItem-item-badge")
                .text(rowData[this.badgeValue] || 0);

            if (!rowData[this.badgeValue])
                badge.css("display", "none");

            return $("<div>" +
                    "<div style='grid-row: 1 / 3;grid-column:1;' class='item'>" +
                    (rowData[this.headImage] ? "<img src='" + rowData[this.headImage] + "' />" : "<img style='width:45px;height:45px' src='Css/Images/PNG-0981.png' />") +
                    "</div>" +
                    "<div class='item' style='font-size: large;'>" + rowData[this.textField] + "</div>" +
                    removeButton + badge[0].outerHTML +
                    "<div class='item' style='font-size: xx-small;color:#7f8c8d'>" + rowData[this.historyMessage].message + "</div>" +
                    "</div>")
                .css("display", "grid")
                .css("grid-template-columns", "60px auto")
                .css("grid-template-rows", "30px 15px")
                .css("grid-auto-flow", "row")
                .css("align-items", "center")
                .appendTo(target);
        },
        onClickItem: function(data) {
            console.log("onClickItem");
            console.log(this);
            console.log(data);
        },
        onDblClickItem: function(data) {
            console.log("onDbClickItem");
            console.log(this);
            console.log(data);
        },
        onSelected: function(data) {
            console.log("onSelected");
            console.log(this);
            console.log(data);
        },
        onRemoveItem: function(data) {
            console.log("onRemoveItem");
            console.log(this);
            console.log(data);
            return true;
        }
    };
})(jQuery);