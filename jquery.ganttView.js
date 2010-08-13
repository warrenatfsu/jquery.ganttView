/*
jQuery.ganttView v.0.8.0
Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
MIT License Applies
*/

/*
Options
-----------------
showWeekends: boolean
data: object
start: date
end: date
cellWidth: number
cellHeight: number
slideWidth: number
behavior: {
	clickable: boolean,
	draggable: boolean,
	resizable: boolean,
	onClick: function,
	onDrag: function,
	onResize: function
}
*/

(function (jQuery) {
    jQuery.fn.ganttView = function (options) {

        var els = this;
        var defaults = {
            showWeekends: true,
            cellWidth: 21,
            cellHeight: 31,
            slideWidth: 400,
            vHeaderWidth: 100,
            behavior: {
            	clickable: true,
            	draggable: true,
            	resizable: true,
            	onClick: null,
            	onDrag: null,
            	onResize: null
            }
        };
        var opts = jQuery.extend(true, defaults, options);
        var months = Chart.getMonths(opts.start, opts.end);

        els.each(function () {

            var container = jQuery(this);
            var div = jQuery("<div>", { "class": "ganttview" });

            Chart.addVtHeader(div, opts.data, opts.cellHeight);

            var slideDiv = jQuery("<div>", {
                "class": "ganttview-slide-container",
                "css": { "width": opts.slideWidth + "px" }
            });

            Chart.addHzHeader(slideDiv, months, opts.cellWidth);
            Chart.addGrid(slideDiv, opts.data, months, opts.cellWidth, opts.showWeekends);
            Chart.addBlockContainers(slideDiv, opts.data);
            Chart.addBlocks(slideDiv, opts.data, opts.cellWidth, opts.start);

            div.append(slideDiv);
            container.append(div);

            var w = jQuery("div.ganttview-vtheader", container).outerWidth() +
				jQuery("div.ganttview-slide-container", container).outerWidth();
            container.css("width", (w + 2) + "px");

            Chart.applyLastClass(container);

            if (opts.behavior.clickable) { Behavior.bindBlockClick(container, opts.behavior.onClick); }
            if (opts.behavior.resizable) { Behavior.bindBlockResize(container, opts.cellWidth, opts.cellHeight, opts.behavior.onResize); }
            if (opts.behavior.draggable) { Behavior.bindBlockDrag(container, opts.cellWidth, opts.start, opts.behavior.onDrag); }
        });
    };

    var Chart = {

        monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
		dayNames: ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"],

        getMonths: function (start, end) {
            start = Date.parse(start); end = Date.parse(end);
            var months = []; months[start.getMonth()] = [start];
            var last = start;
            while (last.compareTo(end) == -1) {
                var next = last.clone().addDays(1);
                if (!months[next.getMonth()]) { months[next.getMonth()] = []; }
                months[next.getMonth()].push(next);
                last = next;
            }
            return months;
        },

        addVtHeader: function (div, data, cellHeight) {
            var headerDiv = jQuery("<div>", { "class": "ganttview-vtheader" });
            for (var i = 0; i < data.length; i++) {
                var itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
                itemDiv.append(jQuery("<div>", {
                    "class": "ganttview-vtheader-item-name",
                    "css": { "height": (data[i].series.length * cellHeight) + "px" }
                }).append(data[i].name));
                var seriesDiv = jQuery("<div>", { "class": "ganttview-vtheader-series" });
                for (var j = 0; j < data[i].series.length; j++) {
                    seriesDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-series-name" })
						.append(data[i].series[j].name));
                }
                itemDiv.append(seriesDiv);
                headerDiv.append(itemDiv);
            }
            div.append(headerDiv);
        },

        addHzHeader: function (div, months, cellWidth) {
            var headerDiv = jQuery("<div>", { "class": "ganttview-hzheader" });
            var monthsDiv = jQuery("<div>", { "class": "ganttview-hzheader-months" });
            var daysDiv = jQuery("<div>", { "class": "ganttview-hzheader-days" });
            var totalW = 0;
            for (var i = 0; i < 12; i++) {
                if (months[i]) {
                    var w = months[i].length * cellWidth;
                    totalW = totalW + w;
                    monthsDiv.append(jQuery("<div>", {
                        "class": "ganttview-hzheader-month",
                        "css": { "width": (w - 1) + "px" }
                    }).append(Chart.monthNames[i]));
                    for (var j = 0; j < months[i].length; j++) {
                        daysDiv.append(jQuery("<div>", { "class": "ganttview-hzheader-day" })
							.append(months[i][j].getDate()));
                    }
                }
            }
            monthsDiv.css("width", totalW + "px");
            daysDiv.css("width", totalW + "px");
            headerDiv.append(monthsDiv).append(daysDiv);
            div.append(headerDiv);
        },

        addGrid: function (div, data, months, cellWidth, showWeekends) {
            var gridDiv = jQuery("<div>", { "class": "ganttview-grid" });
            var rowDiv = jQuery("<div>", { "class": "ganttview-grid-row" });
            for (var i = 0; i < 12; i++) {
                if (months[i]) {
                    for (var j = 0; j < months[i].length; j++) {
                        var cellDiv = jQuery("<div>", { "class": "ganttview-grid-row-cell " });
                        if (DateUtils.isWeekend(months[i][j]) && showWeekends) { cellDiv.addClass("ganttview-weekend"); }
                        rowDiv.append(cellDiv);
                    }
                }
            }
            var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * cellWidth;
            rowDiv.css("width", w + "px");
            gridDiv.css("width", w + "px");
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    gridDiv.append(rowDiv.clone());
                }
            }
            div.append(gridDiv);
        },

        addBlockContainers: function (div, data) {
            var blocksDiv = jQuery("<div>", { "class": "ganttview-blocks" });
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    blocksDiv.append(jQuery("<div>", { "class": "ganttview-block-container" }));
                }
            }
            div.append(blocksDiv);
        },

        addBlocks: function (div, data, cellWidth, start) {
            var rows = jQuery("div.ganttview-blocks div.ganttview-block-container", div);
            var rowIdx = 0;
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    var series = data[i].series[j];
                    var size = DateUtils.daysBetween(series.start, series.end);
                    if (size && size > 0) {
                        if (size > 365) { size = 365; } // Keep blocks from overflowing a year
                        var offset = DateUtils.daysBetween(start, series.start);
                        var blockDiv = jQuery("<div>", {
                            "class": "ganttview-block",
                            "title": series.name + ", " + size + " days",
                            "css": {
                                "width": ((size * cellWidth) - 9) + "px",
                                "margin-left": ((offset * cellWidth) + 3) + "px"
                            }
                        }).data("block-data", {
                            id: data[i].id,
                            itemName: data[i].name,
                            seriesName: series.name,
                            start: Date.parse(series.start),
                            end: Date.parse(series.end),
                            color: series.color
                        });
                        if (data[i].series[j].color) {
                            blockDiv.css("background-color", data[i].series[j].color);
                        }
                        blockDiv.append(jQuery("<div>", { "class": "ganttview-block-text" }).text(size));
                        jQuery(rows[rowIdx]).append(blockDiv);
                    }
                    rowIdx = rowIdx + 1;
                }
            }
        },

        applyLastClass: function (div) {
            jQuery("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", div).addClass("last");
        }

    };

    var Behavior = {
        bindBlockClick: function (div, callback) {
            jQuery("div.ganttview-block", div).live("click", function () {
                if (callback) { callback(jQuery(this).data("block-data")); }
            });
        },
        bindBlockResize: function (div, cellWidth, cellHeight, callback) {
        	jQuery("div.ganttview-block", div).resizable({
        		grid: cellWidth, 
        		maxHeight: cellHeight,
        		stop: function () {
        			var block = jQuery(this);
        			Behavior.updateDatesBasedOnWidth(div, block, cellWidth);
        			// Remove top and left properties to avoid incorrect block positioning,
        			// set position to relative to keep blocks relative to scrollbar when scrolling
        			block.css("top", "").css("left", "").css("position", "relative");
        			if (callback) { callback(block.data("block-data")); }
        		}
        	});
        },
        bindBlockDrag: function (div, cellWidth, startDate, callback) {
        	jQuery("div.ganttview-block", div).draggable({
        		axis: "x", grid: [cellWidth, cellWidth],
        		stop: function () {
        			var block = jQuery(this);
        			Behavior.updateDatesBasedOnOffset(div, block, cellWidth, startDate);
        			Behavior.updateDatesBasedOnWidth(div, block, cellWidth);
        			// The math here is to transfer the relative left property to the margin-left
        			// property which avoids a conflict between dragging and resizing
        			var l = parseInt(block.css("left").replace("px", ""));
        			var m = parseInt(block.css("margin-left").replace("px", ""));
        			block.css("margin-left", (m + l) + "px")
        				.css("top", "").css("left", "").css("position", "relative");
        			if (callback) { callback(block.data("block-data")); }
        		}
        	});
        },
        updateDatesBasedOnOffset: function (div, block, cellWidth, startDate) {
        	var container = jQuery("div.ganttview-slide-container", div);
			var offset = block.offset().left - container.offset().left - 3;
			var days = Math.round(cellWidth / offset);
			block.data("block-data").start = startDate.clone().addDays(days);
        },
        updateDatesBasedOnWidth: function (div, block, cellWidth) {
        	var start = block.data("block-data").start;
			var days = Math.round(block.outerWidth() / cellWidth);
			block.data("block-data").end.addDays(days);
        }
    };

    var ArrayUtils = {
        contains: function (arr, obj) {
            var has = false;
            for (var i = 0; i < arr.length; i++) { if (arr[i] == obj) { has = true; } }
            return has;
        }
    };

    var DateUtils = {
        daysBetween: function (start, end) {
            if (!start || !end) { return 0; }
            start = Date.parse(start); end = Date.parse(end);
            if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
            var count = 0, date = start.clone();
            while (date.compareTo(end) == -1) { count = count + 1; date.addDays(1); }
            return count;
        },
        isWeekend: function (date) {
            return date.getDay() % 6 == 0;
        }
    };

})(jQuery);