(function($) {
    function create(target) {
        var state = $(target).data("webChatChatWindow");
        var options = state.options;
        $(target).addClass("chat-window-icon-button");
        var div = $("<div>")
            .css("width", "100%")
            .css("height", "100%")
            .css("display", "grid")
            .addClass(options.icon)
            .appendTo($(target));

        var badge = $("<span>")
            .text(options.badge || "")
            .addClass("chat-window-icon-button-badge")
            .appendTo(div);

        state.window = $("<div>").appendTo($("body"));

        $(options.template).appendTo(state.window);

        state.window.window(options);

        var winPanel = state.window.window("panel");
        options.renderWindTitlButtons(winPanel);
        options.renderWindwoBody($(".chat-window-body", winPanel));

        $.parser.parse(winPanel);

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

        // ko.applyBindings(viewModel, winPanel[0]);
    }

    $.fn.webChatChatWindow = function(options, params) {
        if (typeof options === "string") {
            var method = $.fn.webChatChatWindow.methods[options];
            if (method) {
                return method(this, params);
            } else {
                return $.fn.window.methods[options](this, params);
            }
        }

        options = options || {};
        return this.each(function() {
            var state = $.data(this, "webChatChatWindow");
            if (state) {
                $.extend(state.options, options);
            } else {
                $(this).data("webChatChatWindow", {
                    options: $.extend({}, $.fn.webChatChatWindow.defaults, options, {
                        title: '',
                        border: false,
                        closed: true
                    })
                });

                $(this).addClass("webChatChatWindow");
                create(this);
            }
        });
    };

    $.fn.webChatChatWindow.methods = {
        options: function(jq) {
            return $(jq).data("webChatChatWindow").options;
        },
        maxOrRestore: function(jq) {
            $(".btn[name='max']", $(".chat-window-title"), $(jq).data("webChatChatWindow").window).click();
        },
        min: function(jq) {
            $(".btn[name='min']", $(".chat-window-title"), $(jq).data("webChatChatWindow").window).click();
        },
        window: function(jq) {
            return $(jq).data(webChatChatWindow).window;
        },
        winPanel: function(jq) {
            return $(jq).webChatChatWindow("window").window("panel");
        },
        setBadge: function(jq, value) {
            var options = $(jq).webChatChatWindow("options");
            options.badge = value;
            $(".chat-window-icon-button-badge", $(jq)).text(options.badge || "");
        }
    };

    $.fn.webChatChatWindow.defaults = {
        badge: 10,
        icon: 'icon-webchat',
        title: '',
        border: false,
        width: 800,
        height: 600,
        closed: true,
        titleButtons: [],
        renderWindTitlButtons: function(target) {
            $(".chat-window-title-buttons", target).webChatChatNav({
                data: this.titleButtons,
                onSelectedChange: function(oldName, newName) {
                    $("div[name='" + oldName + "']", target).removeClass("chat-window-center-panel-selected");
                    $("div[name='" + newName + "']", target).addClass("chat-window-center-panel-selected");
                    var state = $(".easyui-layout", "div[name='" + newName + "']").data();
                    if (!state || !state.layout || !state.layout.options || !state.layout.options.isReSet) {
                        // $.parser.parse($("div[name='" + newName + "']"));
                        // $.parser.parse();

                        $(".easyui-layout", "div[name='" + newName + "']").layout("resize", { width: "100%", height: "100%" });
                        console.log("重新渲染tab:" + newName);
                        state = $(".easyui-layout", "div[name='" + newName + "']").data();
                        state.layout.options.isReSet = true;
                    }
                }
            });
        },
        renderWindwoBody: function(target) {
            for (var index in this.titleButtons) {
                var panel = $(this.bodyTemplate).appendTo(target);
                panel.attr("name", this.titleButtons[index].name);
                if (parseInt(index) === 0) {
                    panel.addClass("chat-window-center-panel-selected");
                }
            }
        },
        template: `
        <div class="easyui-layout" data-options="fit:true,border:false">
            <div style="height: 80px;" data-options="region:'north',border:false">
                <div class="chat-window-title">
                    <div class="chat-window-title-left"></div>
                    <div class="chat-window-title-buttons"></div>
                    <div class="chat-window-title-right">
                        <a class="btn icon-btn-max" name="max" title="最大化"></a>
                        <a class="btn icon-btn-min" name="min" title="最小化"></a>
                    </div>
                </div>
            </div>
            <div class="chat-window-body" data-options="region:'center',border:false">
            </div>
        </div>`,
        bodyTemplate: `
        <div class="chat-window-center-panel">
            <div class="easyui-layout" data-options="fit:true,border:false">
                <div style="width: 200px;" data-options="region:'west',border:false">
                    <div class="chat-window-menu"></div>
                </div>
                <div data-options="region:'center',border:false">
                    这里是面板
                </div>
            </div>
        </div>`
    };
})(jQuery);