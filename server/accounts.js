Accounts.onCreateUser(function (options, user) {
    user.manager = false;
    user.admin = false;
    user.projects = [];
    user.fulltime = true;
    if (options.profile)
        user.profile = options.profile;
    return user;
});