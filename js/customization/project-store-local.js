(function(){
  'use strict';
  window.EP=window.EP||{};
  var DB_NAME='escaparates-pro-projects';var DB_VERSION=1;var STORE='projects';var dbPromise=null;
  function open(){if(dbPromise)return dbPromise;dbPromise=new Promise(function(resolve,reject){var req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=function(){var db=req.result;if(!db.objectStoreNames.contains(STORE)){var s=db.createObjectStore(STORE,{keyPath:'id'});s.createIndex('updatedAt','updatedAt');s.createIndex('templateId','templateId');}};req.onsuccess=function(){resolve(req.result