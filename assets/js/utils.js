Date.prototype.getWeek = function() {
var onejan = new Date(this.getFullYear(),0,1);
return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
}


jg = TAFFY.mergeObj(jg,{
	getNBSP:function () {
		return document.createTextNode("\u00a0");
	},
	deadEnd:function () {
		// do nothing
	},
	left:function (str, n) {
		if (n <= 0) {
			return "";
		} else if (n > String(str).length) {
			return str;
		} else {
			return String(str).substring(0,n)
		}
	},
	returnDate:function (d,rs) {
		return (rs) ? jg.formatDate(d) : d;
	},
	daysDiff: function(day1, day2){
		var day1 = jg.parseDate(day1);
    if (day2) {
      var day2 = jg.parseDate(day2)
      var one_day = 1000 * 60 * 60 * 24

      return Math.ceil((day1.getTime() - day2.getTime()) / (one_day))
    } else {
      return 0;
    }
	},
	findFirstDayOfWeek:function (d,rs) {
		var rs = rs || false;
		var d = jg.parseDate(d);
		if (jg.config.firstDayOfWeek > d.getDay()) {
			return jg.returnDate(jg.subtractDays(jg.addDays(d, (d.getDay() - jg.config.firstDayOfWeek)),6),rs);
		} else {
			return jg.returnDate(jg.subtractDays(d, (d.getDay() - jg.config.firstDayOfWeek)),rs);
		}
	},
	findLastDayOfWeek:function (d,rs) {
		var rs = rs || false;
		return jg.returnDate(jg.addDays(jg.findFirstDayOfWeek(d),6),rs);
	},
	findFirstDayOfMonth:function (d,rs) {
		var rs = rs || false;
		var d = jg.parseDate(d);
		d.setDate(1);
		return jg.returnDate(d,rs);
	},
	findLastDayOfMonth:function (d,rs) {
		var rs = rs || false;
		var d = jg.parseDate(d);
		d.setDate(1);
		d.setMonth(d.getMonth()+1);
		return jg.returnDate(jg.subtractDays(d,1),rs);
	},
	findFirstDayOfYear:function (d) {
		var rs = rs || false;
		var d = jg.parseDate(d);
		d.setDate(1);
		d.setMonth(0);
		return jg.returnDate(d,rs);
	},
	findLastDayOfYear:function (d) {
		var rs = rs || false;
		var d = jg.parseDate(d);
		d.setDate(31);
		d.setMonth(11);
		return jg.returnDate(d,rs);
	},
	formatDate: function(thisDate){
		if (TAFFY.isString(thisDate)) {
			return thisDate;
		}
		var m = thisDate.getMonth() + 1;
		var d = thisDate.getDate();
		return thisDate.getFullYear() + "-" + ((m < 10) ? +"0" + "" + m : m) + "-" + ((d < 10) ? +"0" + "" + d : d);
	},
	parseDate: function (thisString) {
		if (TAFFY.isString(thisString)) {
			var datearray = thisString.split("-");
			var d = new Date(parseFloat(datearray[0]),parseFloat(datearray[1])-1,parseFloat(datearray[2]));

			return d
		} else {
			return thisString;
		}

	},
	formatDisplayDate: function(datestring,includedayofweek,includeyear){
		var includedayofweek = includedayofweek || false;
		var includeyear = includeyear || false;
		if (!TAFFY.isString(datestring)) {
			datestring = jg.formatDate(datestring);
		}

		var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		var daysofweek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		var daysofweek_short = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

		var daysofmonth = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th",	"8th",	"9th",	"10th",	"11th",	"12th",	"13th",	"14th",	"15th",	"16th",	"17th",	"18th",	"19th",	"20th",	"21st",	"22nd",	"23rd",	"24th",	"25th",	"26th",	"27th",	"28th",	"29th",	"30th",	"31st"];
		var d = jg.parseDate(datestring);
		if (includedayofweek && includeyear) {
			return (daysofweek_short[d.getDay()] + "<br>" + months[d.getMonth()] + " " + daysofmonth[(d.getDate()-1)] + ", " + d.getFullYear());
		} else if (includeyear) {
			return (months[d.getMonth()] + " " + daysofmonth[(d.getDate()-1)] + ", " + d.getFullYear());
		} else if (includedayofweek) {
			return (span(span({"className":"dow"},daysofweek_short[d.getDay()]),br(),span({"className":"dom"},(d.getMonth()+1) + "/" + d.getDate())));
		} else {
			return (months[d.getMonth()] + " " + daysofmonth[(d.getDate()-1)]);
		}
	},
	addDays: function(day, total){
		if (total > 0) {
			return new Date(jg.parseDate(day).getTime() + (86400000 * total));
		} else {
			return day;
		}
	},
	subtractDays: function(day, total){
		if (total > 0) {
			return new Date(jg.parseDate(day).getTime() - (86400000 * total));
		} else {
			return day;
		}
	},
	createID:function () {
		return new UUID().id;
	},
	generateScheduleDays: function(startDate, totalDays){
		var days = [jg.formatDate(startDate)];
		for (var x = 1; x < totalDays; x++) {
			var startDate = jg.addDays(startDate, 1);
			days[days.length] = jg.formatDate(startDate);
		}
		return days;
	},
	generateScheduleWeeks: function(startDate, totalDays){
		var days = [jg.formatDate(startDate)];
		for (var x = 1; x < totalDays; x++) {
			var startDate = jg.addDays(startDate, 1);
			days[days.length] = jg.formatDate(startDate);
		}
		return days;
	},

	delay: function (func,secs) {
		setTimeout(func,secs || 500);
	},
	isIckr:function (id) {
		if (jg.sys.ickr == id) {
			return true;
		}
		return false;
	},
	setIckr:function (id) {
		jg.sys.ickr = id;
		setTimeout(function () {jg.sys.ickr = false;},2000);
	},
	isUsername:function (sText) {
	   var ValidChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	   var IsStr=true;
	   var Char;
		if (sText.length > 36 || sText.length == 0) {
			IsStr = false;
		}

	   for (var i = 0; i < sText.length && IsStr == true; i++)
	      {
	      Char = sText.charAt(i);
	      if (ValidChars.indexOf(Char) == -1)
	         {
	         IsStr = false;
	         }
	      }

	   	return IsStr;

	},
	checkIfEnter:function (v,field) {

		if (v.keyCode == 13) {
			return false;
		}

		return true;
	},
	isName:function (sText) {
	   var ValidChars = ": 0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	   var IsStr=true;
	   var Char;

		if (sText.length > 36 || sText.length == 0) {
			IsStr = false;
		}

	   for (var i = 0; i < sText.length && IsStr == true; i++)
	      {
	      Char = sText.charAt(i);
	      if (ValidChars.indexOf(Char) == -1)
	         {
	         IsStr = false;
	         }
	      }
	   	return IsStr;

	},
	isNumber:function (sText) {
	   var ValidChars = "0123456789";
	   var IsStr=true;
	   var Char;

		if (sText.length > 36) {
			IsStr = false;
		}

	   for (var i = 0; i < sText.length && IsStr == true; i++)
	      {
	      Char = sText.charAt(i);
	      if (ValidChars.indexOf(Char) == -1)
	         {
	         IsStr = false;
	         }
	      }

	   	return IsStr;

	},
	limit:function (v,field,max,warrningField) {

		var setDisplay = function (len) {

			if (warrningField) {
				if (len >= max) {
					warrningField.innerHTML = "0 remianing";
					warrningField.style.display = "block";
				}
				else
					if ((max - 25) < len) {
						warrningField.innerHTML = (max - len) + " remaining";
						warrningField.style.display = "block";
					}
					else {
							warrningField.innerHTML = "";
							warrningField.style.display = "none";
						}
			}
		}
		var max = max || 100;
		var text = field.value;
			switch (v.keyCode) {
				case 37:
				case 40:
				case 8:
				case 38:
				case 39:
				case 46:
				case 8:
				case 9:
					 setDisplay(text.length);
					return true;
				break;
			}

		if (text.length >= max) {
			 setDisplay(text.length);
        	 return false;
		}
		 setDisplay((text.length+1));

		return true;
	}
});
