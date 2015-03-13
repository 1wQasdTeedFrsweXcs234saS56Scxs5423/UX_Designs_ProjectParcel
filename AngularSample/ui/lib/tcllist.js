/*----------------------------------------------------------------------------
|
|   A simple Tcl words/list parser 
|
|   ... to be able to convert Tcl data structures (lists (of-lists)) 
|   into JS arrays (of arrays) 
|
|
|   written by Jochen Loewer
|   July 2013
|
\---------------------------------------------------------------------------*/

function TclParser(str) 
{
  this.text  = str;
  this.index = 0;
  this.len   = str.length;
  this.cur   = this.text.charAt(0);
  
  this.feedchar = function () {
    this.index++;
    this.len--;
    if (this.len < 0) throw "End of file reached";
    this.cur = this.text.charAt(this.index);
    //console.log("feedchar = '"+this.cur+"'");
  }                        
  
  this.skipWS = function () {
    while (true) {
      switch (this.cur) {
        case ' ':
        case '\t':
        case '\n':
        case '\r': this.feedchar(); break;
        default:  return;
      }
    }
  }
  
  this.parseWord = function () {
    var word = ''
    word += this.cur;
    this.feedchar()
    while (true) {
      switch (this.cur) {
        case ' ':
        case '\t':
        case '\n':
        case '\r': return word;
        default: 
          word += this.cur; 
          if (this.len == 0) return word;
          this.feedchar();
      }
    }
  }
  
  this.parseString = function () {
    var str = ''
    this.feedchar()
    while (true) {
      switch (this.cur) {
        case '"' :  this.feedchar(); return str;
        case '\\':  this.feedchar()
                    if (this.cur == '"') str += '"';
                    if (this.cur == '{') str += '{';
                    if (this.cur == '}') str += '}';
                    if (this.cur == 'n') str += "\n";
                    if (this.cur == 'r') str += "\r";
                    if (this.cur == 't') str += "\t";
                    if (this.len == 0) return str;
                    this.feedchar();
                    break;
        default: 
          str += this.cur; 
          if (this.len == 0) return str;
          this.feedchar();
      }
    }
  }
  
  this.parseList = function () {
    var str = ''
    var level = 0;
    this.feedchar()
    while (true) {
      switch (this.cur) {
        case '\\':  this.feedchar()
                    if (this.cur == '{') str += '{';
                    if (this.cur == '}') str += '}';
                    if (this.len == 0) return str;
                    this.feedchar();
                    break;
        case '{' :  str += this.cur; level++; this.feedchar(); break
        case '}' :  if (level == 0) {  
                      this.feedchar();  
                      return str; 
                    }
                    str += this.cur; level--; this.feedchar(); break
        default: 
          str += this.cur; 
          if (this.len == 0) throw "missing close brace at end"
          this.feedchar();
      }
    }
  }
  
  this.parseWords = function () {
  
    var a = new Array();
   
    while (this.len > 0) {     
      //console.log(this.len);
      this.skipWS();
      //console.log(this.len);
      if (this.len == 0) return a;
      
      if (this.cur == '"') {
        var str = this.parseString();
        a.push(str);
        //console.log(a);
      } else
      if (this.cur == '{') {
        var lst = this.parseList();
        a.push(lst);
        //console.log(a);
      } else {
        var str = this.parseWord();
        a.push(str);
        //console.log(a);
      }
    }  
    return a;
  }  
}

function Tcl2Array(str) {

  var tp = new TclParser(str);
  return tp.parseWords();
}

/*
var s1 = new TclParser( " abc def ghi  " )
console.log( s1.parseWords() )

var s2 = new TclParser( " abc def ghi" )
console.log( s2.parseWords() )

var s3 = new TclParser( " abc \"def \\\"more\" ghi" )
console.log( s3.parseWords() )

var s4 = new TclParser( " abc \"def \\\"more\"" )
console.log( s4.parseWords() )

var s4 = new TclParser( "{first col} {2nd col} {3rd col}" )
console.log( s4.parseWords() )

console.log( Tcl2Array( "{first row} {2nd row {with more} fields} {3rd col}" ) )

var s4 = new TclParser( "{first row} {2nd row {with more} fields" )
console.log( s4.parseWords() )

*/

module.exports.TclParser = TclParser;
module.exports.Tcl2Array = Tcl2Array;

