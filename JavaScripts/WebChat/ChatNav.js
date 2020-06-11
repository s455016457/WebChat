(function($) {
    var viewModel = new function() {
        var self = this;
        this.selectdItem = ko.observable("");
        this.navItems = ko.observableArray([]);

        this.createItem = function(data) {
            return new function() {
                this.icon = data.icon;
                this.name = data.name;
                this.title = data.title;
                this.badge = ko.observable(data.badge);

                this.badgeDesplay = ko.pureComputed(function() {
                    return (!this.badge()) ? "none" : "block";
                }, this);

                this.className = ko.pureComputed(function() {
                    return "nav-button" + ((this.name === self.selectdItem()) ? " nav-button-selected" : " ");
                }, this);

                this.selected = function() {
                    var oldName = self.selectdItem();
                    self.selectdItem(this.name);
                    this.badge(0);
                    if (oldName !== this.name)
                        self.onSelectedChange(oldName, this.name);
                };

                this.isSelected = function() {
                    return self.selectdItem() == this.name;
                }
            }
        };

        this.loadData = function(data) {
            self.navItems.removeAll();
            $(data).each(function(index) {
                var item = self.createItem(this);
                self.navItems.push(item);
                if (index === 0 && !self.selectdItem())
                    item.selected();
            });
        };

        this.addNewItem = function(data) {
            self.navItems.push(self.createItem(data));
        };
        this.getSelectItem = function() {
            var items = self.navItems();

            for (var i = 0; i < items.length; i++) {
                if (items[i].isSelected())
                    return items[i];
            }
        };
        this.getItem = function(name) {
            var items = self.navItems();

            for (var i = 0; i < items.length; i++) {
                if (items[i].name === name)
                    return items[i];
            }
        };

        this.onSelectedChange = function(oldName, newName) {

        }
    }

    function create(target) {
        var options = $(target).data("webChatChatNav").options;
        $(options.template).appendTo($(target));
        ko.applyBindings(viewModel, $(target)[0]);
    }

    $.fn.webChatChatNav = function(options, params) {
        if (typeof options === "string") {
            return $.fn.webChatChatNav.methods[options](this, params);
        }

        this.each(function() {
            var state = $(this).data("webChatChatNav");
            if (state) {
                $.extend(state.options, options);
            } else {
                options = options || {};
                options = $.extend({}, $.fn.webChatChatNav.defaults, options);
                $(this).data("webChatChatNav", { options: options });
                create(this)
            }
            options.data = options.data || [];
            viewModel.loadData(options.data);
            viewModel.onSelectedChange = options.onSelectedChange;
        });
    }

    $.fn.webChatChatNav.methods = {
        options: function(jq) {
            return $(jq).data("webChatChatNav").options;
        },
        loadData: function(jq, data) {
            viewModel.loadData(data);
        },
        getViewModel: function(jq) {
            return viewModel;
        },
        addNewItem: function(jq, data) {
            viewModel.addNewItem(data);
        },
        getSelectedItem: function(jq) {
            return viewModel.getSelectItem();
        },
        setSelectItem: function(jq, itemName) {
            viewModel.selectdItem(itemName);
        },
        getItem: function(jq, name) {
            return viewModel.getItem(name);
        },
        setItemBadge: function(jq, params) {
            var item = viewModel.getItem(params.name);
            if (item) item.badge(params.badge)
        }
    };

    $.fn.webChatChatNav.defaults = {
        template: `
        <div data-bind="foreach:navItems" class="chat-nav">
            <span data-bind="class:className ,attr:{title:title,name:name} ,click:selected">
                <a data-bind="class:icon"></a>
                <span data-bind="text:badge ,style:{display:badgeDesplay}" class="webChat-nav-button-badge"></span>
                <div></div>
            </span>
        </div>`,
        veiModel: viewModel,
        data: {},
        onSelectedChange: function(oldName, newName) {
            // console.log(oldName, newName, this);
        }
    };

})(jQuery);