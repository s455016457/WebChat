(function($) {
    console.log($);
    var viewModel = new function() {
        this.value = ko.observable(0);
        this.enable = ko.observable(true);
    };

    function create(target) {
        var options = $(target).webChatBadge("options");
        var badge = $("<span></span>")
            .attr("data-bind", "text:value ,style:{ display:enable()?'':'none'}")
            .css("font-size", "75%")
            .css("padding", ".1em .45em")
            .css("border-radius", "15%")
            .css("position", "relative")
            .css("background-color", options.backgroundColor)
            .css("color", options.textColor);

        $(target).after(badge);
        $(target).addClass("webChatBadge").css("display", "none");

        ko.applyBindings(viewModel, badge[0]);
    }

    $.fn.webChatBadge = function(options, paramers) {
        if (typeof options === "string") {
            return $.fn.webChatBadge.methods[options](this, paramers);
        }

        options = options || {};
        return this.each(function() {
            var state = $(this).data("webChatBadge");
            if (state) {
                $.extend(state.options, options);
            } else {
                options = $.extend({}, $.fn.webChatBadge.defaults, $.fn.webChatMenuItem.parseOptions(this), options);
                $(this).data("webChatBadge", { options: options });
                create(this);
            }
            viewModel.value(options.value);
            viewModel.enable(options.enable);
        });
    }

    $.fn.webChatBadge.parseOptions = function(target) {
        return $.extend({}, $.parser.parseOptions(target, ["enable", "value"]));
    };

    $.fn.webChatBadge.methods = {
        options: function(jq) {
            return $(jq).data("webChatBadge").options;
        },
        desable: function(jq) {
            viewModel.enable(false);
        },
        enable: function(jq) {
            viewModel.enable(true);
        },
        setValue: function(jq, value) {
            var options = $(jq).webChatBadge("options");
            var oldValue = viewModel.value();
            viewModel.value(value);
            if (oldValue != value) {
                options.onValueChange.call(this, oldValue, value);
            }
        },
        getValue: function(jq) {
            return viewModel.value();
        },
        setOrientation: function(jq, value) {
            viewModel.orientation(value);
        },
        badge: function(jq) {
            return $(jq).next("span");
        }
    };

    $.fn.webChatBadge.defaults = {
        value: 0,
        enable: true,
        backgroundColor: "red",
        textColor: "white",
        onValueChange: function(oldValue, newValue) {
            console.debug("onValueChange oldValue:" + oldValue + ";newValue:" + newValue);
        }
    };
})(jQuery);