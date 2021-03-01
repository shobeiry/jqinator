$.fn.JQinator = $.fn.jqinator = function (options) {
    let settings = $.extend({
        url: window.local.href, // [string] url for loading data
        type: 'GET', // [method] ajax method
        headers: {}, // [object] ajax headers
        page: 1, // [int] page number to load
        searchInput: "#jqinator-search", // [selector] search input
        searchDelay: 800, // [int] milliseconds of search delay
        // paginationText: "show {start} to {end} from {total} item", // [string] pagination information text
        paginationTextContainer: "#paginationTextContainer", // [string] pagination information text showing container
        paginationPerPage: "#perPageSelect", // [selector] pagination per page select
        perPage: 10, // [int] item load per page
        refresh: null, // [string|null] auto refresh rate for example: 1m, 5m, 1h, 1d
        orderColumn: null, // [string] ordering column for server
        orderDirection: "desc", // [desc|asc] ordering direction
        paginationList: [10, 20, 30, 50, 100], // [array] number of per pages
        paginationContainer: null, // [selector] pagination container
        autoRun: true, // [bool] auto start get data on page load complete
        localStorage: false, // [bool] save state in storage for reload after page refresh
        localStorageKey: "jqinator::" + window.location.pathname, // [string] storage prefix
        template: "#template", // [selector|html] template of item
        notFoundTemplate: '#notFoundTemplate', // [selector|html] data is empty show this template
        errorTemplate: '#errorTemplate', // [selector|html] if receive error in get date show this template
        sendDataTemplate: '{page:<page>,search:"<search>",perpage:<perPage>,order:{column:"<orderCoulumn>",direction:"<orderDirection>"}}', // [json] template of sending data to serverside
        receiveDataSelector: 'data',
        receiveDataCountSelector: 'meta.total',
        beforeSendRequest: function () {
        },
        success: function (response) {
        },
        error: function (response) {
        },
        onPageChange: function (page) {
        },
        beforeRenderData: function (data) {
        },
        ifResultIsEmpty: function () {
        },
        ifResultIsNotEmpty: function () {
        }
    }, options);
    let container = $(this), timer = null, pages = 0, total = 0, search = '', storage = {
        get: function (key, default_value) {
            if (typeof window.localStorage[key] === 'undefined') {
                return (default_value ? default_value : "");
            } else {
                return JSON.parse(window.localStorage[key]);
            }
        },
        set: function (key, value) {
            window.localStorage[key] = JSON.stringify(value);
        },
        has: function (key) {
            return typeof window.localStorage[key] !== 'undefined';
        }
    };

    if (storage.has(settings.localStorageKey)) {
        let temp_data = storage.get(settings.localStorageKey, null)
        if (temp_data) {
            settings.page = temp_data.page;
            settings.perPage = temp_data.perPage;
            settings.orderColumn = temp_data.orderColumn;
            settings.orderDirection = temp_data.orderDirection;
            search = temp_data.search;
            $(settings.searchInput).val(search);
        }
    }

    if (settings.autoRun) {
        get();
        if (settings.refresh != null)
            refresh();
    }

    $(document).on('keyup', settings.searchInput, function () {
        let value = $(this).val().trim();
        if (value != search) {
            if (timer != null)
                clearTimeout(timer);
            search = value;
            timer = setTimeout(function () {
                settings.page = 1;
                get();
            }, settings.searchDelay)
        }
    });


    function get() {
        let temp_data = {
            page: settings.page,
            perPage: settings.perPage,
            orderColumn: settings.orderColumn,
            orderDirection: settings.orderDirection,
        };
        storage.set(settings.localStorageKey, temp_data);
        let data = settings.sendDataTemplate;
        $.each(temp_data, function (key, value) {
            let regex = new RegExp('{' + key + '}', "igm");
            data = data.replace(regex, value);
        })
        data = JSON.parse(data);

        $.ajax({
            url: settings.url,
            type: settings.type,
            data: data,
            beforeSend: function () {
                settings.beforeSendRequest();
            },
            success: function (response) {
                settings.success(response);
                container.html('');
                let d = response;
                total = response;
                $.each(settings.receiveDataSelector.split("."), function (index, item) {
                    d = d[item];
                })
                $.each(settings.receiveDataCountSelector.split("."), function (index, item) {
                    total = total[item];
                })
                if (typeof total == 'undefined' || typeof d == 'undefined') {
                    container.html(settings.errorTemplate.getString().replace('{error}', response))
                } else {
                    total = parseInt(total);
                    if (total === 0) {
                        settings.ifResultIsEmpty();
                        container.html(settings.notFoundTemplate.getString());
                        paginate();
                    } else {
                        settings.ifResultIsNotEmpty();
                        pages = Math.ceil(total / settings.perPage);
                        settings.beforeRenderData(d);
                        $.each(d, function (index, item) {
                            let temp = settings.template.getString();
                            $.each(item, function (key, value) {
                                if (typeof value === 'object' && value !== null) {
                                    $.each(value, function (k, v) {
                                        let regex = new RegExp('{' + key + '.' + k + '}', "igm");
                                        temp = temp.replace(regex, v == null ? '-' : v);
                                    })
                                } else {
                                    let regex = new RegExp('{' + key + '}', "igm");
                                    temp = temp.replace(regex, value == null ? '-' : value);
                                }

                            })
                            temp = $(temp);
                            $.each(temp.find('[data-if]'), function () {
                                let self = $(this);
                                let condition = self.attr('data-if');
                                let op = "==";
                                if (condition.includes('==')) {
                                    op = "==";
                                } else if (condition.includes('!=')) {
                                    op = "!="
                                } else if (condition.includes('>')) {
                                    op = ">"
                                } else if (condition.includes('>=')) {
                                    op = ">"
                                } else if (condition.includes('<')) {
                                    op = ">"
                                } else if (condition.includes('<=')) {
                                    op = ">"
                                }
                                condition = condition.split(op);
                                let val = item[condition[0]];
                                let i = condition[1];
                                switch (typeof val) {
                                    case "boolean":
                                        i = (i === 'true');
                                        break;
                                    case "number":
                                    case "bigint":
                                        i = parseInt(i);
                                        break;
                                    case "string":
                                        break;
                                    case "object":
                                        i = JSON.parse(i);
                                        break;
                                    case "Array":
                                        i = i.split(',');
                                }
                                if (op === "==" && val !== i) {
                                    self.remove();
                                } else if (op === "!=" && val === i) {
                                    self.remove();
                                } else if (op === ">" && val < i) {
                                    self.remove();
                                } else if (op === "<" && val > i) {
                                    self.remove();
                                } else if (op === "<=" && val >= i) {
                                    self.remove();
                                } else if (op === ">=" && val <= i) {
                                    self.remove();
                                }
                            })
                            container.append(temp);
                        })
                        paginate();
                        settings.onPageChange(settings.page)
                    }
                }
            },
            error: function (response) {
                settings.error(response);
            }
        })
    }

    $.fn.getString = function () {
        return (typeof this == 'string' && this.charAt(0) !== "#") ? this : $(this).clone()
    }

    /*function getHtmlAsString(selector) {
        return (typeof selector == 'string' && selector.charAt(0) !== "#") ? selector : $(selector).html()
    }*/
    let pc = $(settings.paginationContainer);
    let select = $(settings.paginationPerPage);
    let btn = null;
    if (settings.paginationContainer != null) {
        btn = {
            number: $(pc.find('[btn-number]').clone()).addClass('jginator-page jqinator-btn'),
            first: $(pc.find('[btn-first]').clone()).addClass('jginator-first jqinator-btn'),
            last: $(pc.find('[btn-last]').clone()).addClass('jginator-last jqinator-btn'),
            next: $(pc.find('[btn-next]').clone()).addClass('jginator-next jqinator-btn'),
            prev: $(pc.find('[btn-prev]').clone()).addClass('jginator-prev jqinator-btn'),
        };
    }
    select.addClass('jqinator-per-page-select').find('option').remove();
    $.each(settings.paginationList, function (index, size) {
        select.append('<option value="' + size + '"' + (settings.perPage === size ? ' selected' : '') + '>' + size + '</option>');
    });
    select.change(function () {
        settings.perPage = $(this).val();
        get();
    })

    function paginate() {
        let start = (settings.page - 1) * settings.perPage;
        let end = settings.page * settings.perPage;
        let str = settings.paginationTextContainer.getString();
        str = str.replace('{start}', start + 1 + "")
            .replace('{end}', (end < total ? end : total) + "")
            .replace('{total}', total + "");
        $(settings.paginationTextContainer).html(str);
        if (settings.paginationContainer != null) {
            pc.html('')
            let page = settings.page;

            if (btn.first) {
                let temp = $(btn.first.clone());
                if (page <= 1) {
                    temp.addClass('disabled').prop('disabled', true)
                }
                pc.append(temp)
            }
            if (btn.prev) {
                let temp = $(btn.prev.clone());
                if (page <= 1) {
                    temp.addClass('disabled').prop('disabled', true)
                }
                pc.append(temp)
            }

            if (page > 2) {
                pc.append($(btn.number.clone().replace('{number}', page - 2)).attr('data-page', page - 2));
            }
            if (page > 1) {
                pc.append($(btn.number.clone().replace('{number}', page - 1)).attr('data-page', page - 1));
            }
            pc.append($(btn.number.clone().replace('{number}', page)).addClass('active').attr('data-page', page))
            if (page + 1 <= pages) {
                pc.append($(btn.number.clone().replace('{number}', page + 1)).attr('data-page', page + 1));
            }
            if (page + 2 <= pages) {
                pc.append($(btn.number.clone().replace('{number}', page + 2)).attr('data-page', page + 2));
            }

            if (btn.next) {
                let temp = $(btn.next.clone());
                if (page + 1 > pages) {
                    temp.addClass('disabled').prop('disabled', true)
                }
                pc.append(temp)
            }
            if (btn.last) {
                let temp = $(btn.last.clone());
                if (page + 1 > pages) {
                    temp.addClass('disabled').prop('disabled', true)
                }
                pc.append(temp)
            }


        }
    }

    pc.find('.jqinator-btn').click(function () {
        let self = $(this);
        if (!self.hasClass('disabled') && !self.hasClass('active')) {
            if (self.hasClass('jqinator-first'))
                settings.page = 1;
            else if (self.hasClass('jqinator-prev'))
                settings.page -= 1;
            else if (self.hasClass('jqinator-next'))
                settings.page += 1;
            else if (self.hasClass('jqinator-last'))
                settings.page = pages;
            else
                settings.page = parseInt($(this).attr('data-page'));
            get();
        }
    })

    function refresh() {
        if (settings.refresh == null)
            return;
        let refreshInterval = getTime(settings.refresh);
        setTimeout(function () {
            if (settings.refresh !== false) {
                get();
                refresh();
            }
        }, refreshInterval)
    }

    function getTime(time) {
        let temp = time.split('').pop();
        if (jQuery.inArray(temp, ['s', 'm', 'h', 'd', 'w']))
            time = parseInt(time.replace(temp, ''));
        else
            time = parseInt(time)
        switch (temp) {
            case 's':
                return time * 1000;
            case 'm':
                return time * 60 * 1000;
            case 'h':
                return time * 60 * 60 * 1000;
            case 'd':
                return time * 24 * 60 * 60 * 1000;
            case 'w':
                return time * 7 * 24 * 60 * 60 * 1000;
        }
    }

    return {
        get: function (page) {
            if (page == undefined)
                page = 1;
            settings.page = page;
            get();
        },
        next: function () {
            settings.page++;
            get();
        },
        prev: function () {
            settings.page--;
            get();
        },
        first: function () {
            settings.page = 1;
            get();
        },
        last: function () {
            settings.page = pages;
            get();
        }
    };
}

$.each(".jqinator", function () {
    let self = $(this);
    let options = self.data();
    let template = self.find('template.item')
    if (template.length > 0) {
        options.template = template;
    }
    let notFoundTemplate = self.find('template.notfound')
    if (notFoundTemplate.length > 0) {
        options.notFoundTemplate = notFoundTemplate;
    }
    let errorTemplate = self.find('template.error')
    if (errorTemplate.length > 0) {
        options.errorTemplate = errorTemplate;
    }
    self.jqinator(options);
});