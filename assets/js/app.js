var jg = {
dragdrop : {},
sys : {
curDate : null,
loadDate : null,
ajaxID : 1,
scheduleSize : 13
},
config : {
navigateBy : "byday",
firstDayOfWeek : 0
},
markers : {
	check:"fa fa-check-square-o fa-2x check",
	minus:"fa fa-minus-square-o fa-2x minus"
},
data : { 
	channels : TAFFY([{
	"id" : "channel1",
	"title" : "Health",
	"sort" : 0
	}, {
	"id" : "channel2",
	"title" : "Money",
	"sort" : 1
	}, {
	"id" : "channel3",
	"title" : "Faith",
	"sort" : 2
	}]),
	goals : TAFFY([{
	id : "1",
	channel : "channel1",
	title : "Drink Pop",
	type : "daily",
	defaultMark:"thumbs"
	},{
	id : "12",
	channel : "channel1",
	title : "Run a 5K",
	type : "onetime",
	defaultMark:"check"
	}, {
	id : "5",
	channel : "channel1",
	title : "Dr Checkin",
	type : "quarterly",
	defaultMark:"check"
	}, {
	id : "4",
	channel : "channel1",
	title : "Pump it up",
	type : "daily",
	defaultMark:"check"
	}, {
	id : "2",
	channel : "channel2",
	title : "Budget",
	type : "monthly",
	defaultMark:"check"
	}, {
	id : "6",
	channel : "channel3",
	title : "Plan Study2",
	type : "weekly",
	defaultMark:"check"
	}, {
	id : "3",
	channel : "channel3",
	title : "Plan Study",
	type : "weekly",
	defaultMark:"check"
	}, {
	id : "10",
	channel : "channel3",
	title : "Dr Checkin",
	type : "quarterly",
	defaultMark:"check"
	}]),
	marks : TAFFY([])
}, preventSubmit : function(v) {
	return (v.keyCode == 13) ? false : true;
}, init : function() {
	jg.sys.curDate = new Date();
	jg.sys.curDate = jg.subtractDays(jg.sys.curDate, 6);

	jg.renderNav();
	jg.renderWorkArea();

}, getMarker : function (type,func,className) {
	var func = func || jg.removeMarker;
	var className = className || ""
	if (className.length > 0) {
		className = " " + className;
	}
	if (type === "check") {
		return i({
			onclick : func,
			className : "fa fa-check-square-o fa-2x check" + className
		})	
	} else if (type === "minus") {
		return i({
			onclick : func,
			className : "fa fa-minus-square fa-2x minus" + className
		})
	} else if (type === "minus") {
		return i({
			onclick : func,
			className : "fa fa-star-o fa-3x star" + className
		})
	} else if (type === "upthumb") {
		return i({
			onclick : func,
			className : "fa fa-thumbs-o-up fa-2x upthumb" + className
		})
	} else if (type === "downthumb") {
		return i({
			onclick : func,
			className : "fa fa-thumbs-o-down fa-2x downthumb" + className
		})
	} else if (type === "comment") {
		return i({
			onclick : func,
			className : "fa fa-comment-o comment" + className
		})
	}
	
},
addMarker : function(event,type) {
	var type = type || jg.data.goals({id:this.parentNode.id}).first().defaultMark;
	event && event.stopPropagation();
	var newMarker = {
		type : type,
		goal : this.parentNode.id,
		box : this.className.split(" ")[0],
		marker : this.className.split(" ").pop()
	};
	jg.data.marks.insert(newMarker);
	if ($(this).text().length === 1) {
		$(this).text("");
	}
	$(this).append(jg.getMarker(type));
	
}, removeMarker : function(event) {
	jg.data.marks({
		type : this.className.split(" ")[3],
		goal : this.parentNode.parentNode.id,
		box : this.parentNode.className.split(" ")[0]
	}).limit(1).remove();
	$(this).remove();

	event.stopPropagation();
}, addTracker : function() {
	// Track something new : Goal type
	// Tracker type : Plus, Minus, Thumbs, Dollar, Number, Notes :  , ,  fa--comment-o, da-dashboard, ,
	// Name : Suggestion names?
	// For Daily Goals : Turn days on or off
	// What is success: Stop this habbit (will cost you X points), every X days, do it as planned, ... x checks in a day
	var menu = div({
		height : "1px",
		className : "goal-ops"
	});
	var curPostion = 0;
	var next = function() {

		curPostion++;
		form[curPostion].apply(this);
	};
	var back = function() {
		curPostion--;
		form[curPostion].apply(this);
	};
	var newTracker = {
		id : "new",
		channel : this.parentNode.id,
		title : "unknown",
		type : "unknown",
		defaultMark : "unknown"
	};

	var form = [
	function() {

		$(menu).append(h3({
			className : "prompt"
		}, "What do you want to track?"));
		$(menu).append(input({
			type : "text",
			name : "title"
		}));
		$(menu).append(i({
			onclick : next,
			style : {
				cssFloat : "right"
			},
			className : "fa fa-angle-double-right fa-2x next"
		}));
		$(menu).find("td").click(next);
	},
	function() {
		newTracker.title = $(menu).find("input").val();
		$(menu).empty();
		$(menu).append(h3({
			className : "prompt"
		}, "Track something new:"));
		var t = table({
			className : "table"
		}, tr(td({
			className : "type daily"
		}, i({
			className : "fa fa-circle fa-2x"
		})), td({
			className : "type daily"
		}, i({
			className : "fa fa-adjust fa-2x"
		})), td({
			className : "type weekly"
		}, i({
			className : "fa fa-calendar-o fa-2x"
		})), td({
			className : "type monthly"
		}, i({
			className : "fa fa-calendar fa-2x"
		})), td({
			className : "type quarterly"
		}, i({
			className : "fa fa-th-large fa-2x"
		})), td({
			className : "type task"
		}, i({
			className : "fa fa-th-list fa-2x"
		}))), tr(td({
			className : "type daily"
		}, "Every Day"), td({
			className : "type daily"
		}, "Every Few Days"), td({
			className : "type weekly"
		}, "Every Week"), td({
			className : "type monthly"
		}, "Every Month"), td({
			className : "type quarterly"
		}, "Every Quarter"), td({
			className : "type task"
		}, "Just once")));
		$(menu).append(t);
		$(menu).find("td").click(next);
	},
	function() {
		newTracker[this.className.split(" ")[0]] = this.className.split(" ")[1];
		$(menu).find("table").toggle("slow", function() {
			$(menu).empty();
			$(menu).append(h3({
				className : "prompt"
			}, "What type of tracker do you want?"));
			$(menu).append(table({
				className : "table"
			}, tr(td({
				className : "defaultMark check"
			}, i({
				className : "fa fa-check-square-o fa-2x"
			})), td({
				className : "defaultMark minus"
			}, i({
				className : "fa fa-minus-square fa-2x"
			})), td({
				className : "defaultMark thumbs"
			}, i({
				className : "fa fa-thumbs-o-up fa-2x"
			}), i({
				className : "fa fa-thumbs-o-down fa-2x"
			})), td({
				className : "defaultMark number"
			}, i({
				className : "fa fa-table fa-2x"
			})), td({
				className : "defaultMark money"
			}, i({
				className : "fa fa-money fa-2x"
			})), td({
				className : "defaultMark money"
			}, i({
				className : "fa fa-comment-o fa-2x"
			}))), tr(td({
				className : "defaultMark check"
			}, "Check"), td({
				className : "defaultMark minus"
			}, "Minus"), td({
				className : "defaultMark thumbs"
			}, "Thumbs"), td({
				className : "defaultMark number"
			}, "Number"), td({
				className : "defaultMark money"
			}, "Money"), td({
				className : "defaultMark comments"
			}, "Comments"))));
			$(menu).find("td").click(next);

		});

	},
	function() {
		newTracker[this.className.split(" ")[0]] = this.className.split(" ")[1];
		$(menu).find("table").toggle("slow", function() {
			$(menu).empty();
			$(menu).append(h3({
				className : "prompt"
			}, "Summary"));
			console.log(newTracker);
			$(menu).append(i({
				onclick : next,
				style : {
					cssFloat : "right"
				},
				className : "fa fa-angle-double-right fa-2x next"
			}));
		});
	},
	function() {
		jg.data.goals.insert(newTracker);
		$(menu).remove();
		jg.renderWorkArea();
	}];

	$(this.nextSibling).after(menu);

	$(menu).animate({
		height : "180px"
	}, 350, function() {
		$(menu).animate({
			height : "170px"
		}, 75, function() {
			$(menu).animate({
				height : "180px"
			}, 75, function() {
				form[curPostion]()
			})
		})
	});

}, toggleOptions : function() {
	// Clean up any open option boxes
	// open boxes =
	$(this.parentNode.parentNode.parentNode).find(".editbox").addClass("doom").animate({
		height : "1px"
	}, 350, function() {
		$(".doom").remove();
	});
	// already open
	var that = this;
	if ($(this.parentNode).hasClass("active-options")) {
		$(this.parentNode.parentNode.parentNode).find(".active-options").removeClass("active-options");
		$(this.parentNode.parentNode.parentNode).find(".active-toggle").remove();
	} else {
		// Create a new option box
		var commentValue = "";
		var commentID = "";
		jg.data.marks({
			goal : that.parentNode.parentNode.previousSibling.id,
					box : that.parentNode.className.split(" ")[0],
			type : "comment"
		}).each(function(r) {
			commentID = r.___id;
			commentValue = r.comment
		});
		var commentInput = input({
			type : "text",
			name : "comment",
			value : commentValue
		});
		$(commentInput).on("keyup",
			function () {
				if (commentID.length === 0) {
						var newMarker = {
							type : "comment",
							goal : that.parentNode.parentNode.previousSibling.id,
							box : that.parentNode.className.split(" ")[0],
							comment : this.value
						};
						jg.data.marks.insert(newMarker).each(function (r) {commentID = r.___id});
				} else if (this.value.length > 0) {
					jg.data.marks(commentID).update({comment:this.value});
				} else if (this.value.length == 0) {
					jg.data.marks(commentID).remove();
				}
		});
		var addMark = function () {
			jg.addMarker.apply($("." + that.parentNode.parentNode.className.split(" ")[1] + " ." + that.parentNode.className.split(" ")[0]+"").filter(".box").get()[0],[false,this.className.split(" ").reverse()[0]]);
		}
		var markers = div({style:{cssFloat:"right",width:"50%"}},jg.getMarker("check",addMark),jg.getMarker("minus",addMark),jg.getMarker("upthumb",addMark),jg.getMarker("downthumb",addMark));
		$(this.parentNode.parentNode.parentNode).find(".active-options").removeClass("active-options");
		$(this.parentNode).addClass("active-options");
		$(this.parentNode.parentNode.parentNode).find(".active-toggle").remove();
		$(this).removeClass("toggle").attr("class", "fa fa-sort-desc fa-2x active-toggle");
		var menu = tr({
			className : this.parentNode.parentNode.className.split(" ")[1] + " " + this.parentNode.className.split(" ")[0] + " editbox",
			height : "1px"
		}, td(), td({
			style : {
				backgroundColor : "#E8EDE0",
				borderLeft : "thin #DDDDDD solid",
				borderRight : "thin #DDDDDD solid",
				borderBottom : "thin #DDDDDD solid"
			},
			colSpan : jg.config.boxes[this.parentNode.parentNode.className.split(" ")[0]].length
		}, markers, commentInput));
		$(this.parentNode.parentNode).after(menu);
		$(menu).animate({
			height : "70px"
		}, 350, function() {
			$(menu).animate({
				height : "60px"
			}, 75, function() {
				$(menu).animate({
					height : "70px"
				}, 75)
			})
		});

	}
}, renderGoal : function(goal, displayPeriod, appendTo, addHeader) {

	var width = 80 / displayPeriod.length;
	if (addHeader) {
		var headerRow = tr({
			className : "header"
		}, td());

		for (var x = 0; x < displayPeriod.length; x++) {
			if (x == 0) {
				headerRow.appendChild(td({
					style : {
						"width" : width + "%"
					}
				}, i({
					onclick : jg.renderLast,
					style : {
						cssFloat : "left"
					},
					className : "fa fa-angle-double-left fa-2x back"
				}), jg.formatDisplayDate(displayPeriod[x], true)));
			} else if (x == (displayPeriod.length - 1)) {
				headerRow.appendChild(td({
					style : {
						"width" : width + "%"
					}
				}, i({
					onclick : jg.renderNext,
					style : {
						cssFloat : "right"
					},
					className : "fa fa-angle-double-right fa-2x next"
				}), jg.formatDisplayDate(displayPeriod[x], true)));
			} else {
				headerRow.appendChild(td({
					style : {
						"width" : width + "%"
					}
				}, jg.formatDisplayDate(displayPeriod[x], true)));
			}
		}
		$(appendTo).append(headerRow);
	}
	var dailyRow = tr({
		id : goal.id,
		className : goal.type + " id" + goal.id
	}, td({
		className : "title",
		rowSpan : 2
	}, h3(goal.title)));
	for (var x = 0; x < displayPeriod.length; x++) {
		var cell = td({
			className : displayPeriod[x] + " box" + ((goal.defaultMark === "thumbs") ? " thumbshover" : ""),
			style : {
				"width" : width + "%"
			}
		});
		var hasMark = 0;
		jg.data.marks({
			goal : goal.id,
			box : displayPeriod[x]
		}).each(function(r) {
			hasMark = 1;
			$(cell).append(jg.getMarker(r.type));
		})
		if (hasMark === 0) {
			$(cell).append(jg.getNBSP());
		}
		dailyRow.appendChild(cell);
	}
	$(appendTo).append(dailyRow);
	var dailyRow = tr({
		className : goal.type + " id" + goal.id
	});
	for (var x = 0; x < displayPeriod.length; x++) {
		var cell = td({
			className : displayPeriod[x] + " toggle-ops",
			style : {
				"width" : width + "%"
			}
		});
		$(cell).append(jg.getNBSP());
		dailyRow.appendChild(cell);
	}
	$(appendTo).append(dailyRow);
}, renderTask:function (goal, appendTo) {
	$(appendTo).append(tr(td({
		className : "title",
		rowSpan : 2
	}),td(goal.title)));
	}, 
	renderWorkArea : function() {
	jg.config.boxes = {
		daily : jg.generateScheduleDays(jg.sys.curDate, jg.sys.scheduleSize),
		weekly : jg.generateScheduleDays(jg.sys.curDate, 7),
		monthly : jg.generateScheduleDays(jg.sys.curDate, 5),
		quarterly : jg.generateScheduleDays(jg.sys.curDate, 3)
	}
	$("#workarea").empty();
	$("#workarea").append("<div id='tracker'></div>");

	jg.data.channels().each(function(r) {
		$("#tracker").append(div({
			id : r.id,
			className : "channel"
		}, i({
			onclick : jg.addTracker,
			style : {
				cssFloat : "right"
			},
			className : "fa fa-plus-square-o fa-2x add"
		}), h2(r.title)));
	})
	var curTable = false;
	var curGoalType = false;
	var curChannel = false;

	jg.data.goals().each(function(r) {
		var addHeader = false;

		if (curTable === false || curChannel !== r.channel || curGoalType !== r.type) {
			curTable = tbody();
			if (curGoalType !== r.type) {
				addHeader = true;
			}
			curGoalType = r.type;
			curChannel = r.channel;
			$("#" + curChannel).append(table({
				className : "table"
			}, curTable));
		}
		if (r.type == "onetime") {
			jg.renderTask(r,curTable);
		} else {
			jg.renderGoal(r, jg.config.boxes[r.type], curTable, addHeader);
		}
	});
	
	$(".box").on("click", jg.addMarker);
	$(".thumbshover").on("mouseenter", function () {
		var that = this;
		if ($(this).children(".fa").get().length == 0) {
		var that = this;
		$(this).append(jg.getMarker("upthumb",function () {
			jg.addMarker.apply(that,[false,"upthumb"]);
			$(that).children(".prompt").remove();
		},"prompt"));
		var that = this;
		$(this).append(jg.getMarker("downthumb",function () {
			jg.addMarker.apply(that,[false,"downthumb"]);
			$(that).children(".prompt").remove();
		},"prompt"));
		}
	});
	$(".thumbshover").on("mouseleave", function () {
		$(this).children(".prompt").remove();
	});
	$(".marker").on("click", jg.removeMarker);
	$(".toggle-ops, .box").on("mouseenter", function() {
		if ($("." + this.parentNode.className.split(" ")[1] + " td." + this.className.split(" ")[0] + ".toggle-ops").hasClass("active-options")) {

		} else {
			if ($(".toggle").get().length === 0) {
				$("." + this.parentNode.className.split(" ")[1] + " td." + this.className.split(" ")[0] + ".toggle-ops").append(i({
					onclick : jg.toggleOptions,
					className : "fa fa-sort-asc fa-2x toggle"
				}));
			}
			
		}

	});
	$(".toggle-ops, .box").on("mouseleave", function() {
		$("." + this.parentNode.className.split(" ")[1] + " td." + this.className.split(" ")[0] + ".toggle-ops").children(".toggle").remove()
	});

}, renderNav : function() {
}, renderNext : function() {
	jg.sys.curDate = jg.addDays(jg.sys.curDate, (jg.config.navigateBy == "byweek") ? 7 : 1);
	jg.renderWorkArea();
}, renderLast : function() {
	jg.sys.curDate = jg.subtractDays(jg.sys.curDate, (jg.config.navigateBy == "byweek") ? 7 : 1);
	jg.renderWorkArea();
},
};

// define onload
$(document).ready(jg.init);
