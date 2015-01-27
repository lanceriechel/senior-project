
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
    'click .btn': function(){
        var startDate = Session.get('startDate');
        var startDate2 = new Date(startDate);
        var startDate3 = startDate2.toLocaleDateString();

        TimeSheet.find({'startDate':startDate3}).forEach(
            function(sheet) {
                var userID = sheet.userId;
                generalHelpers.makePDF(startDate3, userID);
            });
    }
});

Template.current_jobs.events({
    'click button': function (event) {
        var job = Jobs.findOne({_id: event.target.id});
        if (job){
            Meteor.call('deleteJob', job);
        }
        Jobs.remove({_id: event.target.id});
    }
});

Template.add_new_job.helpers({
    hours: function () {
        var hours = [];
        for (var i = 0; i <= 23; i++) {
            var hour = '';
            if (i < 10) {
                hour = '0'
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
            if (evt.target.childNodes.length == 1) {
                var div = document.createElement('div');
                div.className = 'glyphicon glyphicon-ok';
                div.style.float = 'right';
                evt.target.appendChild(div);

                if (currentText.charCodeAt(0) == 10 || currentText.charCodeAt(0) == 32) {
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
        var id = Jobs.insert({type: jobType, details: {type:detailType,schedule_text:'at '+ time + ' on ' + jobDays}});
        Meteor.call('scheduleJob', Jobs.findOne({_id: id}));
    }
});
