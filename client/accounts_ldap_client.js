// borrowed from https://raw.githubusercontent.com/gui81/muster/master/client/lib/accounts_ldap_client.js

// this password should be encrypted somehow when sent to the server
authenticateLdapEmployee = function(username, password) {
    Meteor.call('authenticateLdapEmployee', username, password, function(err, user){
        if(err){
            console.log("authentification error");
            // needs another way to alert this error
            alert("LDAP error contact your system admin");
            Session.set('loggingIn', false);
        } else {
            if(user){
                var id = null;
                var dbUser = Meteor.users.findOne({username:username})
		var admin = false;
		var manager = false;
		if(user.ou == "manager"){
			manager = true;
		}
		if(user.ou == "admin"){
			admin = true;
		}
                if(dbUser){
                    id = dbUser._id;
                    // needs to update only ldap fields in case of change

		    Meteor.users.update({
			_id: dbUser._id
		    },{ $set: {
                        manager: manager,
                        admin: admin
		    }});
                } else {
                    id = Meteor.users.insert({
                        username: username,
                        cn: user.cn,
                        manager: manager,
                        admin: admin,
                        projects: [],
                        fulltime: true
                    });
		    ActiveDBService.MakeTimesheetForNewUser(id, Meteor.users.findOne({username:username}) );
		    
                }
           	// needs to set current user id
	        Session.set('LdapId',id);
		Session.set('current_page', 'time_sheet');
            } else{
		$('#LDAPusername').parent().addClass('has-error');
            	$('#LDAPusername').tooltip({
                    title: "Incorrect username or password",
                    trigger: 'hover',
                    animation: false
                });
            	$('#LDAPpassword').parent().addClass('has-error');
           	 $('#LDAPpassword').tooltip({
                    title: "Incorrect username or password",
                    trigger: 'hover',
                    animation: false
                });
	    }

        }
    });
};

