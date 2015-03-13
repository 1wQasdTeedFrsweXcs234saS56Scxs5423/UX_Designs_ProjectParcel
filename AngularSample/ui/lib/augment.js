/*----------------------------------------------------------------------------
|
|   augment standard Javascript based object 
|
|     Array 
|         has(el)
|         contains(el)
|
|     String 
|         has(el)  string to list/array conversion then calls Array.contains
|
|
|
|   written by Jochen Loewer
|   July 2013
|
\---------------------------------------------------------------------------*/

if (!Array.prototype.has) {
  Array.prototype.has = function(obj) {
    return this.indexOf(obj) !== -1
  }
}
  
if (!Array.prototype.contains) {
  Array.prototype.contains = function(obj) {
    return this.indexOf(obj) !== -1
  }
} 

if (!String.prototype.has) {
  String.prototype.has = function(obj) {
    //console.log ( this.replace(/\s\s+/g,' ').trim() );
    return this.replace(/\s\s+/g,' ').trim().split(' ').has(obj)
  }
} 
   
