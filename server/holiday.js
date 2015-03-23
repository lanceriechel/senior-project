addOrRemoveHolidayHours = function (d, user) {
    var dStr = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear()
    var timesheet = TimeSheet.findOne({'startDate': dStr, 'userId': user['_id']});
    var holidayProject = ChargeNumbers.findOne({'is_holiday': true});

    if (!holidayProject || user['projects'].indexOf(holidayProject.id) == -1) {
        return;
    }

    var rowID = 0;
    if (timesheet.projectEntriesArray.length > 0) {
        var pEntry = timesheet.projectEntriesArray[timesheet.projectEntriesArray.length - 1];
        rowID = pEntry.EntryArray[pEntry.EntryArray.length - 1].rowID + 1;
    }

    timesheet.projectEntriesArray.forEach(function (p) {
        if (p.projectID == holidayProject.id) {
            var prEntriesArr = timesheet['projectEntriesArray'];

            for (var i = 0; i < prEntriesArr.length; i++) {
                if (prEntriesArr[i]["projectID"] == holidayProject.id) {
                    prEntriesArr.splice(i, 1);
                    break;
                }
            }

            TimeSheet.update({'_id': timesheet._id}, {
                $set: {
                    'projectEntriesArray': prEntriesArr
                },
            });
        }
    });

    var hours = [];
    var dH = new Date();
    for (var i = 0; i < 7; i++) {
        dH.setDate(d.getDate() + i);
        if (check_holiday(dH)) {
            hours.push(8);
        } else {
            hours.push(0);
        }
    }

    if (hours.indexOf(8) > -1) {
        var prEntriesArr = timesheet['projectEntriesArray'];
        var entryArray = [{
            'hours': hours,
            'Comment': "Holiday Pay",
            'rowID': rowID
        }];

        var entryArrToAdd = {
            'projectID': holidayProject.id,
            'EntryArray': entryArray,
            'Approved': false
        };

        prEntriesArr.push(entryArrToAdd);

        TimeSheet.update({'_id': timesheet._id}, {
            $set: {
                'projectEntriesArray': prEntriesArr
            },
        });
    }
}

/*
 * Holiday checker function from http://www.softcomplex.com/forum/viewthread_2814/
 */
check_holiday = function (dt_date) {

    // check simple dates (month/date - no leading zeroes)
    var n_date = dt_date.getDate(),
        n_month = dt_date.getMonth() + 1;
    var s_date1 = n_month + '/' + n_date;

    if (s_date1 == '1/1' // New Year's Day
        || s_date1 == '6/14' // Flag Day
        || s_date1 == '7/4' // Independence Day
        || s_date1 == '11/11' // Veterans Day
        || s_date1 == '12/25' // Christmas Day
    ) return true;

    // weekday from beginning of the month (month/num/day)
    var n_wday = dt_date.getDay(),
        n_wnum = Math.floor((n_date - 1) / 7) + 1;
    var s_date2 = n_month + '/' + n_wnum + '/' + n_wday;

    if (s_date2 == '1/3/1' // Birthday of Martin Luther King, third Monday in January
        || s_date2 == '2/3/1' // Washington's Birthday, third Monday in February
        || s_date2 == '5/3/6' // Armed Forces Day, third Saturday in May
        || s_date2 == '9/1/1' // Labor Day, first Monday in September
        || s_date2 == '10/2/1' // Columbus Day, second Monday in October
        || s_date2 == '11/4/4' // Thanksgiving Day, fourth Thursday in November
    ) return true;

    // weekday number from end of the month (month/num/day)
    var dt_temp = new Date(dt_date);
    dt_temp.setDate(1);
    dt_temp.setMonth(dt_temp.getMonth() + 1);
    dt_temp.setDate(dt_temp.getDate() - 1);
    n_wnum = Math.floor((dt_temp.getDate() - n_date - 1) / 7) + 1;
    var s_date3 = n_month + '/' + n_wnum + '/' + n_wday;

    if (s_date3 == '5/1/1' // Memorial Day, last Monday in May
    ) return true;

    // misc complex dates
    if (s_date1 == '1/20' && (((dt_date.getFullYear() - 1937) % 4) == 0)
    // Inauguration Day, January 20th every four years, starting in 1937.
    ) return true;

    if (n_month == 11 && n_date >= 2 && n_date < 9 && n_wday == 2
    // Election Day, Tuesday on or after November 2.
    ) return true;

    return false;
}