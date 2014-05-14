/*
 * 
 * Joins on paper;
 * 
 * projects.join("tasks","activeTasks").on({id:"id",status:"active"});
 * projects.join("tasks","inactiveTasks").on({id:"id",status:"inactive"});
 * 
 * projects.query({id:id}).activeTasks.forEach(function (r) {});
 * 
 * 
 * /// since projects is joined with tasks you can use query, 
 * query returns an collection of methods containing any and call joined collections. The join collections in
 * turn have metthods. query().[collectin].forEach() is like a standard  
 * 
 * 
 * 
 * config notes:
 * userconfig: {
 * 		showPoints:true|false,
 *      minPoints:0,
 *      
 * }
 * 
 * projectconfig: {
 *      showPoints:true|false,
 *      minPoints:0,
 *      chirpSize:140,
 *      protectMileStones:true|false,
 *      showSchedule:true|false,
 *      protectSettings:true|false,
 *      team:TAFFY([
 *      	{userid:"don123",access:"read|readwrite",username:"DMITH",fullname:"Don Smith"},
 *      	{userid:"h123",access:"read|readwrite",username:"HSMITH",fullname:"Heather Smith"}
 *      ])
 * }
 * 
 * send to server packet:
 * {project:"p1",userid:"ian123",action:"get|store|sync",lastSync:DTG,packet:[
 * 	{syncStatus:"update",taskID:"whatever",quickList:"qlid",row:"12",etc},
 *  {syncStatus:"delete",taskID:"whatever"},
 *  {syncStatus:"new",taskID:"whatever",quickList:"qlid",row:"12",etc}
 *  
 * ]}
 * 
 * back from server:
 * {project:"pi",responseStatus:"success|failure",message:"optional,used in failure perhaps",lastSync:server DTG,packet:[
 * 	  // the packet would contain updates to run against the local store before a reprint
 *   {syncStatus:"update",taskID:"whatever",quickList:"qlid",row:"12",etc},
 *   {syncStatus:"new",taskID:"whatever",quickList:"qlid",row:"12",etc},
 *   {syncStatus:"delete",taskID:"whatever"}
 * ]}
 * 
 * If on any request the lastSync DTG is older than the current update DTG on the project the changes are returned to the server.
 * 
 *  Table structure:
 *  
 *  company:
 *     name:dashlist || quotewizard || etc
 *     avaibaleAccounts: 50 || 100000
 *     
 *  
 *  login:
 *     loginID
 *     company
 *     fullname
 *     etc
 *     
 *  email
 *     loginID
 *     email address
 *     status
 *     etc
 *     
 *  project
 *     id
 *     name
 *     read access level: private || shared || entire company || piublic
 *     config
 *     etc
 *  
 *  project2login
 *     projectid
 *     loginid
 *     access_level
 *     config
 *     position
 *  
 *  quickLists
 *     id
 *     name
 *     projectid
 *     
 *  task
 *     id
 *     createDTG
 *     updateDTG
 *     title
 *     quicklist
 *     complete
 *     packet
 *     
 *  chirps
 *     id
 *     userid
 *     taskid
 *     chirp
 *     packet
 *  
 *  syncs // only for shared projects and cleared every hour or so
 *     projectid
 *     dtg
 *     packet
 *
 * 
 */



var dash = {
	dragdrop:{},
	sys: {
		curDate: null,
		loadDate: null,
		addnew: "",
		allowChangeProject:true,
		ickr:false
	},
	config: {},
	data: {
		projects: TAFFY([]),
		tasks: TAFFY([]),
		quickLists: TAFFY([])
	},
	init: function(){
		dash.data.tasks.config.set("template",{checked:false,row:0,points:1});
		dash.data.projects.config.set("template",{stats:{points:0,completes:0},row:0,selected:false,defaultPoints:1});
		dash.data.quickLists.config.set("template",{row:0});
		dash.sys.curDate = new Date();
		dash.sys.loadDate = dash.sys.curDate;
		dash.config.client = dash.createID();

		$("#addTaskButton").keyup(dash.checkIfEnter);
		$("#searchButton").keyup(dash.checkIfEnter);
		$(function() {
		
		
		/*
		.hover(
			function(){ 
				$(this).addClass("ui-state-hover"); 
			},
			function(){ 
				$(this).removeClass("ui-state-hover"); 
			}
		).mousedown(function(){
			$(this).addClass("ui-state-active"); 
		})
		.mouseup(function(){
				$(this).removeClass("ui-state-active");
		});*/
		dash.initProjectPop();
		dash.initQuickListPop();
		dash.initTaskPop();
		
		dash.renderProjects();
		dash.changeProject(dash.data.projects.first().id);
		
	});
		
	},
		readWorkArea: function () {

		var doRerender = false;

		// Read In qls
		var quickLists = $(".qlHolder")[0];
			if (quickLists) {
				var row = 0;
				var child = quickLists.firstChild;
				while (child) {
					if (!TAFFY.isUndefined(child.qlindex)) {
						if (child.firstChild.row != row) {
							child.firstChild.row == row;
							dash.data.quickLists.update({
								row: row
							}, {
								id: child.firstChild.qlid
							});
						}
						row++;
					}
					else 
						if ($(child).hasClass("ql") && !$(child).hasClass("emptyql")) {
							if (child.firstChild && child.firstChild.firstChild && child.firstChild.firstChild.nextSibling && child.firstChild.firstChild.nextSibling.firstChild && child.firstChild.firstChild.nextSibling.firstChild.className == "task") {
								
								var newql = dash.addQuickList("Untitled", dash.sys.activeProject.id, row);
								child.qlIndex = row;
								child.firstChild.firstChild.nextSibling.id = newql.id;
								row++;
								doRerender = true;
							}
							else {
								removeChildrenFromNode(child);
								child.className = "ql ui-corner-all emptyql";
								child.appendChild(div(span("Untitled"),ul({className:"quickList"})));
								
							}
						}
					child = child.nextSibling;
				}
				dash.data.quickLists.orderBy(["project", "row"]);
			}
		// Read In Tasks
		var holders = $(".quickList");
		
		for (var list = 0; list < holders.length; list++) {
			holders[list].className = "quickList empty";
			var row = 0;
			var child = holders[list].firstChild;
			while (child) {
				if (!TAFFY.isUndefined(child.record)) {
					holders[list].className = "quickList";
					if (child.record.row != row || child.record.quickList != holders[list].id) {
						dash.data.tasks.update({
							row: row,
							quickList: holders[list].id
						}, {
							id: child.record.id
						});
						child.record.row = row;
						child.record.holder = holders[list].id;
					} 
					row++;
					
				}
				
				child = child.nextSibling;
			}
		}
		dash.data.tasks.orderBy(["quickList", "row"]);
		
		// Read In Projects
		$("#projects ul li").each(
			function (index,el) {
				if (!TAFFY.isUndefined(el.record)) {
					if (el.record.row != index) {
						dash.data.projects.update({
							row: index
						}, {
							id: el.record.id
						});
					}
				}
			}
		);
		dash.data.projects.orderBy(["row"]);
		if (doRerender) {
			dash.renderWorkArea();	
		}
		
	},
	checkIfEnter:function (v,field) {

		if (v.keyCode == 13) {
			if (field) {
				document.forms[0].task.value = dash.left(document.forms[0].task.value, document.forms[0].task.value.length);
				if ($(".used")[0].value == "Add Task") {
					dash.addTask();
				}
				else {
					dash.search();
				}
			}
			else {
				if (this.value == 'Add Task') {
					dash.addTask();
				}
				else {
					dash.search();
				}
			}
			
			return false;
		}
		
		return dash.limit(v,document.forms[0].task,dash.config.taskSize,document.getElementById("qLimit"));
	},
	emptyTrash:function () {
		dash.data.tasks.remove({quickList:dash.config.userid+"trash"});
		dash.renderTrash();
	},
	changeProject: function(id){
		if (dash.sys.allowChangeProject) {
		
		
			var clickedProject = this.id || id;
			if (dash.data.projects.find({
				id: clickedProject,
				selected: false
			}).length >
			0) {
				dash.data.projects.update({
					selected: false
				}, {
					selected: true
				});
				dash.data.projects.update({
					selected: true
				}, {
					id: clickedProject
				});
				dash.config.taskSize = dash.data.projects.first({id: clickedProject}).taskSize
				dash.renderProjects();
				dash.renderWorkArea();
			}
		}
	},
	checkTask: function(s){
	  var animatePoints = function (val,that) {
	  $("#showPoints").get()[0].innerHTML = val;
	  
	  var postion = $(that.parentNode).position();
	  $("#showPoints").css({top:postion.top,left:postion.left,position:"absolute"});
	  
	  $("#showPoints").animate({ 
        width: "70%",
        opacity: 0.3,
		display:"block",
        marginTop: "-0.5in",
        marginLeft: "-0.3in",
		fontSize: "3em", 
      }, 600, function () { $("#showPoints").animate({opacity:0},200,function () {
	  	$("#showPoints").css({marginTop:0,marginLeft:0,fontSize:".6em",display:"none"});
	  })} );
	  }
	  
	
		if (!s) {
			var that = this;
			setTimeout(function () {dash.checkTask.apply(that, [true])},500);
		}
		else {
			
			var clickedTask = dash.data.tasks.first({id:this.parentNode.record.id});
			
		
			if (dash.data.tasks.find({
				id: clickedTask.id,
				checked: false
			}).length >
			0) {
				animatePoints(clickedTask.points,this);
				dash.addPoints(clickedTask.points);
				
				$(this.parentNode).addClass("complete");
				dash.data.tasks.update({
					checked: true
				}, {
					id: clickedTask.id
				});
				if (this.parentNode.parentNode.parentNode.parentNode.firstChild.innerHTML == "Past Due") 
				{
					dash.renderWorkArea();
				}
			}
			else {
				animatePoints(-clickedTask.points,this);
				dash.subtractPoints(clickedTask.points);
				
				$(this.parentNode).removeClass("complete");
				dash.data.tasks.update({
					checked: false
				}, {
					id: clickedTask.id
				});
			}
			dash.data.projects.update({stats:dash.sys.activeProject.stats},{id:dash.sys.activeProject.id});
		}
		//dash.renderWorkArea();
		
	},
	addTask:function (task2add,details) {
		$(".used").removeClass("used");
		document.getElementById("addTaskButton").className = "used";

		var taskText = task2add || document.forms.taskForm.task.value;
		if (taskText != "") {
			var quickList = $(".addnewhere");
			if (quickList.get().length > 0) {
				quickList = dash.sys.addnew;
			} else if (dash.sys.activeProject.showSchedule) {
				quickList = (dash.sys.activeProject.showSchedule) ? dash.formatDate(dash.sys.curDate) + "_" + dash.sys.activeProject.id : dash.data.quickLists.first({
					project: dash.sys.activeProject.id
				}).id;
			} else if (dash.data.quickLists.find({projectid:dash.sys.activeProject.id}).length > 0) {
				quickList = dash.data.quickLists.first({project:dash.sys.activeProject.id}).id;
			} else {
				quickList = dash.getProjectInbox();
			}
			if (details) {
				dash.data.tasks.insert(TAFFY.mergeObj({
				quickList: quickList,
				title: taskText,
				id: dash.createID()
				},details));
			} else {
				dash.data.tasks.insert({
				quickList: quickList,
				title: taskText,
				id: dash.createID(),
				points :dash.sys.activeProject.defaultPoints
				});
			}
			
			document.forms.taskForm.task.value = "";
			document.forms[0].task.focus();
			dash.renderWorkArea();
		} else {
			dash.createTask();
		}
	},
	addQuickList:function (title,projectID,row) {
		var row = row || 0;
		var projectID = projectID || dash.data.projects.first({
			selected: true
		}).id
		var title = title || "Untitled";
		var projectID = projectID || dash.data.projects.first({selected:true}).id;
		var newRecord = {id:dash.createID(),title:title,project:projectID,row:row};
		dash.data.quickLists.insert(newRecord);
		return newRecord;
	},
	selectQuickList:function () {
		var selected = $(".addnewhere");
		for(var x = 0;x<selected.length;x++) {
			$(selected[x]).removeClass("addnewhere");
		}
		dash.sys.addnew = this.nextSibling.id;
		
		$((this.className == 'qlLabel') ? this.parentNode.parentNode : this.parentNode).addClass("addnewhere");
	},
	getProjectInbox:function (projectID) {
		var inbox = dash.data.quickLists.first({project:projectID,title:"Inbox"});
		if (!inbox) {
			inbox = dash.addQuickList("Inbox",projectID)
		} 
		return inbox.id;
	},
	addPoints:function (points,projectid) {
		if (projectid) {
			var curProject = dash.data.projects.first({id:projectid});
			curProject.stats.points = curProject.points+points;
			curProject.stats.completes = curProject.completes+1;
			dash.data.projects.update({stats:curProject.stats},{id:projectid});
			
		} else {
			dash.sys.activeProject.stats.points = dash.sys.activeProject.stats.points+points;
			dash.sys.activeProject.stats.completes = dash.sys.activeProject.stats.completes+1;
			dash.data.projects.update({stats:dash.sys.activeProject.stats},{id:dash.sys.activeProject.id});
			dash.renderStats();
		}
	},
	subtractPoints:function (points,projectid) {
		if (projectid) {
			var curProject = dash.data.projects.first({id:projectid});
			curProject.stats.points = curProject.points-points;
			curProject.stats.completes = curProject.completes-1;
			dash.data.projects.update({stats:curProject.stats},{id:projectid});
			
		} else {
			dash.sys.activeProject.stats.points = dash.sys.activeProject.stats.points-points;
			dash.sys.activeProject.stats.completes = dash.sys.activeProject.stats.completes-1;
			dash.data.projects.update({stats:dash.sys.activeProject.stats},{id:dash.sys.activeProject.id});
			dash.renderStats();
		}
	},
	send2trash: function (taskID) {
		var task = dash.data.tasks.first({id:taskID});
		
		dash.data.tasks.update({quickList:dash.config.userid + "trash"},{id:taskID});
		
		dash.subtractPoints(task.points);
	},
	send2project: function (taskID,projectID) {
		
		var task = dash.data.tasks.first({id:taskID});
		
		var currentQuickList = dash.data.tasks.first({id:task.quickList});
		
		var project = dash.data.projects.first({id:projectID});
		if (task.checked) {
			dash.subtractPoints(task.points);
			dash.addPoints(task.points,projectID);
		}
		var quickList = "";
		if (project.alwaysSendToInbox) {
			quickList = dash.getProjectInbox(projectID);
		} else {
			if (task.quickList.split("_").length = 2) {
				if (project.showSchedule) {
					quickList = task.quickList.split("_")[0] + "_" + projectID;
				} else {
					quickList = dash.getProjectInbox(projectID);
				}
			} else {
				var similarQuickList = dash.data.quickLists.first({
					project: projectID,
					title: currentQuickList.title
				});
				if (similarQuickList) {
					quickList = similarQuickList.id;
				} else {
					quickList = dash.getProjectInbox(projectID);
				}
			}
		}
		dash.data.tasks.update({quickList:quickList},{id:taskID});
	},
	
	renderTask:function (r) {
		var c = input({type:"checkbox",events: {
					onclick: dash.checkTask
				}});
		c.checked = r.checked;
		return li({
				record: r,
				className: (r.checked) ? "task complete" : "task"
			}, c, span(dash.left(r.title,dash.config.taskSize)  + ((r.title.length > dash.config.taskSize) ? "..." : "")));
	},
	renderProjects: function(){
		var el = document.getElementById("projects");
		removeChildrenFromNode(el);
		var list = ul();
		dash.data.projects.forEach(function(r){
			list.appendChild(li({
				id: r.id,
				className:"project",
				record:r,
				events: {
					onclick: dash.changeProject
				},
				style: {
					color: ((r.selected) ? "blue" : "black")
				}
			}, r.title))
		});
		list.appendChild(li({
				className:"trash",
				id:"trashbin",
				events: {
					onclick: dash.renderTrash
				}
			}, "Trash Bin"))
		el.appendChild(div(div({onclick:function () {dash.createProject();},id:"addProject"},"Add Project"),list));
		dash.applyDragDrop("projects");
		
	},
	renderQuickList: function(listfilter,options){
		var options = TAFFY.mergeObj(TAFFY.isObject(options) ? options : {},{
			dropable:true,
			onlyIncomplete:false
		});
		var filter = {
			quickList: listfilter
		};
		var list = ul({className:"quickList empty",id:listfilter});
		dash.data.tasks.forEach(function(r){
			list.appendChild(dash.renderTask(r));
			list.className="quickList";
		}, filter);
		return list;
	},
	renderTrash:function () {
		dash.data.projects.update({selected:false});
		dash.renderProjects();
		
		var el = dash.getCleanWorkArea();
		el.appendChild(div({events:{onclick:dash.emptyTrash}},"Empty Trash"));
		
		var list = ul();
		list.appendChild(dash.renderQuickList(dash.config.userid+"trash"));
		el.appendChild(list);
		document.getElementById("trashbin").style.color = "blue";
		
		dash.applyDragDrop("tasks");
	},
	search:function () {
		var el = dash.getCleanWorkArea();
		
		$(".used").removeClass("used");
		
		document.getElementById("searchButton").className = "used";
		

		var searchText = document.forms.taskForm.task.value;
		
	
		var quickListArray = [];
		dash.data.quickLists.forEach(function (r) {quickListArray[quickListArray.length] = r.id},{project:dash.sys.activeProject.id});
		dash.data.tasks.forEach(function (r) {
			quickListArray[quickListArray.length] = r.quickList;
		},{quickList:{ends:"_"+dash.sys.activeProject.id}});
		quickListArray = TAFFY.gatherUniques(quickListArray);
		var foundrecords = TAFFY(dash.data.tasks.get({title:{containsWord:searchText},quickList:quickListArray}));
		var list = ul();
		foundrecords.forEach(function (r) {
			if (r.quickList.split("_").length == 2) {
				r.quickListGroup = dash.formatDisplayDate(r.quickList.split("_")[0]);
			} else {
				r.quickListGroup = dash.data.quickLists.first({id:r.quickList}).title;
			}
			return r;
		});
		foundrecords.forEach(function (r,index) {
			list.appendChild(li(span({className:"clickable"},dash.sys.activeProject.title + ": " + r.quickListGroup)));
			list.appendChild(dash.renderTask(r));
		});
		el.appendChild(div({style:{width:"500px"}},list));
		document.forms[0].task.focus();
	},
	renderSchedule: function(projectid){
	
		var scheduleTableRow = tr();
		var scheduleSize = dash.config.scheduleSize;
		
		var days = dash.generateScheduleDays(dash.sys.curDate, scheduleSize);
		for (x = 0; x < days.length; x++) {
			scheduleTableRow.appendChild(td({
				vAlign:"top"
			}, div({className: "scheduleday ui-corner-all"},span({events:{onclick:dash.selectQuickList}},dash.formatDisplayDate(days[x])), dash.renderQuickList(days[x] + "_" + projectid,days[x] + "_" + projectid))));
		}
		
		return div(div(span({events:{onclick:dash.renderLastDay}},"last"),span({events:{onclick:dash.renderNextDay}},"next")),br(),table(tbody(scheduleTableRow)));
	},
	renderPastDue:function (projectid) {
		var pastDueRange = dash.generateScheduleDays(dash.subtractDays(dash.sys.curDate, 60), 59);
			for (var x = 0; x < pastDueRange.length; x++) {
				pastDueRange[x] = pastDueRange[x] + "_" + projectid;
			}
			var pastDue = dash.data.tasks.get({
				quickList: pastDueRange,
				checked:false
			});
			if (pastDue.length > 0) {
				var pastDueQLs = [];
				for(var x = 0;x< pastDue.length;x++) {
					pastDueQLs[pastDueQLs.length] = pastDue[x].quickList;
				}
				pastDueQLs = TAFFY.gatherUniques(pastDueQLs);
				var pastDueDIV = div({
					className: "quicklist pastdue"
				}, span("Past Due"));
				
				for(var x = 0;x< pastDueQLs.length;x++) {
				pastDueDIV.appendChild(div({
			}, span(dash.formatDisplayDate(pastDueQLs[x].split("_")[0])),dash.renderQuickList(pastDueQLs[x])));
				}
				
				return pastDueDIV;
			} else {
				return false;
			};
			
	},
	renderNextDay:function () {
		dash.sys.curDate = dash.addDays(dash.sys.curDate,1);
		dash.renderWorkArea();
	},
	renderLastDay:function () {
		dash.sys.curDate = dash.subtractDays(dash.sys.curDate,1);
		dash.renderWorkArea();
	},
	renderStats:function (returnStats) {
		var stats = "Points: " + dash.sys.activeProject.stats.points + " Complete: " + dash.sys.activeProject.stats.completes;
		
		if (returnStats) {
			return stats;
		} else {
			$("#stats").html(stats);
		}
	},
	renderWorkArea: function(){
		var el = document.getElementById("workarea");
		dash.sys.activeProject = dash.data.projects.first({
			selected: true
		});
		removeChildrenFromNode(el);
		el.appendChild(div({id:"stats"},dash.renderStats(true)));
		el.appendChild(span({record:dash.sys.activeProject,id:"projectSettings"},"Project Settings"));
		el.appendChild(br());
		
		el.appendChild(br());
		if (dash.sys.activeProject.showSchedule) {
			el.appendChild(dash.renderSchedule(dash.sys.activeProject.id));
			var pastDue = dash.renderPastDue(dash.sys.activeProject.id);
			if (pastDue != false)
			{
				el.appendChild(pastDue);
			}
			
		}
		var qholder = div({className:"qlHolder"});
		var lists = dash.data.quickLists.get({project:dash.sys.activeProject.id});
		for(var x = 0;x<(lists.length + 1);x++) {
			if (x < lists.length) {
				qholder.appendChild(div({
					className: "ql ui-corner-all",
					id: x + "ql",
					qlindex: x
				}, div({row:lists[x].row,qlid:lists[x].id},span({className:"qlLabel",events:{onclick: function(){
					dash.selectQuickList.apply(this);
					if (dash.isIckr(this.nextSibling.id)) {
						dash.editQuickList(this.nextSibling.id);
					} else {
						dash.setIckr(this.nextSibling.id);
					}
				}}},lists[x].title), dash.renderQuickList(lists[x].id))));
			}
			else {
				qholder.appendChild(div({
					className: "ql ui-corner-all emptyql",
					id: dash.createID()
				},div(span("Untitled"),ul({className:"quickList"}))));
			}
			
		}
		el.appendChild(div(span({events: {
			onclick: function () {
				dash.createQuickList();
			}
		}},"Create QuickList"),br(),qholder));
		dash.applyDragDrop("tasks");
		$(".task").dblclick(function () {
			if (dash.isIckr(this.record.id))
			{
				dash.editTask(this.record.id);
			} else {
				dash.setIckr(this.record.id);
			}
		})
		
		//$(".task").click(function () {
			//
		//})
		
		dash.applyDragDrop("quickLists");
		if (dash.sys.addnew.length > 0) {
			var el = document.getElementById(dash.sys.addnew);
			if (el) {
				el = el.parentNode;
				$((el.firstChild.className == 'qlLabel') ? el.parentNode : el).addClass("addnewhere");
			}
			
		}
		
		$('#projectSettings').click(function() {
				dash.editProject(this.record.id);	
		});
		
	},
	applyDragDrop: function(group){
		switch (group) {
			case "tasks":
				$(".quickList").sortable({
					start:function () {
						
						dash.dragdrop.doread = false;
					},
					revert: false,
					connectWith: ".quickList",
					update: function(){
						dash.dragdrop.doread = true;
						
					},
					stop:function () {
						if (dash.dragdrop.doread) {
							dash.delay(dash.readWorkArea);
						}
					}

				});
				$(".emptyql div .quickList").droppable({
					over: function(e, ui){
						if ($(ui.draggable).hasClass("task") && $(this)[0].parentNode.parentNode.className == 'ql ui-corner-all emptyql') {
							$($(this)[0].parentNode.parentNode).removeClass("emptyql");
						}
					},
					out: function(e, ui){
						if ($(ui.draggable).hasClass("task") && $(this)[0].parentNode.parentNode.className == 'ql ui-corner-all') {
							$($(this)[0].parentNode.parentNode).addClass("emptyql");
						}
					},
					drop: function(e, ui){
						if ($(ui.draggable).hasClass("task") && $(this)[0].parentNode.parentNode.className == 'ql ui-corner-all') {
							$(this).droppable("destroy");
						}
					},
					accepts: $(".quickList ul li")
				});
				$("#projects ul li").droppable({
					drop: function(e, ui){
						
						var dragItem = $(ui.draggable).get()[0];
						if (dragItem.className.split(" ")[0] == "task") {
						
						
							setTimeout(function(){
								$(".active").removeClass("active")
							}, 500);
							
							
							
							if ($(this).hasClass("trash")) {
								ui.draggable.hide('fast', function(){
									dash.send2trash(this.record.id);
								})
								
							}
							else {
								var projectid = this.record.id;
								ui.draggable.hide('fast', function(){
									dash.send2project(this.record.id, projectid);
									
								})
							}
						}
					},
					over: function(e, ui){
						var dragItem = $(ui.draggable).get()[0];
						if (dragItem.className.split(" ")[0] == "task") {
							$(this).addClass("active");	
						}
					},
					out: function(e, ui){
						$(".active").removeClass("active");
					},
					accepts: $(".quickList ul li")
				});
				break;
			case "quickLists":
				$(".qlHolder").sortable(
				TAFFY.mergeObj({
					start: function(e,ui){
						dash.dragdrop.doread = false;
					},
					revert: true,
					update: function(){
						dash.dragdrop.doread = true;
						
					},
					stop: function(){
						if (dash.dragdrop.doread) {
							dash.delay(dash.readWorkArea);
						}
					},
					containment: $(".qlHolder"),
					items: '.ql:not(.emptyql)'

				},(jQuery.browser.msie) ? {handle:".qlLabel"} : {}));
				break;
			case "projects":
				$("#projects ul").sortable(
					{
						items:"li:not(.trash)",
						start: function(){
							dash.sys.allowChangeProject = false;
							dash.dragdrop.doread = false;
						},
						revert: true,
						update: function(){
							dash.dragdrop.doread = true;
							
						},
						stop: function(){
							setTimeout(function () {dash.sys.allowChangeProject = true;},50);
							if (dash.dragdrop.doread) {
								dash.delay(dash.readWorkArea);
							}
						},
						containment:$("#projects")
					}
					);
				break;
		}
		
	},
	initProjectPop:function () {
		var title = $("#projectPop .title"), showSchedule = $("#projectPop .showSchedule"), alwaysSendToInbox = $("#projectPop .alwaysSendToInbox"), points = $("#projectPop .points"), allFields = $([]).add(title).add(alwaysSendToInbox).add(showSchedule).add(points), tips = $("#projectPop .validateTips");
			
		$(function() {
		$("#projectPop .slider").slider({
			range: "min",
			value: 1,
			min: 0,
			max: 10,
			slide: function(event, ui) {
				$("#projectPop .points").val(ui.value);
			}
		});
		$("#projectPop .points").val($("#projectPop .slider").slider("value"));
	});
			
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
		var initPop = function (config) {
			
			$("#projectPop").dialog(TAFFY.mergeObj({
				bgiframe: true,
				autoOpen: false,
				height: 400,
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
					$(this).dialog("destroy");
				}
			},config));
		}
		
		dash.createProject = function () {
			allFields.val('').removeClass('ui-state-error');
			points.val(1);
			$('#projectPop .slider').slider('option', 'value', 1);
			showSchedule.get()[0].checked = true;
			alwaysSendToInbox.get()[0].checked = false;
			initPop({
				title:"Create a new project",
				buttons: {
					'Create project': function(){
						var bValid = true;
						allFields.removeClass('ui-state-error');
						bValid = bValid && checkLength(title, "project name", 3, 16);
						
						bValid = bValid && checkRegexp(title, /^[a-z]([0-9a-z_])+$/i, "Project names may consist of a-z, 0-9, underscores, and must begin with a letter.");
						if (bValid) {
							dash.data.projects.update({
								selected: false
							});

							dash.data.projects.insert({
								id: dash.createID(),
								"title": title.val(),
								selected: true,
								showSchedule: showSchedule.get()[0].checked,
								alwaysSendToInbox: alwaysSendToInbox.get()[0].checked,
								defaultPoints: Number(points.val())
							});
							
						
							dash.renderWorkArea();
							dash.renderProjects();
							$(this).dialog("destroy");
						}
					},
					Cancel: function(){
						$(this).dialog("destroy");
					}
				}
			});
			$('#projectPop').dialog('open');
		}
		dash.editProject = function (id) {
			allFields.val('').removeClass('ui-state-error');
			var curProject = dash.sys.activeProject;
			points.val(curProject.defaultPoints);
			$('#projectPop .slider').slider('option', 'value', curProject.defaultPoints);
			title.val(curProject.title);
			showSchedule.get()[0].checked = curProject.showSchedule;
			alwaysSendToInbox.get()[0].checked = curProject.alwaysSendToInbox;
			initPop({
				buttons: {
					'Save changes': function(){
						var bValid = true;
						allFields.removeClass('ui-state-error');
						bValid = bValid && checkLength(title, "project name", 3, 16);
						
						bValid = bValid && checkRegexp(title, /^[a-z]([0-9a-z_])+$/i, "Project names may consist of a-z, 0-9, underscores, and must begin with a letter.");
						if (bValid) {
							dash.data.projects.update({
								"title": title.val(),
								selected:true,
								defaultPoints: Number(points.val()),
								showSchedule: showSchedule.get()[0].checked,
								alwaysSendToInbox: alwaysSendToInbox.get()[0].checked
							},{id:id});
							
							if (curProject.showSchedule != showSchedule.get()[0].checked) {
								dash.data.tasks.update(
									{quickList:dash.getProjectInbox(id)},
									{quickList:{like:id}}
								);
							}
							
							$(this).dialog("destroy");
							dash.renderProjects();
							dash.renderWorkArea();
							
						}
					},
					Cancel: function(){
						$(this).dialog("destroy");
					}
				},
				title: "Edit " + curProject.title
			});
			$('#projectPop').dialog('open');
		}
	},
	initQuickListPop:function () {
		var title = $("#quickListPop .title"), allFields = $([]).add(title), tips = $("#quickListPop .validateTips");
			
			
			
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
		var initPop = function (config) {
			
			$("#quickListPop").dialog(TAFFY.mergeObj({
				bgiframe: true,
				autoOpen: false,
				height: 400,
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
			},config));
		}
		
		dash.createQuickList = function () {
			allFields.val('').removeClass('ui-state-error');
			initPop({
				title:"Create a new quicklist",
				buttons: {
					'Create QuickList': function(){
						var bValid = true;
						allFields.removeClass('ui-state-error');
						bValid = bValid && checkLength(title, "name", 3, 16);
						
						bValid = bValid && checkRegexp(title, /^[a-z]([0-9a-z_])+$/i, "Names may consist of a-z, 0-9, underscores, and must begin with a letter.");
						if (bValid) {
							var curProject = dash.data.projects.first({selected: true});
							dash.data.quickLists.insert({project:curProject.id,title:title.val(),id:dash.createID()});
							dash.renderWorkArea();
							$(this).dialog("destroy");
						}
					},
					Cancel: function(){
						$(this).dialog("destroy");
					}
				}
			});
			$('#quickListPop').dialog('open');
		}
		dash.editQuickList = function (id) {
			allFields.val('').removeClass('ui-state-error');
			var curQuickList = dash.data.quickLists.first({id:id});
			title.val(curQuickList.title);
			initPop({
				buttons: {
					'Save changes': function(){
						var bValid = true;
						allFields.removeClass('ui-state-error');
						bValid = bValid && checkLength(title, "project name", 3, 16);
						
						bValid = bValid && checkRegexp(title, /^[a-z]([0-9a-z_])+$/i, "Names may consist of a-z, 0-9, underscores, and must begin with a letter.");
						if (bValid) {
							dash.data.quickLists.update({
								"title": title.val()
							},{id:id});
							
							$(this).dialog("destroy");
							dash.renderWorkArea();
						}
					},
					Cancel: function(){
						$(this).dialog("destroy");
					}
				},
				title: "Edit " + curQuickList.title
			});
			$('#quickListPop').dialog('open');
		}
	},
	initTaskPop:function () {
		var title = $("#taskPop .title"), points = $("#taskPop .points"), allFields = $([]).add(title).add(points), tips = $("#taskPop .validateTips");
	$(function() {
		$("#taskPop .slider").slider({
			range: "min",
			value: 1,
			min: 0,
			max: 10,
			slide: function(event, ui) {
				$("#taskPop .points").val(ui.value);
			}
		});
		$("#taskPop .points").val($("#taskPop .slider").slider("value"));
	});

			
			
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
		
		var initPop = function (config) {
			
			$("#taskPop").dialog(TAFFY.mergeObj({
				bgiframe: true,
				autoOpen: false,
				height: 400,
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
			},config));
		}
		
		dash.createTask = function () {
			
			allFields.val('').removeClass('ui-state-error');
			points.val(dash.sys.activeProject.defaultPoints);
			$('#taskPop .slider').slider('option', 'value', dash.sys.activeProject.defaultPoints);
			initPop({
				title:"Create a new task",
				buttons: {
					'Create Task': function(){
						var bValid = true;
						allFields.removeClass('ui-state-error');
						
						if (bValid) {
							dash.addTask(title.val(),{"points": number(points.val())});
							$(this).dialog("destroy");
						}
					},
					Cancel: function(){
						$(this).dialog("destroy");
					}
				}
			});
			$('#taskPop').dialog('open');
		}
		dash.editTask = function (id) {
			
			allFields.val('').removeClass('ui-state-error');
			var curTask = dash.data.tasks.first({id:id});
			title.val(curTask.title);
			points.val(curTask.points);
			$('#taskPop .slider').slider('option', 'value', curTask.points);
			initPop({
				buttons: {
					'Save changes': function(){
						var bValid = true;
						allFields.removeClass('ui-state-error');
						
						if (bValid) {
							if (curTask.checked & Number(points.val()) != curTask.points) {
								dash.subtractPoints(curTask.points);
								dash.addPoints(Number(points.val()));
							}
							dash.data.tasks.update({
								"title": title.val(),
								"points": Number(points.val())
							},{id:id});
							
							$(this).dialog("destroy");
							dash.renderWorkArea();
						}
					},
					Cancel: function(){
						$(this).dialog("destroy");
					}
				},
				title: "Edit Task"
			});
			$('#taskPop').dialog('open');
		}
	}
};

// define onload
window.onload = dash.init;

