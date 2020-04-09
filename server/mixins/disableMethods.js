module.exports = function (Model, options) {
  if (Model && Model.sharedClass) {
    var methodsToExpose = options.expose || [];
    //var modelName = Model.sharedClass.name;
    var methods = Model.sharedClass.methods();
    var relationMethods = [];
    var hiddenMethods = [];
    try {
      Object.keys(Model.definition.settings.relations).forEach(function (relation) {
        
        relationMethods.push({name: '__findById__' + relation, isStatic: false});
        relationMethods.push({name: '__destroyById__' + relation, isStatic: false});
        relationMethods.push({name: '__updateById__' + relation, isStatic: false});
        relationMethods.push({name: '__exists__' + relation, isStatic: false});
        relationMethods.push({name: '__link__' + relation, isStatic: false});
        relationMethods.push({name: '__get__' + relation, isStatic: false});
        relationMethods.push({name: '__create__' + relation, isStatic: false});
        relationMethods.push({name: '__update__' + relation, isStatic: false});
        relationMethods.push({name: '__destroy__' + relation, isStatic: false});
        relationMethods.push({name: '__unlink__' + relation, isStatic: false});
        relationMethods.push({name: '__count__' + relation, isStatic: false});
        relationMethods.push({name: '__delete__' + relation, isStatic: false});
        relationMethods.push({name: 'prototype.verify', isStatic: false});
        relationMethods.push({name: 'prototype.updateAttributes', isStatic: false});
        relationMethods.push({name: 'prototype.__findById__' + relation, isStatic: false});
        relationMethods.push({name: 'prototype.__destroyById__' + relation, isStatic: false});
        relationMethods.push({name: 'prototype.__updateById__' + relation, isStatic: false});
        relationMethods.push({name: 'prototype.__exists__' + relation, isStatic: false});
        relationMethods.push({name: 'prototype.__link__' + relation, isStatic: false});
        relationMethods.push({name: 'prototype.__get__' + relation, isStatic: false});
        relationMethods.push({name: 'prototype.__create__' + relation, isStatic: false});
        relationMethods.push({name: 'prototype.__update__' + relation, isStatic: false});
        relationMethods.push({name: 'prototype.__destroy__' + relation, isStatic: false});
        relationMethods.push({name: 'prototype.__unlink__' + relation, isStatic: false});
        relationMethods.push({name: 'prototype.__count__' + relation, isStatic: false});
        relationMethods.push({name: 'prototype.__delete__' + relation, isStatic: false});
       


      });
    } catch (err) {
      console.log(err); // TODO: log!
      throw err;
    }
    methods.concat(relationMethods).forEach(function (method) {
      var methodName = method.name;
      if (methodsToExpose.indexOf(methodName) < 0) {
        hiddenMethods.push(methodName);
        Model.disableRemoteMethodByName(methodName, method.isStatic);
      }
    });
    //DEBUG:
    //  if(hiddenMethods.length > 0) {
    //      console.log('\nRemote mehtods hidden for', modelName, ':', hiddenMethods.join(', '), '\n');
    //  }
  }
};
