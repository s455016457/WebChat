(function($) {
    var viewModel = new function() {

    };

    function create(target) {

    }

    $.fn.webChatChatTabls = function(options, params) {
        if (typeof options === "string") {
            var method = $.fn.webChatChatTabls.methods[options];
            if (method)
                return method(this, params);
            return this.tabls(options, params);
        }

        return this.each(function() {
            var state = $(this).data("webChatChatTabls");
            if (state) {
                $.extend(state.options, options);
            } else {
                $.data(this, "webChatChatTabls", {
                    options: $.extend({}, $.fn.webChatChatTabls.defaults, options)
                });

                $(this).addClass("webChatChatTabls");
                create(this);
            }
        });
    }

    $.fn.webChatChatTabls.methods = {};

    $.fn.webChatChatTabls.defaults = {
        viewModel: viewModel
    };

})(jQuery);