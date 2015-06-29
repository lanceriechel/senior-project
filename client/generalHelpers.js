generalHelpers = {
  getSunday: function () {
    var d = new Date();
    d.setDate((d.getDate() - (d.getDay() + 6) % 7 ) - 1);
    return d.toLocaleDateString();
  },
  getSaturday: function () {
    var d = new Date();
    d.setDate((d.getDate() - (d.getDay() + 6) % 7 ) + 6);
    return d.toLocaleDateString();
  },
  getCurrentDate: function () {
    var d = new Date();
    d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
    return d;
  },
  getMonthName: function (i) {
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return monthNames[i];
  },
  MakeTimesheetForNewUser: function (id, user) {
    Meteor.call('getCurrentWeekObject', function (err, dateObject) {
      if (!err) {
        var dStr = (dateObject.start.getMonth() + 1) + '/' + dateObject.start.getDate() + '/' + dateObject.start.getFullYear(),
            d2Str = (dateObject.end.getMonth() + 1) + '/' + dateObject.end.getDate() + '/' + dateObject.end.getFullYear();

        var projectApprovalArray = [];
        user.projects.forEach(function (pId) {
          var project = ChargeNumbers.findOne({_id: pId});
          if (!project) {
            Meteor.call("removeEmployeeFromProject", user._id, pId);
            return;
          }
          projectId = project._id;
          projectApprovalArray.push({
            projectId: projectId,
            approved: false,
            sentBack: false,
            comment: ''
          });
        });

        Meteor.call("insertTimesheet", dStr, d2Str, id, 1, [], [], 1, '', false, projectApprovalArray, '', false);

      }
    });
  },
  makePDF: function (startDate, userID) {
    var employee = Meteor.users.findOne({'_id': userID});
    var employeename = employee.username;
    var sheet = TimeSheet.findOne({'startDate': startDate, 'userId': userID});
    var projectEntries = sheet['projectEntriesArray'];
    var revision = sheet['revision'];

    var rows = [];
    var commentRows = [];
    var issueRows = [];
    var genRows = [];
    var history = [];
    history.push([
      'Timestamp',
      'Action'
    ]);
    genRows.push([
      'Comment',
      'Concerns'
    ]);
    genRows.push([
      sheet['generalComment'],
      sheet['concerns'],
    ]);
    issueRows.push([
      'Project',
      'This Week\'s Issues',
      'Goals for Next Week',
    ]);
    commentRows.push([
      'Project',
      'Comment',
    ]);
    rows.push([
      'Project',
      'S',
      'M',
      'T',
      'W',
      'T',
      'F',
      'S',
    ]);
    for (j = 0; j < revision.length; j++) {
      var timestamp = revision[j].timestamp.getDate() + "/"
          + (revision[j].timestamp.getMonth() + 1) + "/"
          + revision[j].timestamp.getFullYear() + " @ "
          + revision[j].timestamp.getHours() + ":"
          + revision[j].timestamp.getMinutes();
      var type = revision[j]['type'];
      var managerhist = revision[j]['manager'];
      var employeehist = revision[j]['employee'];
      var projecthist = revision[j]['project'];
      var totalHours = revision[j]['totalHours'];
      var comment = revision[j]['comment'];
      var s = '';
      if (employeehist == null) {
        employeehist = managerhist;
      }
      if (comment == null) {
        s = employeehist + ' submitted ' + totalHours.toString() + ' hours for project ' + projecthist;
      } else {
        s = employeehist + ' submitted ' + totalHours.toString() + ' hours for project ' + projecthist + ' with message \"' + comment + '\"';
      }
      history.push([
        timestamp,
        s
      ]);
    }
    var maxRow = -1;
    for (i = 0; i < projectEntries.length; i++) {
      var project = projectEntries[i]['projectId'];
      var project2 = ChargeNumbers.findOne({'_id': project});
      var EntryArray = projectEntries[i]['EntryArray'];
      var next = projectEntries[i]['next'];
      if (next == null) {
        next = " ";
      }
      var issues = projectEntries[i]['issues'];
      if (issues == null) {
        issues = " ";
      }
      // var rejectMessage = projectEntries[i]['rejectMessage'];
      // if(rejectMessage == null){
      //  rejectMessage = " ";
      // }
      issueRows.push([
        project2.name,
        issues,
        next,
      ]);
      for (j = 0; j < EntryArray.length; j++) {
        var comment = EntryArray[j]['Comment'];
        var rowID = EntryArray[j]['rowID'];
        if (rowID > maxRow) {
          maxRow = rowID;
        }
        var hours = EntryArray[j]['hours'];
        rows.push([
          project2.name,
          hours[0].toString(),
          hours[1].toString(),
          hours[2].toString(),
          hours[3].toString(),
          hours[4].toString(),
          hours[5].toString(),
          hours[6].toString(),

        ]);
        commentRows.push([
          project2.name,
          comment
        ]);
      }
    }

    var docDefinition = {
      content: [
        {
          text: employeename + '\'s Timesheet', fontSize: 20,

        },
        {
          text: ' ', fontSize: 17,

        },
        {
          text: 'Hours ', fontSize: 15,

        },
        {
          text: ' ', fontSize: 17,

        },
        {
          table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 1,
            widths: ['*', '*', '*', '*', '*', '*', '*', '*'],

            body: rows
          }
        },
        {
          text: ' ', fontSize: 17,

        },
        {
          text: 'Daily Comments ', fontSize: 15,

        },
        {
          text: ' ', fontSize: 17,

        },
        {
          table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 1,
            widths: ['*', '*'],

            body: commentRows
          }
        },
        {
          text: ' ', fontSize: 17,

        },
        {
          text: 'Weekly Comments', fontSize: 15,

        },
        {
          text: ' ', fontSize: 17,

        },
        {
          table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 1,
            widths: ['*', '*', '*'],

            body: issueRows
          }
        },
        {
          text: ' ', fontSize: 17,

        },
        {
          text: 'General Comments', fontSize: 15,

        },
        {
          text: ' ', fontSize: 17,

        },
        {
          table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 1,
            widths: ['*', '*'],

            body: genRows
          }
        },
        {
          text: ' ', fontSize: 17,

        },
        {
          text: 'History', fontSize: 15,

        },
        {
          text: ' ', fontSize: 17,

        },
        {
          table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 1,
            widths: ['*', '*'],

            body: history
          }
        },


      ]
    };
    pdfMake.createPdf(docDefinition).download(employeename + ' , ' + startDate);
  }
};
