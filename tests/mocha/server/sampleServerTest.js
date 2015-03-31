if (!(typeof MochaWeb === 'undefined')){
  MochaWeb.testOnly(function(){
    describe("Server initialization", function(){
      it("should have a Meteor version defined", function(){
        chai.assert(Meteor.release);
      });
    });

    describe("Testing accessing server methods", function(){
      it("Adding a dummy user", function(){
      	Meteor.call('insertDummyUser');
        chai.assert(Meteor.users.find());
      });
    });
  });
}
