(function () {

/////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                         //
// packages/npm-container/index.js                                                         //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
                                                                                           //
Meteor.npmRequire = function(moduleName) { // 79                                           // 1
var module = Npm.require(moduleName); // 80                                                // 2
return module; // 81                                                                       // 3
}; // 82                                                                                   // 4
// 83                                                                                      // 5
Meteor.require = function(moduleName) { // 84                                              // 6
console.warn('Meteor.require is deprecated. Please use Meteor.npmRequire instead!'); // 85 // 7
return Meteor.npmRequire(moduleName); // 86                                                // 8
};                                                                                         // 9
                                                                                           // 10
/////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
