// borrowed from https://github.com/gui81/muster/blob/master/server/lib/accounts_ldap_server.js
var ldapjs = Meteor.npmRequire('ldapjs');
var Future = Meteor.npmRequire('fibers/future');

ldapjs.Attribute.settings.guid_format = ldapjs.GUID_FORMAT_B;

LDAP = {};
LDAP.ldap = ldapjs;
LDAP.client;

LDAP.client = ldapjs.createClient({
    url: Meteor.settings.ldap_url + Meteor.settings.ldap_search_base
});

LDAP.bind = function() {
    var binddn = "uid=" + Meteor.settings.ldap_admin_account + "," + Meteor.settings.ldap_search_base;
    var fut = new Future();

    LDAP.client.bind(binddn, Meteor.settings.ldap_admin_password, function(err) {
        if (err) {
            console.log('error = ' + err);
            fut.return(false);
        } else {
            fut.return(true);
        }
    });

    return fut.wait();
}

LDAP.search = function(username, callback) {
    var opts = {
        filter: '(&(uid=' + username + ')(objectClass=posixAccount))',
        scope: 'sub',
        attributes: ['cn', 'mail']
    };
    var fut = new Future();

    LDAP.client.search(Meteor.settings.ldap_search_base, opts, function(err, search) {
        if (err) {
            console.log(err);
            if (callback && typeof callback === "function") {
                callback(false);
            }
            fut.return(false);
        } else {
            search.on('searchEntry', function(entry) {
                var user = entry.object;
                if (callback && typeof callback === "function") {
                    callback(null, {cn: user.cn, mail: user.mail});
                }
                fut.return(true);
            });

            search.on('error', function(err) {
                throw new Meteor.Error(500, 'LDAP server error');
                fut.return(false);
            });
        }
    });

    return fut.wait();
}

LDAP.checkAccount = function(username, callback) {
    var res = LDAP.bind();
    if (!res) {
        return false;
    }
    if (LDAP.search(username, callback)) {
        return true;
    } else {
        return false;
    }
};

// use Meteor.startup whenever you need something to load after all of the
// other js files are loaded
Meteor.startup(function() {
    Meteor.methods({
        //getLdapEmployeeInfo: function(username) {
        //    console.log("get user " + username);
        //    var user_cn = null;
        //    var user_mail = null;
        //    var success = false;
        //    try {
        //        if (LDAP.checkAccount(username, function(error, result) {
        //                user_cn = result.cn;
        //                user_mail = result.mail;
        //                console.log(result);
        //                console.log(error);
        //            })) {
        //            success = true;
        //        } else {
        //            console.log("failed to get account");
        //            success = false;
        //        }
        //    } catch(e) {
        //        console.log("error");
        //        success = false;
        //    }
        //    if (success) {
        //        console.log(user_cn);
        //        console.log(user_mail);
        //        //EmployeeInfo.upsert(
        //        //    {username: username},
        //        //    {username: username,
        //        //        cn: user_cn,
        //        //        mail: user_mail
        //        //    }
        //        //);
        //        //console.log(EmployeeInfo.find({}).fetch());
        //        return true;
        //    } else {
        //        return false;
        //    }
        //},
        authenticateLdapEmployee : function(username, password){
            var binddn = "uid=" + username + "," + Meteor.settings.ldap_search_base;
            var fut = new Future();

            LDAP.client.bind(binddn, password, function(err) {
                if (err) {
                    console.log('error = ' + err);
                    fut.return(false);
                } else {
                    fut.return(true);
                }
            });

            return fut.wait();
        }
    });
});
