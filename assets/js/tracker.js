// Bug: Signin can sometimes redirect to signin - maybe redirect to goals if you are logged in and land on sign in
var jg = {
    dragdrop: {},
    sys: {
        curDate: null,
        loadDate: null,
        addnew: "",
        allowChangeProject: true,
        ickr: false,
        stopAction: false,
        total: 30,
        ajaxID: 1,
        everyxdays: 15,
        scheduleSize: 7
    },
    config: {},
    data: {
        goals: TAFFY([]),
        marks: TAFFY([]),
        logs: TAFFY([])
    },
    preventSubmit: function(v){
        return (v.keyCode == 13) ? false : true;
    },
    init: function(){
        jg.data.GOALS.config.set("template", {
            GOALPOINTS: 0,
            RANK: 0,
            "STATUS": "ACTIVE"
        });
        jg.data.ajaxMan = TAFFY([]);
        setInterval(function(){
            // upload Ajaxman
            var syncPacket = [];
            var items = 0;
            jg.data.ajaxMan.forEach(function(r){
                items++;
                if (items < 10) {
                    syncPacket[syncPacket.length] = r;
                    r.ajaxManStatus = 'waiting';
                    return r;
                }
            }, {
                ajaxManStatus: "pending"
            })
            if (syncPacket.length > 0) {
                $.post(jsonService, {
                    data: TAFFY.JSON.stringify(syncPacket)
                }, function(data){
                    var x = TAFFY(data);
                    x.forEach(function(r){
                        if (r.STATUS == "success") {
                            jg.data.ajaxMan.update({
                                ajaxManStatus: "done"
                            }, {
                                ajaxManID: r.ajaxManID
                            })
                            if (TAFFY.isArray(r.DATA) == true && r.DATA.length > 0) {
                                var request = jg.data.ajaxMan.first({
                                    ajaxManID: r.AJAXMANID
                                });
                                switch (request.recordType) {
                                    case "goals":
                                        jg.data.GOALS = TAFFY(r.DATA);
                                        jg.renderWorkArea();
                                        break;
                                }
                            }
                        }
                        else {
                            alert("failure:" + TAFFY.JSON.stringify(r));
                        }
                    })
                });
            }
        }, 5000)
        
        var createAjaxManInsert = function(action, recordType){
            return function(r, or){
                var record = TAFFY.mergeObj(r, {});
                if (action == 'update') {
                    record = TAFFY.mergeObj(TAFFY.JSON.parse(TAFFY.JSON.stringify(or)), TAFFY.JSON.parse(TAFFY.JSON.stringify(r)));
                }
                record.action = action;
                record.recordType = recordType;
                record.ajaxManStatus = 'pending';
                record.ajaxManID = jg.sys.ajaxID;
                jg.sys.ajaxID++;
                jg.data.ajaxMan.insert(record);
            }
            
        }
        if (jg.sys.writeable) {
            jg.data.GOALS.onInsert = createAjaxManInsert("insert", "goals");
            jg.data.GOALS.onUpdate = createAjaxManInsert("update", "goals");
            jg.data.GOALS.onRemove = createAjaxManInsert("delete", "goals");
            
            jg.data.MARKS.onInsert = createAjaxManInsert("insert", "marks");
            jg.data.MARKS.onUpdate = createAjaxManInsert("update", "marks");
            jg.data.MARKS.onRemove = createAjaxManInsert("delete", "marks");
            
            jg.data.LOGS.onInsert = createAjaxManInsert("insert", "LOGS");
            jg.data.LOGS.onUpdate = createAjaxManInsert("update", "LOGS");
            jg.data.LOGS.onRemove = createAjaxManInsert("delete", "LOGS");
            
            
            jg.data.TARGETS.onInsert = createAjaxManInsert("insert", "targets");
            jg.data.TARGETS.onUpdate = createAjaxManInsert("update", "targets");
            jg.data.TARGETS.onRemove = createAjaxManInsert("delete", "targets");
            
            
            jg.data.GROUPMEMBERS.onInsert = createAjaxManInsert("insert", "GROUPMEMBERS");
            jg.data.GROUPMEMBERS.onUpdate = createAjaxManInsert("update", "GROUPMEMBERS");
            jg.data.GROUPMEMBERS.onRemove = createAjaxManInsert("delete", "GROUPMEMBERS");
            jg.data.GROUPTEMPLATES.onInsert = createAjaxManInsert("insert", "GROUPTEMPLATES");
            jg.data.GROUPTEMPLATES.onUpdate = createAjaxManInsert("update", "GROUPTEMPLATES");
            jg.data.GROUPTEMPLATES.onRemove = createAjaxManInsert("delete", "GROUPTEMPLATES");
            
            jg.data.GROUPS.onInsert = createAjaxManInsert("insert", "GROUPS");
            jg.data.GROUPS.onRemove = createAjaxManInsert("delete", "GROUPS");
            jg.data.FRIENDEDYOU.onRemove = createAjaxManInsert("delete", "GROUPMEMBERS");
            
        }
        jg.initDate();
        jg.sys.loadDate = jg.sys.curDate;
        
        jg.config.client = jg.createID();
        
        
        if (jg.sys.writeable) {
            jg.initGoalPop();
            jg.initSharingPop();
            jg.initTargetPop();
            jg.initSettingsPop();
        }
        
        
        jg.renderWorkArea();
        
        $("#progressBar").progressbar({
            value: 0
        });
        
        
        
    },
    initDate: function(){
        jg.sys.curDate = new Date();
        
        if (jg.config.navigateBy == 'byweek' && jg.sys.curDate.getDay() != jg.config.firstDayOfWeek) {
            if (jg.sys.curDate.getDay() > jg.config.firstDayOfWeek) {
                jg.sys.curDate = jg.subtractDays(jg.sys.curDate, (jg.sys.curDate.getDay() - jg.config.firstDayOfWeek));
            }
            else {
                jg.sys.curDate = jg.subtractDays(jg.sys.curDate, (jg.sys.curDate.getDay() + (7 - jg.config.firstDayOfWeek)));
            }
        }
        else 
            if (jg.config.navigateBy == 'byday') {
                jg.sys.curDate = jg.subtractDays(jg.sys.curDate, 6);
            }
    },
    refreshGoals: function(){
        var r = {
            action: "refresh",
            recordType: "goals",
            ajaxManStatus: "pending",
            ajaxManID: jg.sys.ajaxID
        };
        jg.data.ajaxMan.insert(r);
        jg.sys.ajaxID++;
    },
    renderNext: function(){
        jg.sys.curDate = jg.addDays(jg.sys.curDate, (jg.config.navigateBy == "byweek") ? 7 : 1);
        jg.renderWorkArea();
    },
    renderLast: function(){
        jg.sys.curDate = jg.subtractDays(jg.sys.curDate, (jg.config.navigateBy == "byweek") ? 7 : 1);
        jg.renderWorkArea();
    },
    getPrintableCheck: function(id, type){
        return img({
            onclick: (jg.sys.writeable) ? jg.removeCheck : jg.deadEnd,
            src: jg.sys[type],
            ID: id
        });
    },
    setSum: function(d, amount){
        var curSum = parseFloat($("#" + d + "sum").text());
        curSum = curSum + amount;
        $("#" + d + "sum").text(curSum);
    },
    getTarget: function(day, goalID, open){
        var day = jg.formatDate(day);
        if (open) {
            var target = jg.data.TARGETS.first({
                STATUS: "OPEN",
                GOALID: goalID,
                STARTDTG: {
                    lte: day
                },
                ENDDTG: {
                    gte: day
                }
            });
        }
        else {
            var target = jg.data.TARGETS.first({
                GOALID: goalID,
                STARTDTG: {
                    lte: day
                },
                ENDDTG: {
                    gte: day
                }
            });
        }
        return target;
    },
    getTargetMarks: function(day, goal, target){
        var day = jg.formatDate(day);
        switch (target.TARGETTYPE) {
            case "daily_every":
                var marks = jg.data.MARKS.find({
                    MARKDTG: {
                        gte: jg.formatDate(jg.subtractDays(day, ((target.EVERY - 1) + (target.EVERY - 1))))
                    },
                    GOALID: goal.ID
                }, jg.data.MARKS.find({
                    MARKDTG: {
                        lte: target.ENDDTG
                    },
                    GOALID: goal.ID
                }));
                break;
            case "daily":
                var marks = jg.data.MARKS.find({
                    MARKDTG: day,
                    GOALID: goal.ID
                });
                break;
                
            case "weekly":
                var marks = jg.data.MARKS.find({
                    MARKDTG: {
                        lte: jg.findLastDayOfWeek(day, true)
                    },
                    GOALID: goal.ID
                }, jg.data.MARKS.find({
                    MARKDTG: {
                        gte: jg.findFirstDayOfWeek(day, true)
                    },
                    GOALID: goal.ID
                }));
                break;
            case "monthly":
                var marks = jg.data.MARKS.find({
                    MARKDTG: {
                        lte: jg.findLastDayOfMonth(day, true)
                    },
                    GOALID: goal.ID
                }, jg.data.MARKS.find({
                    MARKDTG: {
                        gte: jg.findFirstDayOfMonth(day, true)
                    },
                    GOALID: goal.ID
                }));
                break;
        }
        
                                  var total = 0;
                                  var runningTotal = 0;
                                  var newhit = 0;
                                  var newremove = 0;
                                  var score = 0;
                                  jg.data.MARKS.forEach(function (r) {
                                   if (goal.GOALTYPE == 'SCORESHEET') {
                                     total = total + r.AMOUNT;
                                     runningTotal = runningTotal + r.AMOUNT;
                                   } else {
                                     total++;
                                     runningTotal++;
                                   }
                                   if (runningTotal >= target.AMOUNT) {
                                     runningTotal = 0;
                                     if (r.TARGETID != target.ID) {
                                       r.TARGETID = target.ID;
                                       r.POINTSEARNED = target.REWARD;
                                       newhit++;
                                       score = score + target.reward;
                                       return r;
                                     }
                                   } else if (r.TARGETID != '') {
                                     r.TARGETID = '';
                                     r.POINTSEARNED = 0;
                                     newremove++;
                                     score = score - target.reward;
                                     return r;
                                   }
                                   
                                  },marks);
        return {total:total,hit:newhit,remove:newremove,score:score};
    },
    removeCheck: function(){
        var toremove = jg.data.MARKS.find({
            MARKDTG: this.parentNode.day,
            GOALID: this.parentNode.parentNode.record.ID
        });
        if (toremove.length > 0) {
            jg.data.MARKS.remove(toremove[0]);
        }
        var parent = this.parentNode;
        
        jg.renderStats(parent.parentNode.record.ID);
        
        var parent = this.parentNode;
        $(parent).empty().append(jg.getNBSP());
        jg.data.MARKS.forEach(function(r){
            $(parent).append(jg.getPrintableCheck(r.ID, parent.parentNode.record.GOALTYPE));
        }, {
            MARKDTG: parent.day,
            GOALID: parent.parentNode.record.ID
        })
        jg.stopNextAction();
        
    },
    addCheck: function(){
        if (!jg.sys.stopAction) {
            var checkid = jg.createID();
            this.appendChild(jg.getPrintableCheck(checkid, this.parentNode.record.GOALTYPE));
            jg.data.MARKS.insert({
                GOALID: this.parentNode.record.ID,
                ID: jg.createID(),
                MARKDTG: this.day,
                MARKTYPE: "CHECK",
                POINTSEARNED: 0,
                TARGETID: "",
                AMOUNT: 1
            });
            jg.data.MARKS.orderBy(["GOALID", "MARKDTG", "TARGETID"]);
            
            var that = this;
            jg.renderStats(that.parentNode.record.ID);
        
        }
    },
    stopNextAction: function(timer){
        timer = timer || 100;
        jg.sys.stopAction = true;
        setTimeout(function(){
            jg.sys.stopAction = false
        }, timer);
        
    },
    readOrder: function(){
        var postion = 0;
        var dorerender = false;
        $("#tracker tr").each(function(){
            if (this.record) {
                if (this.record.rank != postion) {
                    jg.data.GOALS.update({
                        RANK: postion
                    }, {
                        ID: this.record.ID
                    });
                    dorerender = true;
                }
                postion = postion + 1;
            }
        })
        if (dorerender) {
            jg.data.GOALS.orderBy("RANK");
            jg.renderWorkArea();
        }
    },
    renderStats: function(id, callback){
        var days = jg.generateScheduleDays(jg.sys.curDate, jg.sys.scheduleSize);
        var goals = (id) ? jg.data.GOALS.find({
            ID: id
        }) : jg.data.GOALS.find();
        var prettyPrintLastEntry = function(lastEntry){
            if (TAFFY.isString(lastEntry)) {
                var days = jg.daysDiff(new Date(), lastEntry);
                if (days == 1 || days == 0) {
                    lastEntry = "Today";
                }
                else 
                    if (days == 2) {
                        lastEntry = "Yesterday";
                    }
                    else 
                        if (days > 0) {
                            lastEntry = (days - 1) + " days ago";
                        }
                        else {
                            lastEntry = "Today";
                        }
            }
            else {
                lastEntry = "";
            }
            return lastEntry;
        }
        jg.data.GOALS.forEach(function(r){
            var target = jg.getTarget(jg.sys.curDate, r.ID, false);

            if (target) {
                
            	switch (r.GOALTYPE) {
                    case "PLUS":
                    case "MINUS":
                    case "SCORESHEET":
                        
                        
                        switch (target.TARGETTYPE) {
                        
                            case "daily_every":
                            case "daily":
                                for (var x = 0; x < days.length; x++) {
                                  
                                  var marks = jg.getTargetMarks(days[x], r, target);
                                  
                                  
                                  
                                  var per = Math.round((marks.total / target.AMOUNT * 100));
                                  if (per > 99) {
                                        $("#" + r.ID + " ." + jg.formatDate(days[x])).not(".nonday").addClass("goalHit");
                                    }
                                    else {
                                        $("#" + r.ID + " ." + jg.formatDate(days[x])).removeClass("goalHit");
                                    }
                                }
                                
                                break;
                            default:
                                var marks = jg.getTargetMarks(jg.sys.curDate, r, target);
                                  
                                  
                            
                                var per = Math.round((marks.total / target.AMOUNT * 100));
                                
                                if (target.TARGETTYPE == 'weekly') {
                                
                                    if (per > 99) {
                                        $("#" + r.ID + " .goalCell").not(".nonday").addClass("goalHit");
                                    }
                                    else {
                                        $("#" + r.ID + " .goalHit").removeClass("goalHit");
                                    }
                                }
                                if (target.TARGETTYPE == 'monthly') {
                                    var month = jg.left(jg.formatDate(jg.sys.curDate), 7);
                                    if (per > 99) {
                                        $("#" + r.ID + " .goalCell").each(function(){
                                            if (jg.left(this.className, 16) == "goalCell " + month) {
                                            
                                                $(this).addClass("goalHit");
                                            }
                                            
                                        })
                                    }
                                    else {
                                        $("#" + r.ID + " .goalCell").each(function(){
                                            if (jg.left(this.className, 16) == "goalCell " + month) {
                                                $(this).removeClass("goalHit");
                                            }
                                            
                                        })
                                    }
                                    
                                    
                                    var nd = jg.addDays(jg.sys.curDate, jg.sys.scheduleSize);
                                    if (jg.left(jg.formatDate(jg.sys.curDate), 7) != jg.left(jg.formatDate(nd), 7)) {
                                        var target = jg.getTarget(nd, r.ID, false);
                                        var marks = jg.getTargetMarks(nd, r, target);
                                  
                                 
                                        
                                        
                                        var per = Math.round((marks.total / target.AMOUNT * 100));
                                        
                                        var month = jg.left(jg.formatDate(nd), 7);
                                        
                                        
                                        
                                        
                                        if (per > 99) {
                                            $("#" + r.ID + " .goalCell").each(function(){
                                                if (jg.left(this.className, 16) == "goalCell " + month) {
                                                    $(this).addClass("goalHit");
                                                }
                                                
                                            })
                                        }
                                        else {
                                            $("#" + r.ID + " .goalCell").each(function(){
                                                if (jg.left(this.className, 16) == "goalCell " + month) {
                                                    $(this).removeClass("goalHit");
                                                }
                                                
                                            })
                                            
                                        }
                                        
                                        
                                    }
                                }
                                $("#" + r.ID + "peroftarget").empty().append(span(per + "%"));
                                
                                
                                break;
                        }
                        
                        break;
                        
                }
                
                
            }
           
            if (r.GOALTYPE == 'LOGBOOK') {
                var lastEntry = prettyPrintLastEntry(jg.data.LOGS.max("MARKDTG", {
                    GOALID: r.ID
                }));
                var cell = $("#" + r.ID + "stats").empty().append(span({
                    className: "lastEntry"
                }, lastEntry));
            }
            else 
                if (r.GOALTYPE == "SCORESHEET") {
                    var lastEntry = prettyPrintLastEntry(jg.data.MARKS.max("MARKDTG", {
                        GOALID: r.ID
                    }));
                    var total = jg.data.MARKS.sum("AMOUNT", {
                        GOALID: r.ID,
                        MARKDTG: days
                    });
                    var score = jg.data.MARKS.sum("POINTSEARNED", {
                        GOALID: r.ID,
                        MARKDTG: days,
                        POINTSEARNED: {
                            "!is": 0
                        }
                    });
                    $("#" + r.ID + "stats").empty().append(span({
                        className: "goalTotal"
                    }, total)).append(br()).append(span({
                        className: "lastEntry"
                    }, lastEntry))
                    
                    if (jg.config.showPoints && score != 0) {
                        $("#" + r.ID + "peroftarget").empty().append(span({
                            className: (score >= 0) ? "goalScorePostive" : "goalScoreNegative"
                        }, score)).append(br()).append(span({
                            className: "lastEntry"
                        }, "Week"));
                    }
                }
                else {
                    var total = jg.data.MARKS.find({
                        GOALID: r.ID,
                        MARKDTG: days
                    }).length;
                    var score = jg.data.MARKS.sum("POINTSEARNED", {
                        GOALID: r.ID,
                        MARKDTG: days,
                        POINTSEARNED: {
                            "!is": 0
                        }
                    });
                    
                    var lastEntry = prettyPrintLastEntry(jg.data.MARKS.max("MARKDTG", {
                        GOALID: r.ID,
                        MARKTYPE: ["CHECK"]
                    }));
                    
                    
                    //var cell = $("#" + r.ID + "stats").empty().append(span("Checks: " + total)).append(br()).append((jg.config.showPoints) ? span(score) : span("")).append(br()).append(span(lastEntry));
                    $("#" + r.ID + "stats").empty().append(span({
                        className: "goalTotal"
                    }, total)).append(br()).append(span({
                        className: "lastEntry"
                    }, lastEntry))
                    
                    if (jg.config.showPoints && score != 0) {
                        $("#" + r.ID + "peroftarget").empty().append(span({
                            className: (score >= 0) ? "goalScorePostive" : "goalScoreNegative"
                        }, score)).append(br()).append(span({
                            className: "lastEntry"
                        }, (target.TARGETTYPE == 'monthly') ? 'Month' : "Week"));
                    }
                    
                    
                }
            
        }, goals)
        
        if (TAFFY.isFunction(callback)) {
            callback();
        }
    },
    printTracker: function(){
        $("#printForm").get()[0].grid.value = $("#workarea").html();
        $("#printForm").get()[0].submit();
    },
    renderWorkArea: function(){
    
    
        var el = $("#workarea").empty().get()[0];
        var tracker = tbody();
        
        if (jg.sys.writeable) {
        
            var addButton = div({
                onclick: jg.createGoal,
                className: "addTracker"
            }, "Add");
            if (jg.sys.maxGoals == 0) {
            
            }
            else {
                var maxRemain = jg.sys.maxGoals - jg.data.GOALS.getLength();
                if (maxRemain <= 0) {
                    var addButton = div({
                        className: "addTracker"
                    }, span("[" + jg.sys.maxGoals + " Goals Max] - "), a({
                        href: upgradeURL
                    }, "Upgrade"));
                }
            }
            
            tracker.appendChild(tr({}, td({
                colSpan: 12,
                align: "right"
            }, div({
                style: {
                    padding: "3px"
                },
                className: "menu ui-widget-header ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix"
            }, addButton, span({
                className: "friendsGroups",
                onclick: jg.openSharingPop
            }, (jg.config.friendsMode == "FRIENDS") ? "Friends and Groups" : "People and Groups"), span(" | "), span({
                className: "print",
                onclick: jg.printTracker
            }, "Print"), span(" | "), span({
                className: "settings",
                onclick: jg.openSettings
            }, "Settings")))))
        }
        var scheduleTableRow = tr({
            className: "header"
        });
        scheduleTableRow.appendChild(td({
            colSpan: 3,
            className: "goBack"
        }, span({
            onclick: function(){
                jg.initDate();
                jg.renderWorkArea();
            },
            className: "todayB clickableButton ui-state-default ui-corner-all",
            style: {
                display: "inline"
            }
        }, "Today"), img({
            onclick: jg.renderLast,
            src: jg.sys.arrow_left
        })));
        
        var days = jg.generateScheduleDays(jg.sys.curDate, jg.sys.scheduleSize);
        var today = jg.formatDate(new Date());
        var hideToday = false;
        for (x = 0; x < days.length; x++) {
            if (days[x] == today) {
                var hideToday = true;
                
            }
            var className = (days[x])
            scheduleTableRow.appendChild(td({
                vAlign: "top",
                className: (days[x] == today) ? "dayHeader today " + days[x] : "dayHeader " + days[x]
            }, jg.formatDisplayDate(days[x], true)));
        };
        scheduleTableRow.appendChild(td({
            colSpan: 2,
            className: "goForward",
            align: "right"
        }, img({
            onclick: jg.renderNext,
            src: jg.sys.arrow_right
        })));
        tracker.appendChild(scheduleTableRow);
        var logs = TAFFY(jg.data.LOGS.get({
            MARKDTG: days
        }));
        
        var toggle = "on";
        jg.data.GOALS.forEach(function(r){
            if (toggle == "off") {
                toggle = "on";
            }
            else {
                toggle = "off";
            }
            switch (r.GOALTYPE) {
                case "PLUS":
                    var icon = img({
                        src: jg.sys.smile
                    });
                    var click = (jg.sys.writeable) ? jg.addCheck : jg.deadEnd;
                    break;
                case "MINUS":
                    var icon = img({
                        src: jg.sys.frown
                    });
                    var click = (jg.sys.writeable) ? jg.addCheck : jg.deadEnd;
                    break;
                case "SCORESHEET":
                    var icon = img({
                        src: jg.sys.scoresheet
                    });
                    
                    var click = jg.deadEnd;
                    break;
                case "LOGBOOK":
                    var icon = img({
                        src: jg.sys.logbook
                    });
                    var click = (jg.sys.writeable) ? function(){
                        jg.sys.contextclick = this;
                        jg.editCell();
                    }
 : jg.deadEnd;
                    break;
            }
            var target = jg.data.TARGETS.first({
                GOALID: r.ID,
                STARTDTG: {
                    lte: jg.formatDate(jg.sys.curDate)
                },
                ENDDTG: {
                    gte: jg.formatDate(jg.sys.curDate)
                }
            });
            var goal = tr({
                record: r,
                className: r.GOALTYPE,
                id: r.ID
            }, td({
                className: "sorthandle " + toggle
            }, (jg.sys.writeable) ? "||" : ""));
            var goalTitle = td({
                
                className: "title " + toggle
            });
            if (r.SHARINGTYPE == "GROUP" || r.SHARINGTYPE == "FRIENDS" || r.SHARINGTYPE == "FRIENDS_SELECT") {
                switch (r.SHARINGTYPE) {
                    case "FRIENDS":
                        var title = "SHARED GOAL|This goal is shared with all " + (jg.config.friendsMode == "FRIENDS") ? "your friends" : "your contacts";
                        break;
                    case "FRIENDS_SELECT":
                        var title = "SHARED GOAL|This goal is shared with the " + ((jg.config.friendsMode == "FRIENDS") ? "friends " : "contacts ") + "you selected.";
                        break;
                    case "GROUP":
                        var title = "GROUP GOAL|This goal is visible to members of " + r.GROUPNAME + ".";
                        break;
                }
                goalTitle.appendChild(img({
                    className: "goalicon",
                    title: title,
                    src: jg.sys.group,
                    style: {
                        opacity: "0.5"
                    }
                }));
            }
            else 
                if (r.SHARINGTYPE == 'PRIVATE') {
                    goalTitle.appendChild(img({
                        className: "goalicon",
                        title: "PRIVATE|Goal is only visiable to you",
                        src: jg.sys.lock,
                        style: {
                            opacity: "0.5"
                        }
                    }));
                    
                }
            goalTitle.appendChild(span({onclick: (jg.sys.writeable) ? function(){
                jg.editGoal(r.ID, "GOALS")
            }
: jg.deadEnd},r.DISPLAYNAME))
            var doClass = false;
            goalTitle.appendChild(br());
            goalTitle.appendChild(span({
            	onclick: (jg.sys.writeable) ? function(){
                    if (!target) {
                    	jg.setTarget(r.ID)
                    } else {
                    	jg.editGoal(r.ID,"GOALS");
                    }
                }
    : jg.deadEnd,
            	className: (target) ? "target" : "settarget"
            }, (target) ? (function(){
                switch (target.TARGETTYPE) {
                    case "daily":
                        doClass = true;
                        return target.AMOUNT + " a day";
                        break;
                    case "weekly":
                        return target.AMOUNT + " a week";
                        break;
                    case "monthly":
                        return target.AMOUNT + " a month";
                        break;
                    case "daily_every":
                        return target.AMOUNT + " every " + target.EVERY + " days";
                        break;
                }
            })() : "set target"));
            goal.appendChild(goalTitle);
            
            
            goal.appendChild(td({
                className: "icon " + toggle
            }, icon));
            
            for (x = 0; x < days.length; x++) {
                var title = "";
                
                var className = "goalCell";
                var log = logs.first({
                    MARKDTG: days[x],
                    GOALID: r.ID
                });
                var fill = "";
                if (log) {
                    className = className + " flagnote";
                    var title = "Log|" + log.ENTRY;
                    if (r.GOALTYPE == 'LOGBOOK') {
                        var fill = jg.left(log.ENTRY, 30);
                    }
                }
                var dateObj = jg.parseDate(days[x]);
                if (!r.DAYS.split) {
                	r.DAYS = r.DAYS + 0;
                    r.DAYS = r.DAYS + "";
                } 
                  
                  var cdays = r.DAYS.split(',');
                	
               
                  
                var nonday = true;
                for (var g = 0; g < cdays.length; g++) {
                    if (cdays[g] == dateObj.getDay()) {
                        nonday = false;
                    }
                }
                if (nonday) {
                    className = className + " nonday";
                }
                if (r.GOALTYPE == 'SCORESHEET') {
                    var scoresheetrecord = jg.data.MARKS.first({
                        GOALID: r.ID,
                        MARKDTG: days[x]
                    })
                    if (TAFFY.isObject(scoresheetrecord)) {
                        var fill = scoresheetrecord.AMOUNT;
                        
                    }
                    else {
                        var fill = "";
                    }
                    
                    
                }
                var cell = td({
                    onclick: click,
                    day: days[x],
                    title: title
                });
                var hascheck = false;
                if (r.GOALTYPE != 'SCORESHEET' && r.GOALTYPE != 'LOGBOOK') {
                    var targetHit = false;
                    jg.data.MARKS.forEach(function(t){
                        hascheck = true;
                        if (t.TARGETID != '') {
                            targetHit = true;
                            
                        }
                        cell.appendChild(jg.getPrintableCheck(t.ID, r.GOALTYPE));
                    }, {
                        GOALID: r.ID,
                        MARKDTG: days[x],
                        MARKTYPE: "CHECK"
                    })
                   
                }
                else 
                    if (r.GOALTYPE == 'SCORESHEET' || r.GOALTYPE == "LOGBOOK") {
                        cell.appendChild(document.createTextNode(fill));
                    }
                if (!hascheck) {
                    cell.appendChild(jg.getNBSP());
                }
                className = className + " " + days[x];
                className = className + " " + r.GOALTYPE + "cell";
                cell.className = className;
                
                goal.appendChild(cell);
            }
            goal.appendChild(td({
                align: "center",
                valign: "middle",
                className: "stats " + toggle,
                id: r.ID + "stats"
            }));
            goal.appendChild(td({
                align: "center",
                valign: "middle",
                className: "peroftarget " + toggle,
                id: r.ID + "peroftarget"
            }));
            tracker.appendChild(goal);
            
        })
        
        
        
        if (jg.config.showPoints) {
            var summaryRow = tr({
                className: "summary"
            });
            
            summaryRow.appendChild(td({
                colSpan: 3
            }));
            
            for (x = 0; x < days.length; x++) {
                var score = jg.data.MARKS.sum("POINTSEARNED", {
                    MARKDTG: days[x]
                });
                summaryRow.appendChild(td({
                    id: days[x] + "sum"
                }, score));
            };
            var score = jg.data.MARKS.sum("POINTSEARNED");
            summaryRow.appendChild(td());
            if (score != 0) {
                summaryRow.appendChild(td({
                    className: "grand"
                },                /*img({
                 src: jg.sys.bank,
                 style:{opacity:"0.2"}
                 }),*/
                span({
                    className: (score >= 0) ? "goalScorePostive" : "goalScoreNegative"
                }, score), br()));
            }
            else {
                summaryRow.appendChild(td({
                    className: "grand"
                }));
            }
            tracker.appendChild(summaryRow);
            
        }
        el.appendChild(table({
            className: "tracker",
            id: "tracker"
        }, tracker));
        
        
        
        if (jg.sys.writeable) {
        
            $(".SCORESHEETcell").editable(function(value, settings){
                var goal = this.parentNode.record;
                jg.sys.contextclick = this;
                var eEntry = jg.data.MARKS.first({
                    GOALID: goal.ID,
                    MARKDTG: jg.sys.contextclick.day
                });
                var evalue = (eEntry) ? eEntry.AMOUNT : 0;
                if (value.length > 0) {
                    value = parseFloat(value);
                    if (isNaN(value)) {
                        value = "";
                    }
                }
                else {
                    value = "";
                }
                
                
                if (eEntry) {
                    if (value.length == 0) {
                        jg.data.MARKS.remove({
                            ID: eEntry.ID
                        });
                        $(jg.sys.contextclick).html("");
                    }
                    else {
                        jg.data.MARKS.update({
                            AMOUNT: value,
                            TARGETID: "",
                            POINTSEARNED: 0
                        }, {
                            ID: eEntry.ID
                        });
                        $(jg.sys.contextclick).html(value);
                    }
                }
                else {
                    if (value > 0) {
                    
                        jg.data.MARKS.insert({
                            GOALID: goal.ID,
                            ID: jg.createID(),
                            MARKDTG: jg.sys.contextclick.day,
                            MARKTYPE: "SCORESHEET",
                            POINTSEARNED: 0,
                            TARGETID: "",
                            AMOUNT: value
                        });
                        $(jg.sys.contextclick).html(value);
                    }
                }
                
                jg.renderStats(goal.ID);
                if (value.length == 0) {
                    return jg.getNBSP();
                }
                return (value);
            }, {
                event: "click",
                onblur: "submit",
                select: true,
                placeholder: "",
                onreset: function(settings, self){
                    $(self).html(self.revert);
                    self.editing = false;
                    if (!$.trim($(self).html())) {
                        $(self).html(jg.getNBSP());
                    }
                    return false;
                },
                onedit: function(){
                    if (this.innerHTML == '&nbsp;') {
                        this.innerHTML = '';
                    }
                    else {
                        this.innerHTML = this.innerHTML.split("&")[0];
                        
                    }
                }
            });
            $(function(){
                $("#tracker tbody").sortable({
                    items: "tr:not(.header, .summary)",
                    ondrag: function(){
                        jg.stopNextAction(6000);
                    },
                    update: function(event, ui){
                        jg.readOrder();
                    },
                    handle: ".sorthandle",
                    forceHelperSize: true
                });
            });
            $(".goalCell").showMenu({
                opacity: 0.8,
                query: "#goalMenu"
            });
            $("#goalMenu li").click(function(){
                jg.editCell();
            });
        }
        jg.renderStats();
        
        $('.flagnote, .goalicon').cluetip({
            arrows: true,
            splitTitle: '|'
        });
        
        
        if (hideToday) {
            $(".todayB").get()[0].style.display = "none";
        }
        return true;
    },
    editCell: function(){
        var goal = jg.sys.contextclick.parentNode.record;
        var elog = jg.data.LOGS.first({
            GOALID: goal.ID,
            MARKDTG: jg.sys.contextclick.day
        });
        var value = "";
        var id = false;
        if (TAFFY.isObject(elog)) {
            value = elog.ENTRY;
            id = elog.ID;
        }
        var saveFunc = function(){
            var log = $("#confirm textarea").get()[0];
            if (id) {
                if (log.value.length == 0) {
                    jg.data.LOGS.remove({
                        ID: id
                    });
                }
                else {
                    jg.data.LOGS.update({
                        ENTRY: log.value
                    }, {
                        ID: id
                    });
                }
            }
            else {
                if (log.value.length > 0) {
                    jg.data.LOGS.insert({
                        ID: jg.createID(),
                        MARKDTG: jg.sys.contextclick.day,
                        GOALID: goal.ID,
                        ENTRY: log.value
                    });
                    $(jg.sys.contextclick).addClass("flagnote");
                    $(jg.sys.contextclick).get()[0].title = "Log|" + log.value;
                    $(jg.sys.contextclick).cluetip({
                        arrows: true,
                        splitTitle: '|'
                    });
                    if (goal.GOALTYPE == 'LOGBOOK') {
                        $(jg.sys.contextclick).empty().append(document.createTextNode(jg.left(log.value, 30)));
                        
                    }
                }
            }
            if (goal.GOALTYPE == 'SCORESHEET') {
                var value = $("#confirm input").get()[0].value;
                if (value.length > 0) {
                    value = parseFloat(value);
                }
                else {
                    value = "";
                }
                
                // TODO: need to handle deletes of Scoresheets
                if (eEntry) {
                    if (value.length == 0) {
                        jg.data.MARKS.remove({
                            ID: eEntry.ID
                        });
                        $(jg.sys.contextclick).html("");
                    }
                    else {
                        jg.data.MARKS.update({
                            AMOUNT: value,
                            TARGETID: "",
                            POINTSEARNED: 0
                        }, {
                            ID: eEntry.ID
                        });
                        $(jg.sys.contextclick).html(value);
                    }
                }
                else {
                    if (value > 0) {
                    
                        jg.data.MARKS.insert({
                            GOALID: goal.ID,
                            ID: jg.createID(),
                            MARKDTG: jg.sys.contextclick.day,
                            MARKTYPE: "SCORESHEET",
                            POINTSEARNED: 0,
                            TARGETID: "",
                            AMOUNT: value
                        });
                        $(jg.sys.contextclick).html(value);
                    }
                }
                
                jg.renderStats(goal.ID);
            }
            $("#confirm").dialog('destroy');
        };
        
        
        
        switch (goal.GOALTYPE) {
            case "SCORESHEET":
                var eEntry = jg.data.MARKS.first({
                    GOALID: goal.ID,
                    MARKDTG: jg.sys.contextclick.day
                });
                var evalue = (eEntry) ? eEntry.AMOUNT : 0;
                $("#confirm").html(div(span(jg.formatDisplayDate(jg.sys.contextclick.day)), br(), form(fieldset(label("Value"), br(), input({
                    type: "text",
                    value: evalue,
                    events: {
                        onkeypress: function(v){
                            if (v.keyCode == 13) {
                                saveFunc();
                                return false;
                            }
                            return true;
                        }
                    }
                }), br(), label("Log"), br(), textarea({
                    value: value
                })))));
                
                break;
            default:
                $("#confirm").html(div(span(jg.formatDisplayDate(jg.sys.contextclick.day)), br(), form(fieldset(label("Log"), br(), textarea({
                    value: value
                })))));
                
                break;
        }
        
        $("#confirm").dialog({
            bgiframe: true,
            resizable: false,
            width: 400,
            title: "Edit",
            modal: true,
            overlay: {
                backgroundColor: '#000',
                opacity: 0.5
            },
            close: function(){
                $(this).dialog('destroy');
            },
            buttons: {
                'Save': saveFunc,
                Cancel: function(){
                    $(this).dialog('destroy');
                }
            }
        });
    },
    addSelectFriend: function(username){
        var curGoal = $("#goalPop").get()[0].record;
        if (curGoal.SHARINGTYPE = 'FRIENDS_SELECT') {
            jg.addMemberToGroup(username, curGoal.ID, "OBSERVER", function(result){
                if (result == false) {
                    alert("Unable to add " + username + " to group.. " + result)
                }
                else {
                    jg.printSelectFriends();
                }
            });
            
        }
    },
    printSelectFriends: function(){
        var curGoal = $("#goalPop").get()[0].record;
        $("#listSelectFriends").text("");
        $("#listSelectFriends").append(jg.renderMemberList({
            GROUPID: curGoal.ID
        }, 'FRIENDS_SELECT', jg.printSelectFriends));
    },
    initGoalPop: function(){
        var goalType = $("#goalPop .goalType"), displayName = $("#goalPop .title"), applyToOwners = $("#goalPop .applyToOwners"), sharingType = $("#goalPop .sharingType"), allFields = $([]).add(goalType).add(displayName).add(sharingType), tips = $("#goalPop .validateTips");
        
        function updateTips(t){
            tips.text(t).effect("highlight", {}, 1500);
        }
        
        function checkLength(o, n, min, max){
        
            if (o.val().length > max || o.val().length < min) {
                o.addClass('ui-state-error');
                updateTips("Length of " + n + " must be between " + min + " and " + max + ".");
                return false;
            }
            else {
                return true;
            }
            
        }
        
        function checkRegexp(o, regexp, n){
        
            if (!(regexp.test(o.val()))) {
                o.addClass('ui-state-error');
                updateTips(n);
                return false;
            }
            else {
                return true;
            }
            
        }
        
        var initPop = function(config){
        
            $("#goalPop").dialog(TAFFY.mergeObj({
                bgiframe: true,
                autoOpen: false,
                width: 600,
                modal: true,
                buttons: {
                    'Save': function(){
                    
                    },
                    Cancel: function(){
                        $(this).dialog('close');
                    }
                },
                title: "Empty Pop",
                close: function(){
                    allFields.val('').removeClass('ui-state-error');
                    $(this).dialog("destroy");
                }
            }, config));
            
        }
        $(".dayselect span").click(function(){
            if ($(this).hasClass("selected")) {
                $(this).removeClass("selected");
            }
            else {
                $(this).addClass("selected");
            }
        });
        jg.createGoal = function(callback, ownerid, newTemplate){
            $(".dayselect .active").removeClass("selected");
            $(".dayselect span").addClass("selected");
            $("#addSelectFriends").empty();
            var ownerid = ownerid || false;
            var callback = (TAFFY.isFunction(callback)) ? callback : function(){
                jg.renderWorkArea();
                jg.readOrder();
            };
            if (ownerid) {
                $(".dayselect").css("display", "none");
            }
            else {
                $(".dayselect").css("display", "block");
            }
            var newTemplate = newTemplate || false;
            if (newTemplate) {
                var newTemplate = true;
                $("#applytoowners").css("display", "block");
                applyToOwners.val("Y");
            }
            else {
                var newTemplate = false;
                $("#applytoowners").css("display", "none");
            }
            sharingType.get()[0].onchange = function(){
                if (this.value == 'FRIENDS_SELECT') {
                    $("#listSelectFriends").css("display", "block");
                }
                else {
                    $("#listSelectFriends").css("display", "none");
                }
            };
            $("#listSelectFriends").css("display", "none").text("You can add another person to view this goals once you save it.");
            var rank = 0;
            var sharing = sharingType.empty().get()[0];
            if (ownerid) {
                sharing.appendChild(option({
                    value: "GROUP"
                }, "Group: " +
                jg.data.GROUPS.first({
                    ID: ownerid
                }).DISPLAYNAME));
            }
            else {
              
            }
            var type = goalType.empty().get()[0];
            
            
            if (jg.data.GOALS.getLength > 0) {
                rank = (jg.data.GOALS.last().rank + 1);
            }
            $('#goalPop .currentTarget').text("");
            allFields.val('').removeClass('ui-state-error');
            initPop({
                title: "Create a new goal",
                buttons: {
                    'Create Goal': function(){
                        var bValid = true;
                        allFields.removeClass('ui-state-error');
                        var id = jg.createID();
                        var days = [];
                        $(".dayselect .selected").each(function(){
                            days[days.length] = this.id;
                        })
                        days = days.join(",");
                        if (jg.isName(displayName.val())) {
                            var id = jg.createID();
                            if (ownerid && newTemplate == false) {
                                jg.data.GOALS.insert({
                                    ID: id,
                                    DISPLAYNAME: displayName.val(),
                                    RANK: rank,
                                    GOALTYPE: goalType.val(),
                                    SHARINGTYPE: sharingType.val(),
                                    OWNERID: ownerid,
                                    TEMPLATEID: "",
                                    DAYS: days
                                });
                            }
                            else 
                                if (newTemplate) {
                                    jg.data.GROUPTEMPLATES.insert({
                                        ID: id,
                                        DISPLAYNAME: displayName.val(),
                                        GOALTYPE: goalType.val(),
                                        GROUPID: ownerid,
                                        SHARINGTYPE: sharingType.val(),
                                        APPLYTOOWNERS: applyToOwners.val()
                                    });
                                    if (applyToOwners.val() == "Y") {
                                        jg.refreshGoals();
                                    }
                                }
                                else {
                                    jg.data.GOALS.insert({
                                        ID: id,
                                        DISPLAYNAME: displayName.val(),
                                        RANK: rank,
                                        GOALTYPE: goalType.val(),
                                        SHARINGTYPE: sharingType.val(),
                                        TEMPLATEID: "",
                                        DAYS: days
                                    });
                                    var setTarget = $("input[name='settarget']:checked"), updowntarget = $("#goalPop .updowntarget"), target = $("#goalPop .target"), targettype = $("#goalPop .targettype"), reward = $("#goalPop .reward"), targetType = targettype.val(), every = 0;
                                    if (setTarget.val() == "yes" && target.val().length > 0) {
                                        if (targetType.split(" ").length > 1) {
                                            every = parseFloat(targetType.split(" ")[0]);
                                            targetType = "daily_every";
                                        }
                                        
                                        jg.data.TARGETS.insert({
                                            ID: jg.createID(),
                                            GOALID: id,
                                            UPDOWN: updowntarget.val(),
                                            AMOUNT: parseFloat(target.val()),
                                            TARGETTYPE: targetType,
                                            REWARD: parseFloat((goalType.val() == 'MINUS') ? -reward.val() : reward.val()),
                                            EVERY: every,
                                            STATUS: "OPEN",
                                            STARTDTG: jg.formatDate(jg.sys.curDate),
                                            ENDDTG: '2100-01-01'
                                        })
                                    }
                                }
                            $(this).dialog("destroy");
                            if (sharingType.val() == "FRIENDS_SELECT") {
                                var groupid = jg.createID();
                                jg.data.GROUPS.insert({
                                    ID: groupid,
                                    STATUS: "ACTIVE",
                                    GROUPTYPE: "SHAREDGOAL",
                                    DISPLAYNAME: "GOALSHARE",
                                    VANITYURL: "/shared",
                                    DISPLAYDESC: id,
                                    TEMPLATEID: ""
                                });
                                jg.data.GOALS.update({
                                    OWNERID: groupid
                                }, {
                                    ID: id
                                });
                                jg.editGoal(id, "GOALS");
                            }
                        }
                        else {
                            updateTips("Goal name contains invalid characters.");
                        }
                        callback();
                    },
                    Cancel: function(){
                        $(this).dialog("destroy");
                    }
                }
            });
            if (!newTemplate) {
                $("#goalPop .currentTarget").empty().append(span("Set target:")).append(input({
                    type: "radio",
                    name: "settarget",
                    value: "yes",
                    checked: true
                })).append(label("Now")).append(input({
                    type: "radio",
                    name: "settarget",
                    value: "no"
                })).append(label("Or later")).append(jg.renderSetTarget({
                    GOALTYPE: "PLUS"
                }));
                $("input[name='settarget']:").click(function(){
                    if (this.value == 'yes') {
                        $("#goalPop .currentTarget form").show();
                    }
                    else {
                        $("#goalPop .currentTarget form").hide();
                    }
                })
                $("#goalPop .goalType").bind("change", function(){
                    if (this.value == 'LOGBOOK') {
                        $("#goalPop .currentTarget").hide();
                    }
                    else {
                        $("#goalPop .currentTarget").show();
                        
                        $("#goalPop .currentTarget form").replaceWith(jg.renderSetTarget({
                            GOALTYPE: this.value
                        }));
                    }
                });
            }
            $('#goalPop').dialog('open');
        }
        jg.editGoal = function(id, mode){
            $("#goalPop .goalType").unbind("change");
            var curGoal = jg.data[mode].first({
                ID: id
            });
            if (mode == "GOALS") {
                $(".dayselect").css("display", "block");
                var days = curGoal.DAYS.split(",");
                $(".dayselect span").removeClass("selected").each(function(){
                    for (var x = 0; x < days.length; x++) {
                        if (days[x] == this.id) {
                            $(this).addClass("selected");
                        }
                    }
                })
            }
            else {
                $(".dayselect").css("display", "none");
            }
            sharingType.get()[0].onChange = function(){
                if (this.value == 'FRIENDS_SELECT') {
                    $("#listSelectFriends").css("display", "block");
                    jg.printSelectFriends();
                    $($("#addSelectFriends").get()[0]).empty();
                    $("#addSelectFriends").get()[0].appendChild(jg.renderAddUser(function(){
                    
                        if ($("#addSelectFriends .username").val().length > 0) {
                            jg.addSelectFriend($("#addSelectFriends .username").val());
                        }
                    }, (jg.config.friendsMode == "FRIENDS") ? "Add Friend" : "Add User"));
                }
                else {
                    $("#addSelectFriends").empty();
                    $("#listSelectFriends").css("display", "none");
                }
            };
             
            allFields.val('').removeClass('ui-state-error');
            var sharing = $("#goalPop .sharingType").get()[0];
            $(sharing).empty();
            displayName.removeAttr("disabled");
            
            
            var printTargets = function(){
                var targetDiv = $('#goalPop .currentTarget').empty().get()[0];
                if (jg.data.TARGETS.find({
                    GOALID: curGoal.ID
                }).length >
                0) {
                    jg.data.TARGETS.forEach(function(r){
                        targetDiv.appendChild(div(span(jg.formatDisplayDate(r.STARTDTG, false, true) + ((r.STATUS == 'DONE') ? " [complete]" : " ")), br(), span({
                            onclick: function(){
                                var marks = jg.data.MARKS.find({
                                    GOALID: curGoal.ID,
                                    MARKDTG: {
                                        gte: r.STARTDTG
                                    }
                                }, jg.data.MARKS.find({
                                    GOALID: curGoal.ID,
                                    MARKDTG: {
                                        lte: r.ENDDTG
                                    }
                                }));
                                
                                $("#confirm").html("Are you sure you want to delete this target? This will change your point total by " + jg.data.MARKS.sum("POINTSEARNED", marks) + " points.<br><br>If your goals have changed you can create a new target which will be in effect from this day forward.");
                                
                                $("#confirm").dialog({
                                    bgiframe: true,
                                    resizable: false,
                                    width: 400,
                                    title: "Please confirm",
                                    modal: true,
                                    overlay: {
                                        backgroundColor: '#000',
                                        opacity: 0.5
                                    },
                                    close: function(){
                                        $(this).dialog('destroy');
                                    },
                                    buttons: {
                                        'Delete': function(){
                                            if (marks.length > 0) {
                                                jg.data.MARKS.update({
                                                    POINTSEARNED: 0,
                                                    TARGETHIT: ""
                                                }, marks);
                                            }
                                            
                                            jg.data.TARGETS.remove({
                                                ID: r.ID
                                            });
                                            $(this).dialog('destroy');
                                            $("#goalPop").dialog('close');
                                            jg.renderWorkArea();
                                        },
                                        Cancel: function(){
                                            $(this).dialog('destroy');
                                        }
                                    }
                                });
                            },
                            className: "clickableButton ui-state-default ui-corner-all"
                        }, "Delete"), (function(r){
                            var target = r.TARGETTYPE;
                            if (target == "daily_every") {
                                target = "every " + r.EVERY + " days";
                            }
                            if (jg.config.showPoints) {
                            
                            
                                switch (curGoal.GOALTYPE) {
                                    case "PLUS":
                                    case "SCORESHEET":
                                        return span("Target of " + r.AMOUNT + " with a reward of " + r.REWARD + " point" + ((r.RWARD == 1) ? " " : "s ") + "(" + target + ")")
                                        break;
                                    case "MINUS":
                                        return span("Penality of " + r.REWARD + " point" + ((r.RWARD == -1) ? " " : "s ") + "for every " + r.AMOUNT + " (" + target + ")")
                                        break;
                                }
                            }
                            else {
                                switch (curGoal.GOALTYPE) {
                                    case "PLUS":
                                    case "SCORESHEET":
                                        return span("Target of " + r.AMOUNT + " (" + target + ")");
                                        break;
                                    case "MINUS":
                                        return span("Target of less than " + r.AMOUNT + " (" + target + ")");
                                        break;
                                }
                            }
                            
                        })(r)));
                    }, {
                        GOALID: curGoal.ID
                    })
                    targetDiv.appendChild(div(span({
                        onclick: function(){
                            $("#goalPop").dialog('close');
                            jg.setTarget(curGoal.ID);
                        },
                        className: "clickableButton ui-state-default ui-corner-all"
                    }, "Set new target")))
                }
                else {
                    targetDiv.appendChild(span(span("You don't have a target yet. "), span({
                        onclick: function(){
                            $("#goalPop").dialog('close');
                            jg.setTarget(curGoal.ID);
                        },
                        className: "clickableButton ui-state-default ui-corner-all"
                    }, "Set one")));
                }
                
            }
            if (mode == "GOALS" && curGoal.GOALTYPE != "LOGBOOK") {
                printTargets();
            }
            else {
                $('#goalPop .currentTarget').empty();
            }
            $("#applytoowners").css("display", "none");
            displayName.attr("disabled", false);
            if (curGoal.SHARINGTYPE == 'GROUP' && curGoal.TEMPLATEID == "") {
                sharing.appendChild(option({
                    value: "GROUP"
                }, "Group: " +
                jg.data.GROUPS.first({
                    ID: curGoal.OWNERID
                }).DISPLAYNAME));
            }
            else 
                if (curGoal.TEMPLATEID != "") {
                
                    sharing.appendChild(option({
                        value: "GROUP"
                    }, "Group"));
                    if (mode == "GOALS" &&
                    jg.data.GROUPTEMPLATES.find({
                    
                        ID: curGoal.TEMPLATEID
                    }).length ==
                    0) {
                        displayName.attr("disabled", true);
                        ownTemplate = false;
                    }
                    else {
                        ownTemplate = true;
                        $("#applytoowners").css("display", "block");
                    }
                    
                }
                else {
                    jg.sys.SHARINGTYPE.forEach(function(r){
                        sharing.appendChild(option({
                            value: r.LOOKUPVALUE
                        }, r.LOOKUPDISPLAY));
                    })
                }
            $("#goalPop").get()[0].record = curGoal;
            displayName.val(curGoal.DISPLAYNAME);
            sharingType.val(curGoal.SHARINGTYPE);
            if (curGoal.SHARINGTYPE == 'FRIENDS_SELECT') {
                jg.printSelectFriends();
            }
            else {
                $("#listSelectFriends").css("display", "none").text("You can add another person to view this goals once you save it.");
            }
            var type = goalType.empty().get()[0];
            
            jg.sys.GOALTYPE.forEach(function(r){
                type.appendChild(option({
                    value: r.LOOKUPVALUE
                }, r.LOOKUPDISPLAY));
            }, {
                LOOKUPVALUE: curGoal.GOALTYPE
            })
            
            sharingType.get()[0].onChange(sharingType.get()[0]);
            
            $('#goalPop .slider').slider('option', 'value', curGoal.GOALPOINTS);
            initPop({
                buttons: {
                    'Save changes': function(){
                        var bValid = true;
                        allFields.removeClass('ui-state-error');
                        var days = [];
                        $(".dayselect .selected").each(function(){
                            days[days.length] = this.id;
                        })
                        days = days.join(",");
                        if (jg.isName(displayName.val())) {
                            if (mode == "GOALS") {
                                if (curGoal.TEMPLATEID != '' && ownTemplate) {
                                    jg.data.GROUPTEMPLATES.update({
                                        DISPLAYNAME: displayName.val(),
                                        APPLYTOOWNERS: applyToOwners.val()
                                    }, {
                                        ID: curGoal.TEMPLATEID
                                    });
                                }
                                else {
                                    jg.data.GOALS.update({
                                        DISPLAYNAME: displayName.val(),
                                        SHARINGTYPE: sharingType.val(),
                                        DAYS: days
                                    }, {
                                        ID: curGoal.ID
                                    });
                                }
                            }
                            else {
                                jg.data.GROUPTEMPLATES.update({
                                    DISPLAYNAME: displayName.val(),
                                    APPLYTOOWNERS: applyToOwners.val()
                                }, {
                                    ID: curGoal.ID
                                });
                                jg.refreshGoals();
                            }
                            $(this).dialog("destroy");
                            
                            jg.renderWorkArea();
                        }
                        else {
                            updateTips("Goal name contains invalid characters.");
                        }
                    },
                    'Delete': function(){
                        if ((mode == "GOALS" && curGoal.TEMPLATEID != '' && ownTemplate) || mode != "GOALS") {
                            $("#confirm").html("Are you sure you want to delete this group goal?<br><br> Deleting will leave the goal on member's personal trackers but remove it as a linked-group goal.");
                            
                            $("#confirm").dialog({
                                bgiframe: true,
                                resizable: false,
                                width: 400,
                                title: "Please confirm",
                                modal: true,
                                overlay: {
                                    backgroundColor: '#000',
                                    opacity: 0.5
                                },
                                close: function(){
                                    $(this).dialog('destroy');
                                },
                                buttons: {
                                    'Delete': function(){
                                        if (mode == "GOALS") {
                                            jg.data.GOALS.update({
                                                TEMPLATEID: ""
                                            }, {
                                                ID: curGoal.ID
                                            });
                                            jg.data.GROUPTEMPLATES.remove({
                                                ID: curGoal.TEMPLATEID
                                            });
                                        }
                                        else {
                                            jg.data.GOALS.update({
                                                TEMPLATEID: ""
                                            }, {
                                                TEMPLATEID: curGoal.ID
                                            });
                                            jg.data.GROUPTEMPLATES.remove({
                                                ID: curGoal.ID
                                            });
                                        }
                                        
                                        $(this).dialog('destroy');
                                        $("#goalPop").dialog('close');
                                        jg.renderWorkArea();
                                    },
                                    Cancel: function(){
                                        $(this).dialog('destroy');
                                    }
                                }
                            });
                            
                        }
                        else {
                            $("#confirm").html("Are you sure you want to delete this goal?");
                            
                            $("#confirm").dialog({
                                bgiframe: true,
                                resizable: false,
                                width: 400,
                                title: "Please confirm",
                                modal: true,
                                close: function(){
                                    $(this).dialog('destroy');
                                },
                                overlay: {
                                    backgroundColor: '#000',
                                    opacity: 0.5
                                },
                                buttons: {
                                    'Delete this goal': function(){
                                        jg.data.GOALS.remove({
                                            ID: curGoal.ID
                                        });
                                        $(this).dialog('destroy');
                                        $("#goalPop").dialog('close');
                                        jg.renderWorkArea();
                                    },
                                    Cancel: function(){
                                        $(this).dialog('destroy');
                                    }
                                }
                            });
                        }
                    },
                    Cancel: function(){
                        $(this).dialog("destroy");
                    }
                },
                title: "Edit Goal"
            });
            $('#goalPop').dialog('open');
        }
    },
    initTargetPop: function(){
        var tips = $("#targetPop .validateTips");
        var updateTips = function(t){
            tips.text(t).effect("highlight", {}, 1500);
        }
        var initPop = function(config){
            tips.empty();
            $("#targetPop").dialog(TAFFY.mergeObj({
                bgiframe: true,
                autoOpen: false,
                width: 500,
                modal: true,
                title: "Goal Target"
            }, config));
        }
        jg.setTarget = function(id, callback){
            var curGoal = jg.data.GOALS.first({
                ID: id
            });
            $("#targetForm").empty().html(jg.renderSetTarget(curGoal));
            var updowntarget = $("#targetPop .updowntarget"), target = $("#targetPop .target"), targettype = $("#targetPop .targettype"), reward = $("#targetPop .reward"), allFields = $([]).add(updowntarget).add(target).add(targettype).add(reward), tips = $("#targetPop .validateTips");
            
            initPop({
                title: "Set Target for " + curGoal.DISPLAYNAME,
                buttons: {
                    'Set': function(){
                        if (target.val().length > 0 && reward.val().length > 0 && jg.isNumber(target.val()) && jg.isNumber(reward.val()) && TAFFY.isNumeric(reward.val()) && TAFFY.isNumeric(target.val())) {
                        
                            $(this).dialog('destroy');
                            jg.data.TARGETS.update({
                                STATUS: "DONE",
                                ENDDTG: jg.formatDate(jg.subtractDays(jg.sys.curDate, 1))
                            }, {
                                GOALID: id,
                                STATUS: "OPEN",
                                ENDDTG: '2100-01-01'
                            });
                            var targetType = targettype.val();
                            var every = 0;
                            if (targetType.split(" ").length > 1) {
                                every = parseFloat(targetType.split(" ")[0]);
                                targetType = "daily_every";
                            }
                            jg.data.TARGETS.insert({
                                ID: jg.createID(),
                                GOALID: id,
                                UPDOWN: updowntarget.val(),
                                AMOUNT: parseFloat(target.val()),
                                TARGETTYPE: targetType,
                                REWARD: parseFloat((curGoal.GOALTYPE == 'MINUS') ? -reward.val() : reward.val()),
                                EVERY: every,
                                STATUS: "OPEN",
                                STARTDTG: jg.formatDate(jg.sys.curDate),
                                ENDDTG: '2100-01-01'
                            })
                            jg.renderWorkArea();
                            if (TAFFY.isFunction(callback)) {
                                callback();
                            }
                        }
                        else {
                            updateTips("Numeric values are required");
                        }
                    },
                    Cancel: function(){
                        $(this).dialog('destroy');
                    }
                }
            });
            $('#targetPop').dialog('open');
        }
    },
    initSettingsPop: function(){
    
        var initPop = function(config){
            $("#settingsPop").dialog(TAFFY.mergeObj({
                bgiframe: true,
                autoOpen: false,
                width: 600,
                modal: true,
                title: "Settings"
            }, config));
        }
        jg.openSettings = function(){
            $("#settingsPop").empty().html(form(fieldset(label("First Day of Week"), br(), select({
                name: "firstdayofweek",
                className: "firstdayofweek"
            }, option({
                value: 0
            }, "Sunday"), option({
                value: 1
            }, "Monday"), option({
                value: 2
            }, "Tuesday"), option({
                value: 3
            }, "Wednesday"), option({
                value: 4
            }, "Thursday"), option({
                value: 5
            }, "Friday"), option({
                value: 6
            }, "Saturday")), br(), br(), label("Navigate by:"), br(), select({
                name: "navigateby",
                className: "navigateby"
            }, option({
                value: "byday"
            }, "Day"), option({
                value: "byweek"
            }, "Week")))));
            
            $("#settingsPop .firstdayofweek").val(jg.config.firstDayOfWeek);
            $("#settingsPop .navigateby").val(jg.config.navigateBy);
            initPop({
                buttons: {
                    'Save': function(){
                        jg.config.firstDayOfWeek = $("#settingsPop .firstdayofweek").val();
                        jg.config.navigateBy = $("#settingsPop .navigateby").val();
                        var that = this;
                        $.post(jsonService, {
                            data: TAFFY.JSON.stringify(TAFFY.mergeObj({
                                action: "updateUserPrefs"
                            }, jg.config))
                        
                        }, function(data){
                            var result = TAFFY.JSON.parse(data);
                            if (result) {
                                jg.initDate();
                                jg.renderWorkArea();
                                $(that).dialog('destroy');
                            }
                            else {
                                alert("Unable to save prefs.");
                            }
                        });
                        
                    },
                    'Cancel': function(){
                        $(this).dialog('destroy');
                    }
                }
            });
            $('#settingsPop').dialog('open');
        }
    },
    initSharingPop: function(){
        $(function(){
            $("#sharingPopTabs").tabs({
                select: function(event, ui){
                    printGroups();
                }
            });
        });
        
        var removeMember = function(){
            jg.data.GROUPMEMBERS.remove({
                ID: this.parentNode.parentNode.id
            });
            printGroupMembers(this.parentNode.parentNode.parentNode.parentNode.id);
        }
        
        var printAddGroup = function(groupObj, error){
            var groupObj = groupObj ||
            {
                name: "",
                url: "",
                desc: "",
                access: "ANYONE",
                join: "ANYONE"
            };
            // Who can join this group?
            // Who can view group data?
            var error = error || "Create Group";
            $("#listGroups").empty().append(form(fieldset(span(error), br(), br(), div({
                className: "floatright join"
            }, label("Who can join this group?"), br(), select({
                style: {
                    width: "350px"
                },
                name: "join"
            }, option({
                value: "ANYONE"
            }, "Anyone."), option({
                value: "OWNERS"
            }, "Only those invited by group owner."))), label("Group Name:"), br(), input({
                type: "text",
                events: {
                    onKeyPress: jg.preventSubmit
                },
                name: "groupName",
                value: groupObj.name,
                style: {
                    width: "200px"
                },
                className: "groupName text ui-widget-content ui-corner-all"
            }), br(), br(), div({
                className: "floatright access"
            }, label("Who can see group data?"), br(), select({
                style: {
                    width: "350px"
                },
                name: "access"
            }, option({
                value: "ANYONE"
            }, "Anyone."), option({
                value: "MEMBERS"
            }, "Only members of this group."), option({
                value: "OWNERS"
            }, "Only owners and observers."))), label("Group URL:"), br(), input({
                type: "text",
                events: {
                    onKeyPress: jg.preventSubmit
                },
                name: "groupURL",
                value: groupObj.url,
                style: {
                    width: "200px"
                },
                className: "groupURL text ui-widget-content ui-corner-all"
            }), br(), br(), label("Group Desc:"), br(), input({
                type: "text",
                events: {
                    onKeyPress: jg.preventSubmit
                },
                name: "groupDesc",
                value: groupObj.desc,
                style: {
                    width: "200px"
                },
                className: "groupDesc text ui-widget-content ui-corner-all"
            }), br(), br(), span({
                onclick: function(){
                    if ($("#listGroups .groupName").val().length > 0) {
                        $(this).css("display", "none");
                        $("#listGroups fieldset").append(img({
                            src: jg.sys.ajaxloader
                        }));
                        $.post(jsonService, {
                            data: TAFFY.JSON.stringify({
                                action: "checkGroupName",
                                value: $("#listGroups .groupURL").val()
                            })
                        }, function(data){
                            var result = TAFFY.JSON.parse(data);
                            if (result == false || jg.isUsername($("#listGroups .groupURL").val()) == false) {
                                printAddGroup({
                                    name: $("#listGroups .groupName").val(),
                                    url: "",
                                    desc: $("#listGroups .groupDesc").val(),
                                    join: $("#listGroups .join select").val(),
                                    access: $("#listGroups .access select").val()
                                }, "URL Invalid or used by another group. Please try another.");
                            }
                            else 
                                if (jg.isName($("#listGroups .groupName").val()) == false) {
                                    printAddGroup({
                                        name: $("#listGroups .groupName").val(),
                                        url: $("#listGroups .groupURL").val(),
                                        desc: $("#listGroups .groupDesc").val(),
                                        join: $("#listGroups .join select").val(),
                                        access: $("#listGroups .access select").val()
                                    }, "The group name contains invalid characters.");
                                }
                                else {
                                    jg.data.GROUPS.insert({
                                        ID: jg.createID(),
                                        STATUS: "ACTIVE",
                                        GROUPTYPE: "TEAM",
                                        DISPLAYNAME: $("#listGroups .groupName").val(),
                                        VANITYURL: $("#listGroups .groupURL").val(),
                                        DISPLAYDESC: $("#listGroups .groupDesc").val(),
                                        WHOJOIN: $("#listGroups .join select").val(),
                                        WHOACCESS: $("#listGroups .access select").val()
                                    });
                                    printGroups();
                                }
                        });
                    }
                    
                },
                className: "clickableButton ui-state-default ui-corner-all"
            }, "Create Group"))));
            $("#listGroups .join select").get()[0].value = groupObj.join;
            $("#listGroups .access select").get()[0].value = groupObj.access;
        }
        
        var printGroups = function(){
            var listgroups = $("#listGroups").empty().get()[0];
            listgroups.appendChild(span("Groups"));
            listgroups.appendChild(span({
                onclick: function(){
                    printAddGroup();
                    
                },
                className: "clickableButton ui-state-default ui-corner-all"
            }, "Add"))
            listgroups.appendChild(br());
            listgroups.appendChild(br());
            var t = tbody();
            jg.data.GROUPS.forEach(function(r){
                t.appendChild(tr({
                    id: r.ID
                }, td(a({
                    href: groupURL + r.VANITYURL
                }, r.DISPLAYNAME)), td(span({
                    className: "clickableButton ui-state-default ui-corner-all",
                    onclick: printGroupMembers
                }, "Members")), td(span({
                    className: "clickableButton ui-state-default ui-corner-all",
                    onclick: printGoals
                }, "Add or Edit Goals")),td(span({
                    className: "clickableButton ui-state-default ui-corner-all",
                    onclick: printGroupTracker
                }, "Group Tracker"))));
            }, {
                GROUPTYPE: {
                    "!is": ["FRIENDS", "SHAREDGOAL"]
                }
            });
            
            
            
            listgroups.appendChild(table(t));
            listgroups.appendChild(br());
            listgroups.appendChild(br());
            var t = tbody();
            jg.data.MYGROUPS.forEach(function(r){
                t.appendChild(tr({
                    id: r.ID
                }, td(a({
                    href: groupURL + r.VANITYURL
                }, r.DISPLAYNAME)), td(span({
                    onclick: function(){
                        $("#confirm").html("Are you sure you want to leave this group goal?<br><br> Any group linked-goals will be left on your tracker but will no longer be visible to the group.");
                        
                        $("#confirm").dialog({
                            bgiframe: true,
                            resizable: false,
                            width: 400,
                            title: "Please confirm",
                            modal: true,
                            overlay: {
                                backgroundColor: '#000',
                                opacity: 0.5
                            },
                            close: function(){
                                $(this).dialog('destroy');
                            },
                            buttons: {
                                'Leave': function(){
                                    $.post(jsonService, {
                                        data: TAFFY.JSON.stringify({
                                            action: "leaveGroup",
                                            id: r.MEMBERID
                                        })
                                    }, function(data){
                                        jg.data.MYGROUPS.remove(r.MEMBERID);
                                        jg.refreshGoals();
                                    })
                                },
                                Cancel: function(){
                                    $(this).dialog('destroy');
                                }
                            }
                        });
                    },
                    className: "clickableButton ui-state-default ui-corner-all"
                }, "Leave Group"))));
            });
            listgroups.appendChild(table(t));
        }
        var updateMemberRole = function(){
            if (this.className != 'active') {
                jg.data.GROUPMEMBERS.update({
                    ROLE: this.value
                }, {
                    ID: this.parentNode.parentNode.id
                });
                
                printGroupMembers(this.parentNode.parentNode.parentNode.parentNode.id);
            }
        }
        
        
        
        var printRole = function(value, id){
            if (value == 'OWNER') {
                return td({
                    className: "linkselect"
                }, span({
                    value: "OWNER",
                    className: "active"
                }, "Owner"), span({
                    value: "MEMBER"
                }, "Member"), span({
                    value: "OBSERVER"
                }, "Observer"))
            }
            else 
                if (value == 'MEMBER') {
                    return td({
                        className: "linkselect"
                    }, span({
                        value: "OWNER"
                    }, "Owner"), span({
                        value: "MEMBER",
                        className: "active"
                    }, "Member"), span({
                        value: "OBSERVER"
                    }, "Observer"))
                }
                else 
                    if (value == 'OBSERVER') {
                        return td({
                            className: "linkselect"
                        }, span({
                            value: "OWNER"
                        }, "Owner"), span({
                            value: "MEMBER"
                        }, "Member"), span({
                            value: "OBSERVER",
                            className: "active"
                        }, "Observer"))
                    }
        }
        
        var printGroupMembers = function(id){
            if (!TAFFY.isString(id)) {
                var id = this.parentNode.parentNode.id
            }
            var group = jg.data.GROUPS.first({
                ID: id
            });
            var listgroups = $("#listGroups").empty().get()[0];
            listgroups.appendChild(div({className:"popback",onclick:printGroups},span({
                    className: "clickableButton ui-state-default ui-corner-all",
                    onclick: printGroupMembers
                }, "Back to groups")));
            listgroups.appendChild(jg.renderAddUser(function(){
                jg.addMemberToGroup($("#listGroups .username").val(), id, "MEMBER", function(status){
                    if (status == false) {
                        alert("Unable to add " + $("#listGroups .username").val() + " to group.")
                    }
                    else {
                        printGroupMembers(id);
                    }
                    
                });
                
            }, "Add"));
            
            
            listgroups.appendChild(span(group.DISPLAYNAME + " : Members"));
            listgroups.appendChild(br());
            listgroups.appendChild(br());
            var t = tbody();
            jg.data.GROUPMEMBERS.forEach(function(r){
                t.appendChild(tr({
                    id: r.ID
                }, td(a({
                    href: userURL + r.USERNAME
                }, r.USERNAME)), printRole(r.ROLE), td(span({
                    onclick: removeMember,
                    className: "clickableButton ui-state-default ui-corner-all"
                }, "Remove"))));
            }, {
                GROUPID: id
            });
            listgroups.appendChild(table({
                id: id,
                className:"GroupMembers"
            }, t));
            $(".linkselect span").click(updateMemberRole);
        }
        
        var printGoals = function(id){
            if (!TAFFY.isString(id)) {
                var id = this.parentNode.parentNode.id
            }
            var listgroups = $("#listGroups").empty().get()[0];
            
            var group = jg.data.GROUPS.first({
                ID: id
            });
            listgroups.appendChild(div({className:"popback",onclick:printGroups},span({
                    className: "clickableButton ui-state-default ui-corner-all",
                    onclick: printGroupMembers
                }, "Back to groups")));
            listgroups.appendChild(span(group.DISPLAYNAME + " : Goals"));
            listgroups.appendChild(br());
            listgroups.appendChild(br());
            listgroups.appendChild(table(tbody(tr(td(span({
                onclick: function(){
                    jg.createGoal(function(){
                        printGoals(group.ID);
                    }, group.ID, true);
                },
                className: "clickableButton ui-state-default ui-corner-all"
            }, "Add Team Goal"))))));
            var t = tbody();
            jg.data.GROUPTEMPLATES.forEach(function(r){
                t.appendChild(tr({
                    record: r
                }, td(r.DISPLAYNAME), td(r.GOALTYPE), td(span({
                    className: "clickableButton ui-state-default ui-corner-all",
                    onclick: function(){
                        jg.editGoal(r.ID, "GROUPTEMPLATES");
                    }
                }, "Edit"))));
            }, {
                GROUPID: id
            });
            listgroups.appendChild(table({
                id: id
            }, t));
            //listgroups.appendChild(br());
            //listgroups.appendChild(br());
            //listgroups.appendChild(table(tbody(tr(td({groupid:group.ID,onclick:jg.createGoal},"Add Team Goal")))));
            var t = tbody();
            jg.data.GOALS.forEach(function(r){
                t.appendChild(tr({
                    record: r
                }, td(r.DISPLAYNAME), td(r.GOALTYPE), td({
                    onclick: jg.editGoal
                }, "Edit")));
            }, {
                OWNERID: id
            });
            listgroups.appendChild(table({
                id: id
            }, t));
            
        }
        
        var printGroupTracker = function(id){
            if (!TAFFY.isString(id)) {
                var id = this.parentNode.parentNode.id
            }
            var listgroups = $("#listGroups").empty().get()[0];
            
            var group = jg.data.GROUPS.first({
                ID: id
            });
            listgroups.appendChild(div({className:"popback",onclick:printGroups},span({
                    className: "clickableButton ui-state-default ui-corner-all",
                    onclick: printGroupMembers
                }, "Back to groups")));
            listgroups.appendChild(span(group.DISPLAYNAME + " : Group Tracker"));
            listgroups.appendChild(br());
            listgroups.appendChild(br());
            listgroups.appendChild(iframe({width:"100%",height:350,src:groupURL + group.VANITYURL}))
            
        }
        
        
        var initPop = function(config){
            $("#sharingPopTabs").tabs('select', 0);
            $("#sharingPop").dialog(TAFFY.mergeObj({
                bgiframe: true,
                autoOpen: false,
                width: "80%",
                modal: true,
                title: (jg.config.friendsMode == "FRIENDS") ? "Friends and Groups" : "People and Groups"
            }, config));
            var listfriends = $("#listFriends").empty().get()[0];
            listfriends.appendChild(jg.renderAddUser(function(){
                if ($("#listFriends .username").val().length > 0) {
                
                    jg.addMemberToGroup($("#friends .username").val(), jg.data.GROUPS.first({
                        GROUPTYPE: "FRIENDS"
                    }).ID, "OBSERVER", function(result){
                        if (result) {
                            initPop();
                            printGroupMembers(jg.data.GROUPS.first({
                                GROUPTYPE: "FRIENDS"
                            }).ID);
                        }
                        else {
                            alert("Unable to add " + $("#friends .username").val());
                        }
                    });
                    
                    
                }
                else {
                
                }
                
            }, "Add User"));
            
            var friendedYou = [];
            jg.data.FRIENDEDYOU.forEach(function(r){
                friendedYou[friendedYou.length] = r.USERNAME;
            });
            
            listFriends.appendChild(span("Mutual Connections"));
            listFriends.appendChild(br());
            listFriends.appendChild(br());
            
            listFriends.appendChild(jg.renderMemberList({
                USERNAME: friendedYou,
                GROUPID: jg.data.GROUPS.first({
                    GROUPTYPE: "FRIENDS"
                }).ID
            }, "FRIENDS", initPop));
            listFriends.appendChild(br());
            listFriends.appendChild(br());
            listFriends.appendChild(span("People you've added"));
            listFriends.appendChild(br());
            listFriends.appendChild(br());
            
            listFriends.appendChild(jg.renderMemberList({
                USERNAME: {
                    "!is": friendedYou
                },
                GROUPID: jg.data.GROUPS.first({
                    GROUPTYPE: "FRIENDS"
                }).ID
            }, "FRIENDS", initPop));
            
            listFriends.appendChild(br());
            listFriends.appendChild(br());
            listFriends.appendChild(span("People who've added you"));
            listFriends.appendChild(br());
            listFriends.appendChild(br());
            
            var alreadyListed = [];
            jg.data.GROUPMEMBERS.forEach(function(r){
                alreadyListed[alreadyListed.length] = r.USERNAME;
            }, {
                USERNAME: friendedYou,
                GROUPID: jg.data.GROUPS.first({
                    GROUPTYPE: "FRIENDS"
                }).ID
            });
            
            listFriends.appendChild(jg.renderMemberList({
                USERNAME: {
                    "!is": alreadyListed
                }
            }, "FRIENDEDYOU", initPop));
            listFriends.appendChild(br());
            listFriends.appendChild(br());
            printGroups();
        }
        
        jg.openSharingPop = function(){
            initPop({});
            $('#sharingPop').dialog('open');
        }
        
    },
    renderMemberList: function(filter, type, removeCallback){
        var t = tbody();
        jg.data[(type == 'FRIENDEDYOU') ? "FRIENDEDYOU" : "GROUPMEMBERS"].forEach(function(r){
            t.appendChild(tr(td(a({
                href: userURL + r.USERNAME
            }, r.USERNAME)), td(span({
                className: "clickableButton ui-state-default ui-corner-all",
                onclick: function(){
                    jg.data[(type == 'FRIENDEDYOU') ? "FRIENDEDYOU" : "GROUPMEMBERS"].remove({
                        ID: r.ID
                    });
                    removeCallback();
                }
            }, "Remove"))))
        }, filter);
        return table(t);
    },
    renderAddUser: function(callback, button){
        var button = button || "Add";
        return form({
            onsubmit: function(){
            
                return false;
            }
        }, fieldset(label({
            "for": "username"
        }, "Username"), input({
            type: "text",
            events: {
                onKeyPress: jg.preventSubmit
            },
            name: "username",
            className: "username text ui-widget-content ui-corner-all"
        }), input({
            onclick: callback,
            type: "button",
            "value": button
        })));
        
    },
    addMemberToGroup: function(username, groupid, role, callback){
        var callback = callback ||
        function(status){
            if (status == false) {
                alert("Unable to add " + username + " to group.")
            }
        }
        if (jg.isUsername(username)) {
            $.post(jsonService, {
                data: TAFFY.JSON.stringify({
                    action: "checkUserAndGroup",
                    username: username,
                    groupid: groupid
                })
            }, function(data){
                var result = TAFFY.JSON.parse(data);
                if (result) {
                    jg.data.GROUPMEMBERS.insert({
                        USERNAME: username,
                        ID: jg.createID(),
                        ROLE: role,
                        GROUPID: groupid,
                        STATUS: "Pending"
                    });
                }
                callback(result);
            });
        }
        else {
            callback(false);
        }
    },
    renderSetTarget: function(curGoal){
    
        switch (curGoal.GOALTYPE) {
            case "PLUS":
                return form(fieldset(span("My goal is to record at least "), input({
                    type: "hidden",
                    name: "UPDOWNTARGET",
                    className: "updowntarget",
                    value: "atleast"
                }), input({
                    type: "text",
                    events: {
                        onKeyPress: jg.preventSubmit
                    },
                    name: "target",
                    style: {
                        width: "50px"
                    },
                    className: "target text ui-widget-content ui-corner-all"
                }), span(" checks every "), (function(){
                    var s = select({
                        name: "TARGETTYPE",
                        className: "targettype"
                    });
                    
                    
                    return s;
                })(), span((jg.config.showPoints) ? span(span(" and my reward will be "), input({
                    type: "text",
                    events: {
                        onKeyPress: jg.preventSubmit
                    },
                    name: "reward",
                    style: {
                        width: "50px"
                    },
                    className: "reward text ui-widget-content ui-corner-all"
                }), span(" points.")) : span(span("."), input({
                    type: "hidden",
                    name: "reward",
                    value: 0,
                    className: "reward"
                })))));
                break;
            case "MINUS":
                return form(fieldset(span("My goal is to record fewer than "), input({
                    type: "hidden",
                    name: "UPDOWNTARGET",
                    className: "updowntarget",
                    value: "atleast"
                }), input({
                    type: "text",
                    events: {
                        onKeyPress: jg.preventSubmit
                    },
                    name: "target",
                    style: {
                        width: "50px"
                    },
                    className: "target text ui-widget-content ui-corner-all"
                }), span(" checks over the course of a "), (function(){
                    var s = select({
                        name: "TARGETTYPE",
                        className: "targettype"
                    });
                    jg.sys.TARGETTYPE.forEach(function(r){
                        if (r.LOOKUPDISPLAY == "X Days") {
                            for (var x = 2; x < jg.sys.everyxdays; x++) {
                                s.appendChild(option({
                                    value: x + " Days"
                                }, x + " Days"));
                            }
                        }
                        else {
                            s.appendChild(option({
                                value: r.LOOKUPVALUE
                            }, r.LOOKUPDISPLAY));
                        }
                        
                    })
                    return s;
                })(), span((jg.config.showPoints) ? span(span(" and my penality for recording too many will be negative "), input({
                    type: "text",
                    events: {
                        onKeyPress: jg.preventSubmit
                    },
                    name: "reward",
                    style: {
                        width: "50px"
                    },
                    className: "reward text ui-widget-content ui-corner-all"
                }), span(" points.")) : span(span("."), input({
                    type: "hidden",
                    name: "reward",
                    value: 0,
                    className: "reward"
                })))));
                break;
            case "SCORESHEET":
                return form(fieldset(span("My goal is to record "), input({
                    type: "hidden",
                    name: "UPDOWNTARGET",
                    className: "updowntarget",
                    value: "atleast"
                }), input({
                    type: "text",
                    events: {
                        onKeyPress: jg.preventSubmit
                    },
                    name: "target",
                    style: {
                        width: "50px"
                    },
                    className: "target text ui-widget-content ui-corner-all"
                }), span(" or more over the course of a "), (function(){
                    var s = select({
                        name: "TARGETTYPE",
                        className: "targettype"
                    });
                    jg.sys.TARGETTYPE.forEach(function(r){
                        if (r.LOOKUPDISPLAY == "X Days") {
                            for (var x = 2; x < jg.sys.everyxdays; x++) {
                                s.appendChild(option({
                                    value: x + " Days"
                                }, x + " Days"));
                            }
                        }
                        else {
                            s.appendChild(option({
                                value: r.LOOKUPVALUE
                            }, r.LOOKUPDISPLAY));
                        }
                        
                    })
                    return s;
                })(), span((jg.config.showPoints) ? span(span(" and my reward will be "), input({
                    type: "text",
                    name: "reward",
                    events: {
                        onKeyPress: jg.preventSubmit
                    },
                    style: {
                        width: "50px"
                    },
                    className: "reward text ui-widget-content ui-corner-all"
                }), span(" points.")) : span(span("."), input({
                    type: "hidden",
                    name: "reward",
                    value: 0,
                    className: "reward"
                })))));
                break;
        }
        
        
    }
};

// define onload
$(document).ready(jg.init);

