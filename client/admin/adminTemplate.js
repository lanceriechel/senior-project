
$('#timepicker').timepicker({
    minuteStep: 1,
    template: 'modal',
    appendWidgetTo: 'body',
    showSeconds: true,
    showMeridian: false,
    defaultTime: false
});

Template.current_jobs.helpers({
    jobsList: function () {
        return Jobs.find();
    }
});

Template.all_pdfs.events({
    'click .btn': function () {
        var startDate = Session.get('startDate');
        var startDate2 = new Date(startDate);
        var startDate3 = startDate2.toLocaleDateString();

        TimeSheet.find({'startDate': startDate3}).forEach(
            function(sheet) {
                var userID = sheet.userId;
                generalHelpers.makePDF(startDate3, userID);
            }
        );
    }
});

Template.month_picker.helpers({
    currentMonth: function () {
        var currentTime = new Date();
        if (!Session.get('statusDate')) {
            currentTime.setDate(1);
            Session.set('statusDate', currentTime);
        } else {
            currentTime = Session.get('statusDate');
        }
        var month = currentTime.getMonth() + 1;
        var year = currentTime.getFullYear()

        return month + "/" + year;
    }
});

Template.month_picker.events({
    'click .prevWeek': function () {
        var startDate = Session.get("statusDate");

        var d2 = new Date(startDate);
        var mo = d2.getMonth() - 1;
        if (mo === -1) {
            mo = 11;
            d2.setYear(d2.getFullYear() - 1);
        }
        d2.setMonth(mo);

        Session.set("statusDate", d2);
    },
    'click .nextWeek': function () {
        var startDate = Session.get("statusDate");

        var d2 = new Date(startDate);
        var mo = d2.getMonth() + 1;
        if (mo == 12) {
            mo = 0;
            d2.setYear(d2.getFullYear() + 1);
        }
        d2.setMonth(mo);

        //don't advance past current month
        if (d2 > generalHelpers.getCurrentDate()) {
            return;
        }

        Session.set("statusDate", d2);
    }
});

Template.monthly_status.events({
    'click .btn':function(){
        var date = Session.get('statusDate');
        var month = date.getMonth()+1;
        var year = date.getFullYear();

        var startDate = new Date(month + '/' + '1' + '/' + year);
        if (month === 11) {
            month = -1;
        }
        var endDate = new Date(month + 1 + '/' + '1' + '/' + year);
        endDate.setDate(endDate.getDate() - 1);

        var comments = [];
        var rawComments = '';
        var docBody = [];

        TimeSheet.find({'submitted':true}).forEach(
            function (sheet) {
                var sheetStartDate = new Date(sheet.startDate);
                var sheetEndDate = new Date(sheet.endDate);
                var prEntriesArray = sheet.projectEntriesArray;

                var employee = Meteor.users.findOne({'_id': sheet.userId});
                var employeeName = employee.username;

                if (((sheetStartDate > startDate) && (sheetStartDate < endDate)) ||
                    ((sheetEndDate < endDate) && (sheetEndDate > startDate))) {
                    for(var i=0; i<prEntriesArray.length; i++){
                        var project = prEntriesArray[i].projectId;
                        var project2 = ChargeNumbers.findOne({'_id': project});
                        var entryArray = prEntriesArray[i].EntryArray;
                        for(var j=0; j<entryArray.length; j++){
                            comments.push([project2.name,employeeName,entryArray[j].Comment]);
                        }    
                    }
                }
            });
        function Comparator(a,b){
            if (a[0] < b[0]){
                return -1;
            }
            if (a[0] > b[0]) {
                return 1;
            }
            return 0;
        }


        comments = comments.sort(Comparator);
        var lastProject = '';

        docBody.push({ text: 'Monthly Status Report for ' +month + '/' + year, fontSize: 30})

        for(var k=0; k<comments.length; k++){
            var comment = comments[k][2];
            if(lastProject !== comments[k][0]){
                rawComments += '\n'+ comments[k][0] + '\n';
                docBody.push({ text: '\n'+ comments[k][0] + '\n\n', fontSize: 20});
            }
            rawComments+= comment +'\n';
            docBody.push({text: comment, fontSize:14});

            lastProject = comments[k][0];
        }


        var docDefinition = { 
            content: [docBody]
        };
      pdfMake.createPdf(docDefinition).download('Monthly Status for ' +month + '\/' + year);
    }

});

Template.current_jobs.events({
    'click button': function (event) {
        var job = Jobs.findOne({_id: event.target.id});
        if (job){
            Meteor.call('deleteJob', job);
        }
    }
});

Template.add_new_job.helpers({
    hours: function () {
        var hours = [];
        for (var i = 0; i <= 23; i++) {
            var hour = '';
            if (i < 10) {
                hour = '0';
            }
            hours.push(hour + i);
        }
        return hours;
    }
});

Template.add_new_job.events({
    'click a': function (evt) {
        var day = evt.target.childNodes[0].nodeValue;

        var currentText = evt.target.parentNode.parentNode.parentNode.childNodes[1].childNodes[0].nodeValue;

        if (evt.target.classList.contains('day')) {
            if (evt.target.childNodes.length === 1) {
                var div = document.createElement('div');
                div.className = 'glyphicon glyphicon-ok';
                div.style.float = 'right';
                evt.target.appendChild(div);

                if (currentText.charCodeAt(0) === 10 || currentText.charCodeAt(0) === 32) {
                    currentText = day;
                } else {
                    currentText = currentText.replace(', and ', ', ');
                    currentText = currentText.trim();
                    currentText += ', and ' + day;
                }
            } else {
                evt.target.removeChild(evt.target.childNodes[1]);
                currentText = currentText.replace(', and ' + day, '');
                currentText = currentText.replace(', ' + day, '');
                currentText = currentText.replace(day + ', and ', '');
                currentText = currentText.replace(day + ', ', '');
                currentText = currentText.replace(day + ' ', '');

                var n = currentText.indexOf(', and ');
                if (n < 0) {
                    n = currentText.lastIndexOf(', ');
                    if (n >= 0 && n + currentText.length >= currentText.length) {
                        currentText = currentText.substring(0, n) + currentText.substring(n, currentText.length).replace(', ', ', and ');
                    }
                }

            }
            evt.target.parentNode.parentNode.parentNode.childNodes[1].childNodes[0].nodeValue = currentText + ' ';
        }else{
            evt.target.parentNode.parentNode.parentNode.childNodes[1].childNodes[0].nodeValue = day + ' ';
        }

        evt.preventDefault();
    },
    'click #submit_job': function () {
        var jobType = document.getElementById('jobType').value.toLowerCase();
        var detailType = document.getElementById('detailType').value.toLowerCase();
        var time = $('#timepicker1').val();
        var jobDays = document.getElementById('dropdownMenuDays').textContent.trim();
        Meteor.call('insertJob', jobType, detailType, 'at '+ time + ' on ' + jobDays);
    }
});
