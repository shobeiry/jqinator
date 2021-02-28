$.fn.JQinator = $.fn.jqinator = function (options) {
    let settings = $.extend({
        url: window.local.href, // [string] url for loading data
        type: 'GET', // [method] ajax method
        headers: {}, // [object] ajax headers
        page: 1, // [int] page number to load
        searchInput: "#jqinator-search", // [selector] search input
        paginationText: "show {start} to {end} from {total} item", // [string] pagination information text
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
    let container = $(this), timer = null, pages = 1, total = 0, count = 0, search = '', storage = {
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
            success: function (response) {
                settings.success(response);
            },
            error: function (response) {
                settings.error(response);
            }
        })
    }

}