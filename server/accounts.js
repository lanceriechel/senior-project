Accounts.onCreateUser(function (options, user) {
    user.manager = false;
    user.admin = false;
    user.projects = [];
    user.fulltime = true;
    if (options.profile) {
        user.profile = options.profile;
    }

    var d = new Date(),
        d2 = new Date();
    d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
    d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);
    var dStr = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear(),
        d2Str = (d2.getMonth() + 1) + "/" + d2.getDate() + "/" + d2.getFullYear();
    TimeSheet.insert(
        {
            'startDate': dStr,
            'endDate': d2Str,
            'userId': user['_id'],
            'active': 1,
            'revision': [],
            'projectEntriesArray': [],
            'type' : 1,
            'generalComment': '',
            'concerns': '',
            'submitted': false
        }
    );
    return user;
});
